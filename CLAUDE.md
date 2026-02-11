# Draw.io MCP Server

This is the official draw.io MCP (Model Context Protocol) server that enables LLMs to open and create diagrams in the draw.io editor.

## Repository Structure

- **`mcp-tool-server/`** - Original MCP tool server (stdio-based, opens browser)
- **`mcp-app-server/`** - MCP App server (renders diagrams inline in chat via iframe)
- **`project-instructions/`** - Claude Project instructions (no MCP required)

## Overview

This MCP server provides tools to create draw.io diagrams from:
- **XML diagrams**: Native draw.io/mxGraph XML format
- **CSV data**: Tabular data that draw.io converts to diagrams
- **Mermaid.js**: Text-based diagram definitions

## MCP Server Tools

### `open_drawio_xml`

Opens the draw.io editor with XML content.

**Parameters:**
- `content` (required): Draw.io XML content or URL to XML file
- `lightbox` (optional): Open in read-only lightbox mode (default: false)
- `dark` (optional): Dark mode - "true" or "false" (default: false)

**Example XML:**
```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Hello" style="rounded=1;" vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### `open_drawio_csv`

Opens the draw.io editor with CSV data that gets converted to a diagram.

**⚠️ Note:** CSV relies on draw.io's server-side processing and may occasionally fail or be unavailable. Consider using Mermaid for org charts when possible.

**Parameters:**
- `content` (required): CSV content or URL to CSV file
- `lightbox` (optional): Open in read-only lightbox mode (default: false)
- `dark` (optional): Dark mode - "true" or "false" (default: false)

**Example CSV (Simple Org Chart):**
```csv
# label: %name%
# style: whiteSpace=wrap;html=1;rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
# connect: {"from":"manager","to":"name","invert":true,"style":"endArrow=blockThin;endFill=1;"}
# layout: auto
name,manager
CEO,
CTO,CEO
CFO,CEO
```

**⚠️ Avoid** using `%column%` placeholders in style attributes (like `fillColor=%color%`) - this can cause "URI malformed" errors.

### `open_drawio_mermaid`

Opens the draw.io editor with a Mermaid.js diagram definition.

**Parameters:**
- `content` (required): Mermaid.js syntax or URL to Mermaid file
- `lightbox` (optional): Open in read-only lightbox mode (default: false)
- `dark` (optional): Dark mode - "true" or "false" (default: false)

**Example - Flowchart:**
```
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
```

**Example - Sequence diagram with alt/else:**
```
sequenceDiagram
    autonumber
    participant Client
    participant API
    participant Database

    Client->>API: POST /login
    API->>Database: Query user
    Database-->>API: User data

    alt Valid credentials
        API-->>Client: 200 OK + Token
    else Invalid credentials
        API-->>Client: 401 Unauthorized
    end
```

**Example - ER diagram:**
```
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        int id PK
    }
    ORDER {
        int id PK
        int customer_id FK
    }
```

**Supported Mermaid diagram types:**
- Flowcharts (`graph TD`, `graph LR`)
- Sequence diagrams (`sequenceDiagram`)
- Class diagrams (`classDiagram`)
- State diagrams (`stateDiagram-v2`)
- Entity Relationship diagrams (`erDiagram`)
- Gantt charts (`gantt`)
- Pie charts (`pie`)
- And more...

## Quick Decision Guide

| Need | Use | Reliability |
|------|-----|-------------|
| Flowchart, sequence, ER diagram | `open_drawio_mermaid` | ✅ High |
| Custom styling, precise positioning | `open_drawio_xml` | ✅ High |
| Org chart from data | `open_drawio_csv` | ⚠️ Medium |

**Default to Mermaid** - it handles most diagram types reliably.

## Usage Patterns

### Creating a New Diagram

When an LLM needs to create a diagram, it should:

1. **For flowcharts and sequences**: Use `open_drawio_mermaid` (recommended)
2. **For complex or custom diagrams**: Use `open_drawio_xml`
3. **For structured data** (org charts, tables): Use `open_drawio_csv` (less reliable)

### Viewing Existing Diagrams

Set `lightbox: true` to open diagrams in read-only view mode.

### From URLs

All tools accept URLs instead of direct content. The server will fetch the content automatically:

```
open_drawio_xml(content: "https://example.com/diagram.xml")
```

## Technical Details

### URL Generation

The server generates draw.io URLs using the `#create` hash parameter:
1. Content is encoded with `encodeURIComponent`
2. Compressed using pako deflateRaw
3. Encoded as base64
4. Wrapped in a JSON object with type and compression flags
5. Appended to the draw.io URL as `#create={...}`

### Content Types

| Tool | Type | Use Case |
|------|------|----------|
| `open_drawio_xml` | xml | Native draw.io format, full control |
| `open_drawio_csv` | csv | Tabular data, org charts, bulk import |
| `open_drawio_mermaid` | mermaid | Text-based diagrams, quick creation |

## Best Practices for LLMs

1. **Default to Mermaid**: It handles flowcharts, sequences, ER diagrams, Gantt charts, and more - all reliably

2. **Use XML for precision**: When you need exact positioning, custom colors, or complex layouts

3. **Avoid CSV for critical diagrams**: CSV processing can fail; prefer Mermaid for org charts when possible

4. **Validate syntax**: Ensure Mermaid/CSV/XML syntax is correct before sending

5. **Use URLs for large content**: For very large diagrams, consider hosting the content and passing a URL

6. **Return the URL to users**: Always provide the generated URL so users can open the diagram in their browser

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "URI malformed" | Special characters in CSV style attributes | Use hardcoded colors instead of `%column%` placeholders |
| "Service nicht verfügbar" | draw.io CSV server unavailable | Retry later or use Mermaid instead |
| Blank diagram | Invalid Mermaid/XML syntax | Check syntax, ensure proper escaping |
| Diagram doesn't match expected | Mermaid version differences | Simplify syntax, avoid edge cases |

## MCP App Server (`mcp-app-server/`)

The MCP App server renders draw.io diagrams **inline** in AI chat interfaces (Claude, VS Code, etc.) using the MCP Apps protocol. Instead of opening a browser window, diagrams appear directly in the conversation as interactive iframes.

### Tool: `create_diagram`

- **Input**: `{ xml: string }` - draw.io XML in mxGraphModel format
- **Output**: Interactive diagram rendered via the draw.io viewer library
- **Features**: Zoom, pan, layers, fullscreen, "Open in draw.io" button

### Architecture

1. LLM calls `create_diagram` with draw.io XML
2. Host fetches the UI resource (`ui://drawio/mcp-app.html`)
3. HTML renders the diagram using `viewer-static.min.js` from `https://viewer.diagrams.net`
4. The SDK's auto-resize reports the diagram dimensions; the host sizes the iframe to match
5. User sees an interactive diagram inline in the chat

### Development

```bash
cd mcp-app-server
npm install
npm start        # Start the server (no build step needed)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/index.js` | Server + client logic in one file (vanilla JS, no build step) |

### How the HTML is built

At startup, `src/index.js` reads two bundles from `node_modules`:

- **`app-with-deps.js`** (~319 KB) — MCP Apps SDK browser bundle from `@modelcontextprotocol/ext-apps`. The bundle is ESM (ends with `export { ... as App }`), so the server strips the export statement and creates a local `var App = <minifiedName>` alias. This makes it safe to inline in a plain `<script>` tag inside the sandboxed iframe.
- **`pako_deflate.min.js`** (~28 KB) — for compressing XML into the `#create=` URL format.

Both are inlined into a self-contained HTML string served via `registerAppResource`. The draw.io viewer (`viewer-static.min.js`) is loaded from CDN at runtime.

### Testing with Claude

1. `npm start`
2. Tunnel: `npx cloudflared tunnel --url http://localhost:3001`
3. Add tunnel URL + `/mcp` as custom connector in Claude settings

## Alternative: Project Instructions (No MCP Required)

An alternative approach is available that works **without installing the MCP server**. Instead of using MCP tools, you add instructions to a Claude Project that teach Claude to generate draw.io URLs using Python code execution.

### Advantages

- **No installation required** - works immediately in Claude.ai
- **No desktop app needed** - works entirely in the browser
- **Easy to use** - just add instructions to your Claude Project
- **Privacy-friendly** - the generated URL uses a hash fragment (`#create=...`), which stays in the browser and is never sent to any server

### Installation

Add the contents of [`claude-project-instructions.txt`](https://github.com/jgraph/drawio-mcp/blob/main/project-instructions/claude-project-instructions.txt) to your Claude Project instructions.

### How URL Delivery Works

The generated URL contains compressed base64 data. LLMs are known to silently corrupt base64 strings when reproducing them token by token - even a single changed character breaks the link completely.

To avoid this, the Python script outputs a complete HTML page with the URL embedded as a clickable button. Claude is instructed to present this HTML output as an artifact, so the URL never passes through Claude's text generation. This ensures the link is always correct.
