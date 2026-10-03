# Configuration

The **HTTP server** reads these environment variables at start-up. It refuses to start with a setting it can't apply, and says which one.

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `127.0.0.1` (`0.0.0.0` in the container) | Bind address. |
| `PORT` | `3000` | Listen port. |
| `KERN_ALLOWED_HOSTS` | `localhost,127.0.0.1,[::1]` | Hostnames accepted in the `Host` header (protects against DNS rebinding). Ports are ignored. **Required** when `HOST` isn't a loopback address. |
| `KERN_ALLOWED_ORIGINS` | The loopback names on a loopback bind, otherwise none | Hostnames accepted in the `Origin` header. Requests without an `Origin` (non-browser clients) always pass. |
| `KERN_AUTH_TOKEN` | unset | When set, `/mcp` requires `Authorization: Bearer <token>`. |
| `KERN_RATE_LIMIT` | unset | Maximum `/mcp` requests per minute per client address. Further requests get `429` with `Retry-After`. |
| `KERN_CORS_ORIGINS` | unset | Origins such as `https://app.example.com` that get CORS headers, for browser-based clients. |
| `KERN_DEBUG` | unset | `1` logs every request and tool call to stderr. |

The **stdio server** reads only `KERN_DEBUG`. In Claude Desktop's `.mcpb` bundle it's the **Debug logging** switch.

## Endpoints

| Path | Answers |
|---|---|
| `/mcp` | The MCP endpoint. Request bodies up to 4 MiB. |
| `/healthz` | `200` while the process runs. |
| `/readyz` | `200`, or `503` once shutdown has started. |

The probes skip the `Host` check and the token, so orchestrators can call them by IP.

## Security checklist

- On anything but `localhost`: set `KERN_AUTH_TOKEN` to a long random value.
- List only the hostnames you use in `KERN_ALLOWED_HOSTS`.
- Behind a reverse proxy, every request comes from the proxy's address, so rate-limit at the proxy instead of with `KERN_RATE_LIMIT`.
