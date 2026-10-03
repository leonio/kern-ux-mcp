# Development

How to build, test and run the server from a checkout. For branch names, commit messages and releases, see [CONTRIBUTING.md](https://github.com/leonio/kern-ux-mcp/blob/main/CONTRIBUTING.md).

## Setup

You need Node.js 24.16+ and git. Docker is optional (for the container).

```bash
git clone https://github.com/leonio/kern-ux-mcp.git
cd kern-ux-mcp
git checkout feat/v2-alpha   # the 2.0 line, until it's merged into main
npm ci
```

`registry.json` is checked in, so you don't need KERN's sources to run or test the server.

## The repo in one minute

| Path | What's there |
|---|---|
| `packages/core` | All the tools, templates, validation and the MCP wiring. Private, not published. |
| `packages/stdio` | The stdio server (`@leonio/kern-ux-mcp`) and the `.mcpb` bundle. |
| `packages/http` | The HTTP server (`@leonio/kern-ux-mcp-http`), its `Dockerfile` and `compose.yaml`. |
| `tools/` | Dev scripts: imports, eval, listing sizes. |
| `docs/` | Contributor docs, the 2.0 plans, and this wiki (`docs/wiki/`). |

## Run from source

No build needed; these run the TypeScript directly:

```bash
npm run dev        # stdio server
npm run dev:http   # HTTP server on http://127.0.0.1:3000/mcp
```

To run the built output, as users do:

```bash
npm run build
npm run start        # stdio
npm run start:http   # HTTP
```

To point a client at your checkout, use the built file as the command, e.g. for Claude Code:

```bash
claude mcp add kern-ux-dev -- node /path/to/kern-ux-mcp/packages/stdio/dist/index.js
```

## Checks

Run these before you push; CI runs the same:

| Command | Checks |
|---|---|
| `npm test` | Unit tests (Vitest), including the tool-list snapshots |
| `npm run test:e2e` | End-to-end tests against the built stdio and HTTP servers (run `npm run build` first) |
| `npm run lint` | Biome lint (`npm run format` fixes formatting) |
| `npm run typecheck` | TypeScript, for the packages and for `tools/` |
| `npm run docker:build` | Builds the container image |

If a snapshot test fails because you meant to change a tool, update the snapshots with `npx vitest run -u` and review the diff.

## Eval

`npm run eval -- --label <name>` runs scripted scenarios through Claude Code with the stdio server and records tool calls, errors and cost. It uses your Claude Code login. Compare two runs with `npm run eval:compare`. See the header of [`tools/eval/run.ts`](https://github.com/leonio/kern-ux-mcp/blob/main/tools/eval/run.ts) for the options.

## Updating KERN data

See [KERN data import](KERN-Data-Import).

## Editing this wiki

Edit the files in `docs/wiki/` and open a pull request. When it's merged into `main`, the **Wiki** workflow publishes them. Edits made directly in the GitHub wiki are overwritten.

### Screenshots

Screenshots live in `docs/wiki/images/`. Until someone captures them, each is a grey placeholder. To replace one, save a PNG under the same name (about 1280 px wide, light theme, no personal data):

| File | Page | Shows |
|---|---|---|
| `images/claude-code-first-tool-call.png` | [Setup-Claude-Code](Setup-Claude-Code) | Claude Code calling a kern-ux tool |
| `images/claude-code-mcp-panel.png` | [Setup-Claude-Code](Setup-Claude-Code) | The /mcp panel in Claude Code showing kern-ux connected |
| `images/claude-desktop-custom-connector.png` | [Setup-Claude-Desktop](Setup-Claude-Desktop) | The Add custom connector dialog with the server URL |
| `images/claude-desktop-mcpb-install.png` | [Setup-Claude-Desktop](Setup-Claude-Desktop) | The Claude Desktop install dialog for the KERN UX extension |
| `images/claude-desktop-tools-menu.png` | [Setup-Claude-Desktop](Setup-Claude-Desktop) | The Claude Desktop tools menu listing kern-ux |
| `images/docker-compose-up.png` | [HTTP-Server-with-Docker](HTTP-Server-with-Docker) | Terminal showing docker compose up and the listening line |
| `images/inspector-tools.png` | [Debugging-and-Troubleshooting](Debugging-and-Troubleshooting) | MCP Inspector listing the kern-ux tools and a tool result |
| `images/vscode-first-tool-call.png` | [Setup-VS-Code-Copilot](Setup-VS-Code-Copilot) | Copilot Chat calling render_composition and showing the HTML result |
| `images/vscode-http-server-running.png` | [Setup-VS-Code-Copilot](Setup-VS-Code-Copilot) | MCP: List Servers showing kern-ux running over HTTP |
| `images/vscode-stdio-mcp-json.png` | [Setup-VS-Code-Copilot](Setup-VS-Code-Copilot) | The mcp.json file in VS Code with the Start link above the kern-ux server |
| `images/vscode-tools-picker.png` | [Setup-VS-Code-Copilot](Setup-VS-Code-Copilot) | The Copilot Chat tools picker showing the kern-ux tools |

## Deeper reading

- [Codebase guide](https://github.com/leonio/kern-ux-mcp/blob/main/docs/codebase-guide.md)
- [Contributor guide](https://github.com/leonio/kern-ux-mcp/blob/main/docs/contributor-guide.md)
