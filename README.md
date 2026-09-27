# Kern UX MCP Server

MCP Language Server exposing component tools, recursive composition rendering and strict accessibility validation for the [KERN-UX Component Library](https://www.kern-ux.de/).

## Prerequisites
- **Node.js**: 24.16.0+

---

## Configuration & Usage

This is a `stdio` MCP server designed for integration with standard MCP clients using `mcp.json`.

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

### Option C: GitHub Packages
Add the following to your user or project `.npmrc`.

```
@leonio:registry=[https://npm.pkg.github.com](https://npm.pkg.github.com)
//[npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT](https://npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT)
```


---

## Protocol and Errors

Since 2.0 the server is built on MCP TypeScript SDK v2. It speaks protocol `2026-07-28` and still serves older clients (`2024-11-05` through `2025-11-25`) from the same process.

- **Invalid arguments** come back as a normal tool result with `isError: true`. The text starts with `Input validation error: Invalid arguments for tool <name>:`, followed by one line per problem and, for many tools, a known-good payload. Models can read it and retry. (1.x returned a JSON-RPC error instead.)
- **`strict: true` validation failures** also come back as `isError: true`, listing the accessibility errors.
- **Unknown tool names** are rejected with JSON-RPC error `-32602` (`Tool <name> not found`).
