# Draw.io MCP Server

The official [draw.io](https://www.draw.io) MCP (Model Context Protocol) server that enables LLMs to create and open diagrams in the draw.io editor.

## Features

- **Open XML diagrams**: Load native draw.io/mxGraph XML format
- **Import CSV data**: Convert tabular data to diagrams (org charts, flowcharts, etc.)
- **Render Mermaid.js**: Transform Mermaid syntax into editable draw.io diagrams
- **URL support**: Fetch content from URLs automatically
- **Customizable display**: Lightbox mode, dark mode, and more

## Two Ways to Use

### Option 1: MCP Server (Claude Desktop)

Install and configure the MCP server for Claude Desktop. The server runs locally and can automatically open diagrams in your browser.

### Option 2: Project Instructions (No MCP)

Use draw.io diagram generation with custom project instructions - works in both Claude.ai and Claude Desktop without installing the MCP server. See [Using Project Instructions](#using-project-instructions-no-mcp) below.

| Feature | MCP Server | Project Instructions |
|---------|------------|----------------------|
| Platform | Claude Desktop | Claude.ai & Claude Desktop |
| Installation | Required | None |
| System access | Opens browser automatically | No system access |
| Link verification | Automatic | User can inspect link before clicking |
| Complexity | More setup | Just paste instructions |

---

## MCP Server Installation

### Using npx (recommended)

```bash
npx @drawio/mcp
```

### Global installation

```bash
npm install -g @drawio/mcp
drawio-mcp
```

### From source

```bash
git clone https://github.com/jgraph/drawio-mcp.git
cd drawio-mcp
npm install
npm start
```

## Configuration

### Claude Desktop

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

### Other MCP Clients

Configure your MCP client to run the server via stdio:

```bash
npx @drawio/mcp
```

## Tools

### `open_drawio_xml`

Opens the draw.io editor with XML content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | Draw.io XML or URL to XML |
| `lightbox` | boolean | No | Read-only view mode (default: false) |
| `dark` | string | No | "auto", "true", or "false" (default: "auto") |

### `open_drawio_csv`

Opens the draw.io editor with CSV data converted to a diagram.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | CSV content or URL to CSV |
| `lightbox` | boolean | No | Read-only view mode (default: false) |
| `dark` | string | No | "auto", "true", or "false" (default: "auto") |

### `open_drawio_mermaid`

Opens the draw.io editor with a Mermaid.js diagram.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | Mermaid syntax or URL |
| `lightbox` | boolean | No | Read-only view mode (default: false) |
| `dark` | string | No | "auto", "true", or "false" (default: "auto") |

## Example Prompts

Here are example prompts you can use with Claude to create diagrams.

**Important:** Claude Desktop may have multiple ways to create diagrams (artifacts, browser control, MCP tools). To ensure Claude uses the draw.io MCP, explicitly mention the tool name in your prompt.

You can also add a system instruction to your Claude Desktop project:
> "Always use the draw.io MCP tools (open_drawio_mermaid, open_drawio_csv, open_drawio_xml) to create diagrams. Do not use browser control or artifacts."

### Explicit MCP Tool Calls

These prompts explicitly request the draw.io MCP tools:

**Mermaid:**
- "Use `open_drawio_mermaid` to create a flowchart for a user login process"
- "Use the draw.io MCP tool `open_drawio_mermaid` to make a sequence diagram showing OAuth2 flow"
- "Create a state diagram with `open_drawio_mermaid` for an order lifecycle"

**CSV:**
- "Use `open_drawio_csv` to create an org chart for our team: CEO -> CTO, CFO; CTO -> 3 Engineers"
- "Use the draw.io MCP tool `open_drawio_csv` to generate a network topology diagram"
- "Create a microservices architecture with `open_drawio_csv`"

**XML:**
- "Use `open_drawio_xml` to create a detailed AWS architecture diagram with VPC, subnets, and security groups"
- "Use the draw.io MCP tool `open_drawio_xml` to create a floor plan with 3 offices and a conference room"
- "Create a network rack diagram with `open_drawio_xml` showing servers, switches, and cabling"

### Mermaid Diagrams

**Flowcharts:**
- "Create a flowchart showing a user login process with password validation and 2FA"
- "Make a diagram of a CI/CD pipeline with build, test, and deploy stages"
- "Draw a decision tree for troubleshooting network connectivity issues"

**Sequence Diagrams:**
- "Create a sequence diagram showing OAuth2 authentication flow"
- "Make a sequence diagram of a REST API request/response cycle"
- "Draw the interaction between a web browser, server, and database for a search query"

**Class Diagrams:**
- "Create a class diagram for a simple e-commerce system with Product, Order, and Customer classes"
- "Make a UML class diagram showing inheritance for a vehicle hierarchy"

**Other Mermaid Types:**
- "Create an entity relationship diagram for a blog with users, posts, and comments"
- "Make a state diagram for an order lifecycle (pending, confirmed, shipped, delivered)"
- "Draw a Gantt chart for a 3-month software development project"

### CSV Diagrams

**Org Charts (generated from description):**
- "Create an org chart for a tech startup with a CEO, CTO with 3 engineers, and CFO with 2 accountants"
- "Make an organizational diagram for a hospital with departments: Emergency, Surgery, Pediatrics, each with a head doctor and 2 staff"
- "Generate an org chart showing: John (CEO) manages Sarah (VP Sales) and Mike (VP Engineering). Sarah manages 2 sales reps, Mike manages 3 developers"

**Network/Architecture Diagrams (generated from description):**
- "Create a network diagram showing: Load Balancer connects to 3 Web Servers, each Web Server connects to a shared Database and Cache"
- "Make an AWS architecture diagram with: Users -> CloudFront -> ALB -> 2 EC2 instances -> RDS"
- "Generate a microservices diagram with API Gateway connecting to Auth, Users, Orders, and Payments services"

**Process/Workflow Diagrams (generated from description):**
- "Create a diagram showing our hiring process: Application -> HR Review -> Technical Interview -> Culture Fit -> Offer -> Onboarding"
- "Make a diagram of a pizza order flow from customer order through kitchen stations to delivery"

**From Existing Data:**
- "Create a diagram from this CSV data showing project dependencies"
- "Turn this spreadsheet of employees and managers into an org chart"

### XML Diagrams

**Complex Custom Diagrams:**
- "Create a detailed AWS architecture diagram with VPC, subnets, EC2, and RDS"
- "Make a custom floor plan layout with specific room dimensions"
- "Draw a circuit diagram with specific component placements"

**Importing Existing Diagrams:**
- "Open this draw.io XML file and let me edit it"
- "Load my existing diagram from this URL: https://example.com/diagram.xml"

## Format Examples

### Flowchart with Mermaid

```text
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

### Sequence Diagram with Mermaid

```text
sequenceDiagram
    participant User
    participant Server
    participant Database

    User->>Server: Login Request
    Server->>Database: Validate Credentials
    Database-->>Server: User Data
    Server-->>User: JWT Token
```

### Org Chart with CSV

```csv
## Org Chart
# label: %name%<br><i style="color:gray;">%title%</i>
# style: rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
# connect: {"from":"manager","to":"name","invert":true,"style":"curved=1;endArrow=blockThin;endFill=1;"}
# layout: auto
# nodespacing: 40
# levelspacing: 60
name,title,manager
Alice Johnson,CEO,
Bob Smith,CTO,Alice Johnson
Carol Williams,CFO,Alice Johnson
Dave Brown,Lead Engineer,Bob Smith
Eve Davis,Senior Engineer,Bob Smith
Frank Miller,Accountant,Carol Williams
```

### Entity List with CSV

```csv
## Entity Diagram
# label: %name%
# style: shape=rectangle;rounded=1;whiteSpace=wrap;html=1;
# connect: {"from":"connects_to","to":"name","style":"endArrow=classic;"}
# layout: horizontalflow
name,type,connects_to
API Gateway,service,Auth Service
Auth Service,service,User Database
User Database,database,
API Gateway,service,Product Service
Product Service,service,Product Database
Product Database,database,
```

### Native XML

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Hello World" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;"
            vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="Another Box" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
            vertex="1" parent="1">
      <mxGeometry x="280" y="100" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="4" style="endArrow=classic;html=1;" edge="1" parent="1" source="2" target="3">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

## How It Works

1. The MCP server receives diagram content (XML, CSV, or Mermaid)
2. Content is compressed using pako deflateRaw and encoded as base64
3. A draw.io URL is generated with the `#create` hash parameter
4. The URL is returned to the LLM, which can present it to the user
5. Opening the URL loads draw.io with the diagram ready to view/edit

## Development

```bash
# Install dependencies
npm install

# Run the server
npm start
```

---

## Using Project Instructions (No MCP)

You can use draw.io diagram generation without installing the MCP server by using custom project instructions. This works in both Claude.ai (web) and Claude Desktop.

**Advantages:**

- **No installation** - Just paste instructions into a project
- **Works everywhere** - Claude.ai and Claude Desktop
- **No system access** - Claude generates a link without accessing your computer
- **Transparent** - You can inspect the generated URL before clicking
- **Verifiable** - The link visibly points to `app.diagrams.net`

### Setup

1. Create a new Project in Claude.ai or Claude Desktop
2. In Project Settings, paste the contents of [`claude-project-instructions.txt`](./claude-project-instructions.txt) into the custom instructions
3. Start a conversation and ask Claude to create diagrams

### How It Works

Claude uses its built-in Python analysis tool to:
1. Generate Mermaid/CSV/XML diagram code based on your request
2. Compress and encode the diagram data
3. Create a draw.io URL with the embedded diagram
4. Present the URL as a clickable link

### Example

**You:** Create a flowchart for a user login process

**Claude:** Here's your flowchart:

👉 [Open in draw.io](https://app.diagrams.net/?pv=0&grid=0#create=...)

---

## Related Resources

- [draw.io](https://www.draw.io) - Free online diagram editor
- [draw.io Desktop](https://github.com/jgraph/drawio-desktop) - Desktop application
- [Mermaid.js Documentation](https://mermaid.js.org/intro/)
- [MCP Specification](https://modelcontextprotocol.io/)
