# Set up Claude Code

Claude Code adds MCP servers with `claude mcp add`. You need Node.js 24.16+ for stdio.

## stdio

```bash
claude mcp add kern-ux -- npx -y @leonio/kern-ux-mcp
```

Everything after `--` is the command that starts the server.

Add `--scope project` to save it in the project's `.mcp.json`, so everyone who opens the repo gets it:

```bash
claude mcp add --scope project kern-ux -- npx -y @leonio/kern-ux-mcp
```

## HTTP

Start the server first, for example with [Docker](HTTP-Server-with-Docker). Then:

```bash
claude mcp add --transport http kern-ux http://localhost:3000/mcp
```

With a token:

```bash
claude mcp add --transport http kern-ux https://mcp.example.com/mcp \
  --header "Authorization: Bearer $KERN_AUTH_TOKEN"
```

## Check it

Start `claude` and type `/mcp`. `kern-ux` shows as connected, and you can list its tools.

![The /mcp panel in Claude Code showing kern-ux connected](images/claude-code-mcp-panel.png)

Then ask: *"Using KERN, build a contact form with name, email and message, and validate it."*

![Claude Code calling a kern-ux tool](images/claude-code-first-tool-call.png)

## Useful commands

| Command | Does |
|---|---|
| `claude mcp list` | Lists servers and whether they connect |
| `claude mcp get kern-ux` | Shows one server's settings |
| `claude mcp remove kern-ux` | Removes it |

## If it doesn't work

- **`failed` in `/mcp`**: run the server command yourself (`npx -y @leonio/kern-ux-mcp`). It should wait silently; any error shows there.
- More in [Debugging and troubleshooting](Debugging-and-Troubleshooting).
