# Debugging and troubleshooting

## Turn on debug logging

Set `KERN_DEBUG=1`. The server then writes every request and tool call to stderr, as `[kern-ux:mcp] <event>` lines with the payload.

| Where | How |
|---|---|
| stdio in VS Code | Add `"env": { "KERN_DEBUG": "1" }` to the server in `mcp.json`. The log is in **MCP: List Servers** → `kern-ux` → **Show Output**. |
| stdio in Claude Desktop | `.mcpb`: **Settings → Extensions → KERN UX → Debug logging**. Config file: add `"env": { "KERN_DEBUG": "1" }`. Logs are under **Settings → Developer**. |
| stdio in Claude Code | `claude mcp add -e KERN_DEBUG=1 kern-ux -- npx -y @leonio/kern-ux-mcp@alpha` |
| HTTP / Docker | Uncomment `KERN_DEBUG: "1"` in `compose.yaml`; read it with `docker compose -f packages/http/compose.yaml logs -f` |

## Test the server without an AI: MCP Inspector

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) lets you list the tools and call them by hand.

```bash
# stdio
npx @modelcontextprotocol/inspector npx -y @leonio/kern-ux-mcp@alpha

# your checkout (after npm run build)
npx @modelcontextprotocol/inspector node packages/stdio/dist/index.js
```

For HTTP, start the Inspector with `npx @modelcontextprotocol/inspector`, choose **Streamable HTTP** and enter `http://localhost:3000/mcp` (and the token under **Authentication**, if set).

![MCP Inspector listing the kern-ux tools and a tool result](images/inspector-tools.png)

## Common problems

| Symptom | Cause | Fix |
|---|---|---|
| Server won't start: `KERN_ALLOWED_HOSTS is required when HOST … is not a loopback address` | Binding to `0.0.0.0` or a public address without a host list | Set `KERN_ALLOWED_HOSTS` to the hostnames clients use |
| HTTP `403` | The `Host` or `Origin` header isn't allowed | Add the hostname to `KERN_ALLOWED_HOSTS` (or `KERN_ALLOWED_ORIGINS` for a browser) |
| HTTP `401` | `KERN_AUTH_TOKEN` is set and the client sent no or the wrong token | Send `Authorization: Bearer <token>` |
| HTTP `429` | Over `KERN_RATE_LIMIT` | Wait for `Retry-After`, or raise the limit |
| HTTP `404` | Wrong path | The endpoint is `/mcp` |
| `EADDRINUSE` | Port 3000 is taken | Set `PORT`, or change the left side of the Compose port mapping (`"127.0.0.1:3001:3000"`) |
| `Unsupported engine` or syntax errors at start | Node.js older than 24.16 | Upgrade Node.js, or use Docker or the `.mcpb` bundle |
| Tool result starts with `Input validation error:` | The model sent wrong arguments | Nothing to fix: the message lists the problems and models retry. If it keeps failing, report it with the debug log. |
| `Tool <name> not found` | The client has an old tool list (tools were renamed in 2.0) | Restart the server in the client; see [Migrating from 1.x](Migrating-from-1.x) |
| Client shows no tools | The server didn't start or crashed | Run the server command yourself in a terminal to see the error |

## Reporting a bug

Open an [issue](https://github.com/leonio/kern-ux-mcp/issues) with the version, the client, the transport (stdio or HTTP), and the debug log of the failing call.
