# Run the HTTP server

`@leonio/kern-ux-mcp-http` serves the same tools as the stdio server at `/mcp`, over Streamable HTTP. It's stateless: every request gets its own server instance, so it needs no sticky sessions.

## Try it without installing

A free, public instance runs at `https://kernuxmcphost.velixir.run/mcp`, with no sign-up and no token:

```bash
claude mcp add --transport http kern-ux https://kernuxmcphost.velixir.run/mcp
```

It's meant for trying the server out, on free hosting with limited capacity and no uptime guarantee, so run your own instance for anything you depend on. Thank you to [velixir](https://velixir.net) for hosting it for free in the EU.

## Run it with npx

You need Node.js 24.16+.

```bash
npx -y @leonio/kern-ux-mcp-http
# Kern UX MCP server <version> listening on http://127.0.0.1:3000/mcp
```

Then connect a client to `http://localhost:3000/mcp`: [VS Code Copilot](./setup-vs-code-copilot.md#http) or [Claude Code](./setup-claude-code.md#http).

## Run it with Docker Compose

The repo has a ready-made Compose file: [`packages/http/compose.yaml`](https://github.com/leonio/kern-ux-mcp/blob/main/packages/http/compose.yaml), with every setting in it, commented out.

1. Clone the repo and start the server:

   ```bash
   git clone https://github.com/leonio/kern-ux-mcp.git
   cd kern-ux-mcp
   docker compose -f packages/http/compose.yaml up --build
   ```

   The first run builds the image. When it's ready, the log shows:

   ```
   Kern UX MCP server <version> listening on http://0.0.0.0:3000/mcp (allowed hosts: localhost, 127.0.0.1)
   ```

   ![Terminal showing docker compose up and the listening line](./images/docker-compose-up.png)

2. Check it's up:

   ```bash
   curl http://localhost:3000/healthz
   ```

3. Connect a client to `http://localhost:3000/mcp`: [VS Code Copilot](./setup-vs-code-copilot.md#http) or [Claude Code](./setup-claude-code.md#http).

Stop it with `Ctrl+C`, or run it in the background with `up -d --build` and stop it with `docker compose -f packages/http/compose.yaml down`. `npm run docker:build` builds the image alone, as `kern-ux-mcp-http:dev`.

## Use the published image instead of building

The image is `ghcr.io/leonio/kern-ux-mcp-http`. To skip the build, create your own `compose.yaml` anywhere:

```yaml
services:
  kern-ux-mcp-http:
    image: ghcr.io/leonio/kern-ux-mcp-http:latest   # or a fixed version tag
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      KERN_ALLOWED_HOSTS: localhost,127.0.0.1
    read_only: true
    cap_drop: [ALL]
    security_opt: ["no-new-privileges:true"]
    restart: unless-stopped
```

and run `docker compose up -d`. Image tags follow npm: the exact version, `alpha` for the newest pre-release, `latest` for the newest release.

Without Compose, the same thing is:

```bash
docker run --rm -p 127.0.0.1:3000:3000 -e KERN_ALLOWED_HOSTS=localhost ghcr.io/leonio/kern-ux-mcp-http:latest
```

The image sets `HOST=0.0.0.0`, so it needs `KERN_ALLOWED_HOSTS`.

## Change settings

Settings are environment variables. In the Compose file, uncomment what you need and run `up` again. The most useful ones:

| Variable | Use it to |
|---|---|
| `KERN_AUTH_TOKEN` | Require `Authorization: Bearer <token>`. Set it whenever others can reach the port. |
| `KERN_ALLOWED_HOSTS` | List the hostnames clients use to reach the server. |
| `KERN_DEBUG: "1"` | Log every request and tool call. |

All settings, the endpoints and a security checklist: [Configuration](./configuration.md).

## Reaching it from outside your machine

The Compose file publishes the port on `127.0.0.1` only, so only your machine can connect. To share it:

1. Set a long random `KERN_AUTH_TOKEN`.
2. Add the hostname others will use to `KERN_ALLOWED_HOSTS`, for example `localhost,mcp.example.com`.
3. Change the port mapping to `"3000:3000"`, or put a reverse proxy with HTTPS in front.

Some clients only connect to public HTTPS URLs: [Claude Desktop](./setup-claude-desktop.md#http)'s custom connectors, ChatGPT, and the OpenAI Responses API `mcp` tool. For local testing, put a tunnel in front of the server and allow the tunnel's hostname:

```bash
cloudflared tunnel --url http://localhost:3000
# prints https://<name>.trycloudflare.com

KERN_ALLOWED_HOSTS=localhost,<name>.trycloudflare.com npx -y @leonio/kern-ux-mcp-http
```

Then use `https://<name>.trycloudflare.com/mcp` as the server URL. `ngrok http 3000` works the same way. The tunnel makes the server public, so set `KERN_AUTH_TOKEN` if your client can send an `Authorization` header, and stop the tunnel when you're done.

## What the container does

- Runs on distroless Node 24 as a non-root user, with no shell and no `node_modules`.
- Works with a read-only root filesystem (`--read-only`).
- Has a `HEALTHCHECK` on `/healthz`.
- On `docker stop`, finishes in-flight requests (up to 8 seconds), then exits.
