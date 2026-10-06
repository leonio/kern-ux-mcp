# Migrating from 1.x

2.0 is a major release. The main differences:

- **Two packages.** `@leonio/kern-ux-mcp` (stdio, as before) and the new `@leonio/kern-ux-mcp-http` (Streamable HTTP, also as a container image). Claude Desktop users can install the `.mcpb` bundle.
- **Node.js 24.16+** is required.
- **Protocol 2026-07-28**, with older clients (2024-11-05 to 2025-11-25) still served.
- **Errors:** invalid arguments now come back as a tool result with `isError: true` instead of a JSON-RPC error, so models can read them and retry.
- **Tools:** the tool list, tool names, descriptions (now English) and some rendered markup changed.

Most users only need to update the version in their client config and restart the client.

The full list, with what to change, is in [docs/migration-2.0.md](https://github.com/leonio/kern-ux-mcp/blob/main/docs/migration-2.0.md).
