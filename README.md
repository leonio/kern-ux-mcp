# Kern UX MCP Server

MCP Language Server exposing component tools, recursive composition rendering and strict accessibility validation for the [KERN-UX Component Library](https://www.kern-ux.de/).

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

### Settings

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind address. |
| `PORT` | `3000` | Listen port. |
| `KERN_ALLOWED_HOSTS` | `localhost,127.0.0.1,[::1]` | Hostnames accepted in the `Host` header, which protects against DNS rebinding. Ports are ignored. **Required** when `HOST` isn't a loopback address, for example `0.0.0.0` in a container. |
| `KERN_ALLOWED_ORIGINS` | The loopback names on a loopback bind, otherwise none | Hostnames accepted in the `Origin` header. Requests without an `Origin` (clients that aren't browsers) always pass. |
| `KERN_AUTH_TOKEN` | unset | When set, `/mcp` requires `Authorization: Bearer <token>`. |
| `KERN_RATE_LIMIT` | unset | When set, the maximum `/mcp` requests per minute from one client address. Further requests get `429` with `Retry-After`. |
| `KERN_CORS_ORIGINS` | unset | Origins such as `https://app.example.com` that get CORS headers, for browser-based clients. They're added to the allowed origins. |
| `KERN_DEBUG` | unset | `1` logs every request and tool call to stderr. |

The server refuses to start with a setting it can't apply, such as a public `HOST` without `KERN_ALLOWED_HOSTS`.

### Endpoints and shutdown

- `/mcp`: the MCP endpoint. Request bodies are limited to 4 MiB.
- `/healthz`: liveness, `200` while the process runs.
- `/readyz`: readiness, `503` once shutdown has started.

The probes skip the `Host` check and the token, so orchestrators can call them by IP. On `SIGTERM` or `SIGINT` the server stops accepting connections, gives in-flight requests up to 8 seconds to finish, and exits.

### Container

The image `ghcr.io/leonio/kern-ux-mcp-http` runs the server on distroless Node 24 as a non-root user, with no shell and no `node_modules`. It sets `HOST=0.0.0.0`, so it needs `KERN_ALLOWED_HOSTS`:

```bash
docker run --rm -p 127.0.0.1:3000:3000 -e KERN_ALLOWED_HOSTS=localhost ghcr.io/leonio/kern-ux-mcp-http:<version>
```

Tags follow npm: the version, plus `alpha` for pre-releases or `latest` for releases. The image has a `HEALTHCHECK` on `/healthz` and works with a read-only root filesystem (`--read-only`). To build it from a checkout, run `npm run docker:build`, or `docker compose -f packages/http/compose.yaml up --build`: [compose.yaml](https://github.com/leonio/kern-ux-mcp/blob/main/packages/http/compose.yaml) has the settings commented in.

### Security

- Without `KERN_AUTH_TOKEN`, anyone who can reach the port can use the server. Keep it on a trusted network, or set a long random token.
- The rate limit counts per client address. Behind a reverse proxy every request comes from the proxy's address, so limit at the proxy instead.

### Clients that need a public HTTPS URL

ChatGPT and the OpenAI Responses API `mcp` tool only connect to public HTTPS URLs. For local testing, put a tunnel in front of the server and allow the tunnel's hostname:

```bash
cloudflared tunnel --url http://localhost:3000
# prints https://<name>.trycloudflare.com

KERN_ALLOWED_HOSTS=localhost,<name>.trycloudflare.com npx -y @leonio/kern-ux-mcp-http
```

Then use `https://<name>.trycloudflare.com/mcp` as the server URL. `ngrok http 3000` works the same way. The tunnel makes the server public, so set `KERN_AUTH_TOKEN` if your client can send an `Authorization` header.

---

## Protocol and Errors

Since 2.0 the server is built on MCP TypeScript SDK v2. It speaks protocol `2026-07-28` and still serves older clients (`2024-11-05` through `2025-11-25`) from the same process.

- **Invalid arguments** come back as a normal tool result with `isError: true`. The text starts with `Input validation error: Invalid arguments for tool <name>:`, followed by one line per problem and, for many tools, a known-good payload. Models can read it and retry. (1.x returned a JSON-RPC error instead.)
- **`strict: true` validation failures** also come back as `isError: true`, listing the accessibility errors.
- **Unknown tool names** are rejected with JSON-RPC error `-32602` (`Tool <name> not found`).
