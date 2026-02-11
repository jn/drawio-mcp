#!/usr/bin/env node

import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import cors from "cors";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Read the browser bundles once at startup and inline them into the HTML
const extAppsEntry = fileURLToPath(import.meta.resolve("@modelcontextprotocol/ext-apps/app-with-deps"));
const appWithDepsRaw = fs.readFileSync(extAppsEntry, "utf-8");

// The bundle is ESM: ends with export{..., oc as App, ...}.
// We can't use <script type="module"> (export aliases aren't local vars)
// and Blob URL import() fails in sandboxed iframes without allow-same-origin.
// Fix: strip the export statement and create a local `App` alias.
const exportMatch = appWithDepsRaw.match(/export\s*\{([^}]+)\}\s*;?\s*$/);
if (!exportMatch) throw new Error("Could not find export statement in app-with-deps.js");
const exportEntries = exportMatch[1].split(",").map(e => {
  const parts = e.trim().split(/\s+as\s+/);
  return { local: parts[0], exported: parts[1] || parts[0] };
});
const appEntry = exportEntries.find(e => e.exported === "App");
if (!appEntry) throw new Error("Could not find App export in app-with-deps.js");
const appWithDepsJs = appWithDepsRaw.slice(0, exportMatch.index)
  + `\nvar App = ${appEntry.local};\n`;

const pakoEntry = fileURLToPath(import.meta.resolve("pako"));
const pakoDeflateJs = fs.readFileSync(
  path.join(path.dirname(pakoEntry), "..", "dist", "pako_deflate.min.js"),
  "utf-8"
);

/**
 * Build the self-contained HTML string that renders diagrams.
 * All dependencies (ext-apps App class, pako deflate) are inlined
 * so the HTML works in a sandboxed iframe with no extra fetches.
 */
function buildHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>draw.io Diagram</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }

      html {
        color-scheme: light dark;
      }

      body {
        font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      }

      #loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        font-size: 14px;
        color: var(--color-text-secondary, #666);
      }

      .spinner {
        width: 20px; height: 20px;
        border: 2px solid var(--color-border, #e0e0e0);
        border-top-color: var(--color-text-primary, #1a1a1a);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      #diagram-container {
        display: none;
        min-width: 200px;
      }
      #diagram-container .mxgraph { width: 100%; max-width: 100%; color-scheme: light dark !important; }

      #toolbar {
        display: none;
        padding: 8px;
        gap: 6px;
      }
      #toolbar button, #toolbar a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        font-size: 12px;
        font-family: inherit;
        border: 1px solid var(--color-border, #d0d0d0);
        border-radius: 6px;
        background: var(--color-bg-primary, #fff);
        color: var(--color-text-primary, #1a1a1a);
        cursor: pointer;
        text-decoration: none;
        transition: background 0.15s;
      }
      #toolbar button:hover, #toolbar a:hover {
        background: var(--color-bg-secondary, #f5f5f5);
      }

      #error {
        display: none;
        padding: 16px; margin: 16px;
        border: 1px solid #e74c3c;
        border-radius: 8px;
        background: #fdf0ef;
        color: #c0392b;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <div id="loading"><div class="spinner"></div>Loading diagram...</div>
    <div id="error"></div>
    <div id="diagram-container"></div>
    <div id="toolbar">
      <button id="open-drawio">Open in draw.io</button>
      <button id="fullscreen-btn">Fullscreen</button>
    </div>

    <!-- draw.io viewer from CDN (async) -->
    <script src="https://viewer.diagrams.net/js/viewer-static.min.js" async></script>

    <!-- pako deflate (inlined, for #create URL generation) -->
    <script>${pakoDeflateJs}</script>

    <!-- MCP Apps SDK (inlined, exports stripped, App alias added) -->
    <script>
${appWithDepsJs}

// --- Client-side app logic ---

const loadingEl  = document.getElementById("loading");
const errorEl    = document.getElementById("error");
const containerEl = document.getElementById("diagram-container");
const toolbarEl  = document.getElementById("toolbar");
const openDrawioBtn  = document.getElementById("open-drawio");
const fullscreenBtn  = document.getElementById("fullscreen-btn");
var drawioEditUrl = null;

var app = new App({ name: "draw.io Diagram Viewer", version: "1.0.0" });

function showError(message) {
  loadingEl.style.display = "none";
  errorEl.style.display = "block";
  errorEl.textContent = message;
}

function waitForGraphViewer() {
  return new Promise((resolve, reject) => {
    if (typeof GraphViewer !== "undefined") { resolve(); return; }
    let attempts = 0;
    const maxAttempts = 100; // 10 s
    const interval = setInterval(() => {
      attempts++;
      if (typeof GraphViewer !== "undefined") { clearInterval(interval); resolve(); }
      else if (attempts >= maxAttempts) { clearInterval(interval); reject(new Error("draw.io viewer failed to load")); }
    }, 100);
  });
}

function generateDrawioEditUrl(xml) {
  const encoded = encodeURIComponent(xml);
  const compressed = pako.deflateRaw(encoded);
  const base64 = btoa(Array.from(compressed, (b) => String.fromCharCode(b)).join(""));
  const createObj = { type: "xml", compressed: true, data: base64 };
  return "https://app.diagrams.net/#create=" + encodeURIComponent(JSON.stringify(createObj));
}

async function renderDiagram(xml) {
  try { await waitForGraphViewer(); }
  catch(e) { showError("Failed to load the draw.io viewer. Check your network connection."); return; }

  containerEl.innerHTML = "";
  const config = { highlight: "#0000ff", nav: true, resize: true, toolbar: "zoom layers", xml: xml };
  const graphDiv = document.createElement("div");
  graphDiv.className = "mxgraph";
  graphDiv.setAttribute("data-mxgraph", JSON.stringify(config));
  containerEl.appendChild(graphDiv);

  loadingEl.style.display = "none";
  containerEl.style.display = "block";
  toolbarEl.style.display = "flex";
  drawioEditUrl = generateDrawioEditUrl(xml);

  GraphViewer.processElements();

  // GraphViewer renders asynchronously; nudge the SDK's ResizeObserver
  // by explicitly sending size after the SVG is in the DOM.
  requestAnimationFrame(() => {
    var el = document.documentElement;
    var w = Math.ceil(el.scrollWidth);
    var h = Math.ceil(el.scrollHeight);
    if (app.sendSizeChanged) app.sendSizeChanged({ width: w, height: h });
  });
}

app.ontoolresult = (result) => {
  const textBlock = result.content?.find((c) => c.type === "text");
  if (textBlock && textBlock.type === "text") { renderDiagram(textBlock.text); }
  else { showError("No diagram XML received."); }
};

openDrawioBtn.addEventListener("click", () => { if (drawioEditUrl) app.openLink({ url: drawioEditUrl }); });
fullscreenBtn.addEventListener("click", () => { app.requestDisplayMode({ mode: "fullscreen" }); });

app.connect();
    </script>
  </body>
</html>`;
}

// Pre-build the HTML once
const html = buildHtml();

/**
 * Create a new MCP server instance with the create_diagram tool + UI resource.
 */
function createServer() {
  const server = new McpServer({
    name: "drawio-mcp-app",
    version: "1.0.0",
  });

  const resourceUri = "ui://drawio/mcp-app.html";

  registerAppTool(
    server,
    "create_diagram",
    {
      title: "Create Diagram",
      description:
        "Creates and displays an interactive draw.io diagram. Pass draw.io XML (mxGraphModel format) to render it inline.",
      inputSchema: {
        xml: z
          .string()
          .describe(
            "The draw.io XML content in mxGraphModel format to render as a diagram"
          ),
      },
      _meta: { ui: { resourceUri } },
    },
    async ({ xml }) => {
      return { content: [{ type: "text", text: xml }] };
    }
  );

  registerAppResource(
    server,
    "Draw.io Diagram Viewer",
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      return {
        contents: [
          {
            uri: resourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  resourceDomains: ["https://viewer.diagrams.net"],
                  connectDomains: ["https://viewer.diagrams.net"],
                },
              },
            },
          },
        ],
      };
    }
  );

  return server;
}

// --- Transport setup ---

async function startStreamableHTTPServer() {
  const port = parseInt(process.env.PORT ?? "3001", 10);
  const app = createMcpExpressApp({ host: "0.0.0.0" });
  app.use(cors());

  app.all("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const httpServer = app.listen(port, () => {
    console.log(`MCP App server listening on http://localhost:${port}/mcp`);
  });

  const shutdown = () => {
    console.log("\nShutting down...");
    httpServer.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function startStdioServer() {
  await createServer().connect(new StdioServerTransport());
}

async function main() {
  if (process.argv.includes("--stdio")) {
    await startStdioServer();
  } else {
    await startStreamableHTTPServer();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
