# Kern UX MCP Server

MCP Language Server exposing component tools, recursive composition rendering, strict accessibility validation, component cards and guides as resources, prompts for forms, pages and reviews, and a skill for forms for the [KERN-UX Component Library](https://www.kern-ux.de/).

**Documentation: [leonio.github.io/kern-ux-mcp](https://leonio.github.io/kern-ux-mcp/)**: setup guides for VS Code Copilot, Claude Desktop and Claude Code, the HTTP server and its container, configuration, the resources, prompts and skills, and debugging.

## Prerequisites
- **Node.js**: 24.16.0+

---

## Configuration & Usage

The server comes in two packages with the same tools:

- `@leonio/kern-ux-mcp`: a `stdio` server that MCP clients start themselves, configured in `mcp.json`.
- `@leonio/kern-ux-mcp-http`: a Streamable HTTP server for remote and shared use. See [Streamable HTTP server](#streamable-http-server).

### Option A: npx
```json
// mcp.json
{
  "mcpServers": {
    "kern-ux": {
      "command": "npx",
      "args": ["-y", "@leonio/kern-ux-mcp"]
    }
  }
}
```

### Option B: Global Install
```bash
npm install -g @leonio/kern-ux-mcp
```

```json
// mcp.json
{
  "mcpServers": {
    "kern-ux": {
      "command": "kern-ux-mcp"
    }
  }
}
```

### Option C: Claude Desktop (MCP Bundle)

Each [GitHub release](https://github.com/leonio/kern-ux-mcp/releases) has a `kern-ux-mcp-<version>.mcpb` asset. Open it with Claude Desktop to install the server as an extension. The bundle contains the whole server in one file, so nothing is downloaded from npm. It needs Node.js 24.16 or later.

### Option D: GitHub Packages
Add the following to your user or project `.npmrc`.

```
@leonio:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

---

## Streamable HTTP server

`@leonio/kern-ux-mcp-http` serves the same tools at `/mcp`. It's stateless: every request gets its own server instance, so it needs no sticky sessions.

```bash
npx -y @leonio/kern-ux-mcp-http
# Kern UX MCP server 2.0.0 listening on http://127.0.0.1:3000/mcp
```

Connect a client to `http://localhost:3000/mcp`, for example:

```jsonc
// .vscode/mcp.json (VS Code)
{
  "servers": {
    "kern-ux": { "type": "http", "url": "http://localhost:3000/mcp" }
  }
}
```

```bash
# Claude Code
claude mcp add --transport http kern-ux http://localhost:3000/mcp
```

### Try it without installing

A free, public instance runs at `https://kernuxmcphost.velixir.run/mcp`, with no sign-up and no token:

```bash
claude mcp add --transport http kern-ux https://kernuxmcphost.velixir.run/mcp
```

It's meant for trying the server out, on free hosting with limited capacity and no uptime guarantee, so run your own instance for anything you depend on. Thank you to [velixir](https://velixir.net) for hosting it for free in the EU.

The server's settings, its endpoints, the container image `ghcr.io/leonio/kern-ux-mcp-http`, security, and clients that need a public HTTPS URL are in [Run the HTTP server](https://leonio.github.io/kern-ux-mcp/http-server) and [Configuration](https://leonio.github.io/kern-ux-mcp/configuration).

---

## What the server offers

- **Tools**: 54 of them, from one component to a whole page, and `validate_html`, which checks HTML against KERN's accessibility rules. See [How it works](https://leonio.github.io/kern-ux-mcp/how-it-works).
- **[Resources](https://leonio.github.io/kern-ux-mcp/resources)**: a card for each of the 48 components at `kern://components/{id}`, and guides for forms, layout and accessibility at `kern://guides/{name}`.
- **[Prompts](https://leonio.github.io/kern-ux-mcp/prompts)**: `create_input_form`, `create_page_layout` and `review_kern_html`, workflows over the tools that you start from the client.
- **[Skills](https://leonio.github.io/kern-ux-mcp/skills)**: `kern-ux-forms`, which a client that supports the MCP Skills extension offers to the model, so it loads the form workflow when a task needs it.

---

## Protocol and Errors

Since 2.0 the server is built on MCP TypeScript SDK v2. It speaks protocol `2026-07-28` and still serves older clients (`2024-11-05` through `2025-11-25`) from the same process. Invalid arguments and `strict: true` failures come back as tool results with `isError: true`, which models can read and retry; details are in [Protocol and errors](https://leonio.github.io/kern-ux-mcp/protocol-and-errors).
