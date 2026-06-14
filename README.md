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

