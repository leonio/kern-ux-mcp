# HTTP server with Docker

Run the server in a container on your machine and connect clients to `http://localhost:3000/mcp`. You need Docker with Compose.

## Run it with Docker Compose

The repo has a ready-made Compose file: [`packages/http/compose.yaml`](https://github.com/leonio/kern-ux-mcp/blob/main/packages/http/compose.yaml).

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

   ![Terminal showing docker compose up and the listening line](images/docker-compose-up.png)

2. Check it's up:

   ```bash
   curl http://localhost:3000/healthz
   ```

3. Connect a client to `http://localhost:3000/mcp`: [VS Code Copilot](Setup-VS-Code-Copilot#http) or [Claude Code](Setup-Claude-Code#http).

Stop it with `Ctrl+C`, or run it in the background with `up -d --build` and stop it with `docker compose -f packages/http/compose.yaml down`.

## Use the published image instead of building

To skip the build, create your own `compose.yaml` anywhere:

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

## Change settings

Settings are environment variables. The Compose file has them all, commented out. Uncomment what you need and run `up` again. The most useful ones:

| Variable | Use it to |
|---|---|
| `KERN_AUTH_TOKEN` | Require `Authorization: Bearer <token>`. Set it whenever others can reach the port. |
| `KERN_ALLOWED_HOSTS` | List the hostnames clients use to reach the server. |
| `KERN_DEBUG: "1"` | Log every request and tool call. |

All settings: [Configuration](Configuration).

## Reaching it from outside your machine

The Compose file publishes the port on `127.0.0.1` only, so only your machine can connect. To share it:

1. Set a long random `KERN_AUTH_TOKEN`.
2. Add the hostname others will use to `KERN_ALLOWED_HOSTS`, for example `localhost,mcp.example.com`.
3. Change the port mapping to `"3000:3000"`, or put a reverse proxy with HTTPS in front.

For a quick public HTTPS URL (needed by [Claude Desktop](Setup-Claude-Desktop#http)), use a tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
# prints https://<name>.trycloudflare.com → add <name>.trycloudflare.com to KERN_ALLOWED_HOSTS
```

## What the container does

- Runs on distroless Node 24 as a non-root user, with no shell.
- Works with a read-only root filesystem.
- Has a `HEALTHCHECK` on `/healthz`.
- On `docker stop`, finishes in-flight requests (up to 8 seconds), then exits.
