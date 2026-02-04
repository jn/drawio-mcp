# Draw.io MCP Server

This is the official draw.io MCP (Model Context Protocol) server that enables LLMs to open and create diagrams in the draw.io editor.

## Overview

This repository provides two ways to enable draw.io diagram generation in Claude:

1. **MCP Server** (`src/index.js`) - For Claude Desktop, requires installation
2. **Project Instructions** (`claude-project-instructions.txt`) - For Claude.ai and Claude Desktop, no installation required

Both approaches support:
- **XML diagrams**: Native draw.io/mxGraph XML format
- **CSV data**: Tabular data that draw.io converts to diagrams
- **Mermaid.js**: Text-based diagram definitions

## Project Instructions (No MCP)

The `claude-project-instructions.txt` file contains instructions that can be pasted into a Claude Project's custom instructions. Claude then uses its built-in Python analysis tool to generate compressed draw.io URLs directly.

**Advantages over MCP:**
- No installation required
- Works in Claude.ai (web) and Claude Desktop
- No system access needed
- User can inspect the URL before clicking

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
