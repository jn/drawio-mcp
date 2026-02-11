# Draw.io MCP Server

The official [draw.io](https://www.draw.io) MCP (Model Context Protocol) server that enables LLMs to create and open diagrams in the draw.io editor.

## Three Ways to Create Diagrams

This repository offers three approaches for integrating draw.io with AI assistants. Pick the one that fits your setup:

| | [MCP Tool Server](#mcp-tool-server) | [MCP App Server](#mcp-app-server) | [Project Instructions](#alternative-project-instructions-no-mcp-required) |
|---|---|---|---|
| **How it works** | Opens diagrams in your browser | Renders diagrams inline in chat | Claude generates draw.io URLs via Python |
| **Diagram output** | draw.io editor in a new tab | Interactive viewer embedded in conversation | Clickable link to draw.io |
| **Requires installation** | Yes (npm package) | Yes (Node.js server + tunnel) | No — just paste instructions |
| **Supports XML, CSV, Mermaid** | ✅ All three | XML only | ✅ All three |
| **Editable in draw.io** | ✅ Directly | Via "Open in draw.io" button | Via link |
| **Works with** | Claude Desktop, any MCP client | Claude.ai, VS Code, any MCP Apps host | Claude.ai (with Projects) |
| **Best for** | Local desktop workflows | Inline previews in chat | Quick setup, no install needed |

---

## MCP Tool Server

The original MCP server that opens diagrams directly in the draw.io editor.

### Features

- **Open XML diagrams**: Load native draw.io/mxGraph XML format
- **Import CSV data**: Convert tabular data to diagrams (org charts, flowcharts, etc.)
- **Render Mermaid.js**: Transform Mermaid syntax into editable draw.io diagrams
- **URL support**: Fetch content from URLs automatically
- **Customizable display**: Lightbox mode, dark mode, and more

### Installation

#### Using npx (recommended)

```bash
npx @drawio/mcp
```

#### Global installation

```bash
npm install -g @drawio/mcp
drawio-mcp
```

#### From source

```bash
git clone https://github.com/jgraph/drawio-mcp.git
cd drawio-mcp/mcp-tool-server
npm install
npm start
```

### Configuration

#### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["@drawio/mcp"]
    }
  }
}
```

#### Other MCP Clients

Configure your MCP client to run the server via stdio:

```bash
npx @drawio/mcp
```

### Tools

#### `open_drawio_xml`

Opens the draw.io editor with XML content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | Draw.io XML or URL to XML |
| `lightbox` | boolean | No | Read-only view mode (default: false) |
| `dark` | string | No | "auto", "true", or "false" (default: "auto") |

#### `open_drawio_csv`

Opens the draw.io editor with CSV data converted to a diagram.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | CSV content or URL to CSV |
| `lightbox` | boolean | No | Read-only view mode (default: false) |
| `dark` | string | No | "auto", "true", or "false" (default: "auto") |

#### `open_drawio_mermaid`

Opens the draw.io editor with a Mermaid.js diagram.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | Mermaid syntax or URL |
| `lightbox` | boolean | No | Read-only view mode (default: false) |
| `dark` | string | No | "auto", "true", or "false" (default: "auto") |

### Example Prompts

- "Use `open_drawio_mermaid` to create a sequence diagram showing OAuth2 authentication flow"
- "Use `open_drawio_csv` to create an org chart: CEO → CTO, CFO; CTO → 3 Engineers"
- "Use `open_drawio_xml` to create a detailed AWS architecture diagram with VPC, subnets, and security groups"

> **Tip:** Claude Desktop may have multiple ways to create diagrams. To ensure it uses the draw.io MCP, mention the tool name explicitly or add a system instruction:
> *"Always use the draw.io MCP tools to create diagrams."*

### How It Works

1. The MCP server receives diagram content (XML, CSV, or Mermaid)
2. Content is compressed using pako deflateRaw and encoded as base64
3. A draw.io URL is generated with the `#create` hash parameter
4. The URL is returned to the LLM, which can present it to the user
5. Opening the URL loads draw.io with the diagram ready to view/edit

---

## MCP App Server

The MCP App server renders draw.io diagrams **inline** in AI chat interfaces using the [MCP Apps](https://modelcontextprotocol.io/docs/extensions/apps) protocol. Instead of opening a browser tab, diagrams appear directly in the conversation as interactive iframes.

### How It Works

1. The LLM calls the `create_diagram` tool with draw.io XML
2. The host fetches the UI resource and renders it in a sandboxed iframe
3. The diagram is rendered using the official [draw.io viewer](https://viewer.diagrams.net)
4. The user sees an interactive diagram inline with zoom, pan, and layers support

### Tool: `create_diagram`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `xml` | string | Yes | draw.io XML in mxGraphModel format |

The rendered diagram includes:
- Interactive zoom, pan, and navigation
- Layer toggling and lightbox mode
- "Open in draw.io" button to edit the diagram in the full editor
- Fullscreen mode

### Installation

```bash
cd mcp-app-server
npm install
```

### Running

Start the HTTP server (for Claude.ai and other web-based hosts):

```bash
npm start
```

The server listens on `http://localhost:3001/mcp` by default. Set the `PORT` environment variable to change the port.

### Connecting to Claude.ai

Since Claude.ai needs a public URL, use a tunnel:

```bash
npx cloudflared tunnel --url http://localhost:3001
```

Then add the tunnel URL (with `/mcp` appended) as a custom connector in Claude.ai settings.

### Using with Claude Desktop (stdio)

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "drawio-app": {
      "command": "node",
      "args": ["path/to/mcp-app-server/src/index.js", "--stdio"]
    }
  }
}
```

> **Note:** Inline diagram rendering requires an MCP host that supports the MCP Apps extension. In hosts without MCP Apps support, the tool still works but returns the XML as text.

---

## Alternative: Project Instructions (No MCP Required)

An alternative approach is available that works **without installing the MCP server**. Instead of using MCP tools, you add instructions to a Claude Project that teach Claude to generate draw.io URLs using Python code execution.

### Advantages

- **No installation required** - works immediately in Claude.ai
- **No desktop app needed** - works entirely in the browser
- **Easy to use** - just add instructions to your Claude Project
- **Privacy-friendly** - the generated URL uses a hash fragment (`#create=...`), which stays in the browser and is never sent to any server

### How to Install

1. Open your Claude Project settings
2. Add the contents of [`claude-project-instructions.txt`](project-instructions/claude-project-instructions.txt) to your project instructions
3. Ask Claude to create diagrams - it will generate clickable draw.io URLs

### How It Works

The instructions teach Claude to:
1. Generate diagram code (Mermaid, XML, or CSV)
2. Execute Python code to compress and encode the diagram
3. The script outputs a complete HTML page with the URL embedded as a clickable button
4. Claude presents the HTML as an artifact - the user clicks the button to open draw.io

### Why HTML Output?

The generated URL contains compressed base64 data. LLMs are known to silently corrupt base64 strings when reproducing them token by token - even a single changed character breaks the link completely.

By having the Python script output a complete HTML page with the link already embedded, the URL never passes through Claude's text generation. Claude simply presents the script output as an artifact, ensuring the link is always correct.

---

## Development

```bash
# MCP Tool Server
cd mcp-tool-server
npm install
npm start

# MCP App Server
cd mcp-app-server
npm install
npm start
```

## Related Resources

- [draw.io](https://www.draw.io) - Free online diagram editor
- [draw.io Desktop](https://github.com/jgraph/drawio-desktop) - Desktop application
- [@drawio/mcp on npm](https://www.npmjs.com/package/@drawio/mcp) - This package on npm
- [drawio-mcp on GitHub](https://github.com/jgraph/drawio-mcp) - Source code repository
- [Mermaid.js Documentation](https://mermaid.js.org/intro/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Apps Extension](https://modelcontextprotocol.io/docs/extensions/apps)
