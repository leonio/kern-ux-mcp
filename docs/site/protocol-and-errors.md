# Protocol and errors

Since 2.0 the server is built on MCP TypeScript SDK v2. It speaks protocol `2026-07-28` and still serves older clients (`2024-11-05` through `2025-11-25`) from the same process.

- **Invalid arguments** come back as a normal tool result with `isError: true`. The text starts with `Input validation error: Invalid arguments for tool <name>:`, followed by one line per problem and, for many tools, a known-good payload. Models can read it and retry. (1.x returned a JSON-RPC error instead.)
- **`strict: true` validation failures** also come back as `isError: true`, listing the accessibility errors.
- **Unknown tool names** are rejected with JSON-RPC error `-32602` (`Tool <name> not found`).

The HTTP server answers HTTP errors of its own, such as `403` for a host it doesn't allow: see [Debugging and troubleshooting](./debugging-and-troubleshooting.md#common-problems).
