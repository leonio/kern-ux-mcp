# Choosing stdio or HTTP

The server comes in two packages with the same tools.

| | **stdio** (`@leonio/kern-ux-mcp`) | **HTTP** (`@leonio/kern-ux-mcp-http`) |
|---|---|---|
| Who starts it | Your client, as a child process | You (Node, Docker or a server) |
| Where it runs | Your machine | Anywhere your client can reach |
| Shared by several people | No | Yes |
| Needs | Node.js 24.16+ (or Claude Desktop's `.mcpb` bundle) | Node.js 24.16+ or Docker |
| Security setup | None | Allowed hosts; a token if others can reach it |
| Best for | One person on one machine | Teams, containers, remote clients |

**Rule of thumb:** use stdio unless you need to share the server or run it in a container.

## Which client supports what

| Client | stdio | HTTP on `localhost` | HTTP on a public URL |
|---|---|---|---|
| [VS Code Copilot](Setup-VS-Code-Copilot) | ✅ | ✅ | ✅ |
| [Claude Code](Setup-Claude-Code) | ✅ | ✅ | ✅ |
| [Claude Desktop](Setup-Claude-Desktop) | ✅ (config or `.mcpb`) | ❌ | ✅ as a custom connector |

Claude Desktop connects to remote servers from Anthropic's side, so it can't reach `localhost`. See [its page](Setup-Claude-Desktop#http) for the details.
