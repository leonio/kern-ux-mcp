# Development

How to build, test and run the server from a checkout. For branch names, commit messages and releases, see [CONTRIBUTING.md](https://github.com/leonio/kern-ux-mcp/blob/main/CONTRIBUTING.md).

## Setup

You need Node.js 24.16+ and git. Docker is optional (for the container).

```bash
git clone https://github.com/leonio/kern-ux-mcp.git
cd kern-ux-mcp
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
| `docs/` | Contributor docs, the 2.0 plans, and this site (`docs/site/`). |

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

See [KERN data import](./kern-data-import.md).

## Editing these docs

This site is built with [VitePress](https://vitepress.dev) from the Markdown in `docs/site/`, which has its own `package.json` and lockfile, outside the npm workspace. To preview a change:

```bash
npm ci --prefix docs/site   # once
npm run docs:dev            # http://localhost:5173/kern-ux-mcp/
```

`npm run docs:build` builds the site as CI does, and fails on a link to a page that doesn't exist. Link pages relatively, with the `.md` extension (`[Configuration](./configuration.md)`), so the links also work on GitHub. The sidebar is in `docs/site/.vitepress/config.mts`.

A pull request that changes `docs/site/` builds the site; when it's merged into `main`, the **Pages** workflow publishes it.

### Screenshots

Screenshots live in `docs/site/images/`. Until someone captures them, each is a grey placeholder. To replace one, save a PNG under the same name (about 1280 px wide, light theme, no personal data):

| File | Page | Shows |
|---|---|---|
| `images/claude-code-first-tool-call.png` | [Set up Claude Code](./setup-claude-code.md) | Claude Code calling a kern-ux tool |
| `images/claude-code-mcp-panel.png` | [Set up Claude Code](./setup-claude-code.md) | The /mcp panel in Claude Code showing kern-ux connected |
| `images/claude-desktop-custom-connector.png` | [Set up Claude Desktop](./setup-claude-desktop.md) | The Add custom connector dialog with the server URL |
| `images/claude-desktop-mcpb-install.png` | [Set up Claude Desktop](./setup-claude-desktop.md) | The Claude Desktop install dialog for the KERN UX extension |
| `images/claude-desktop-tools-menu.png` | [Set up Claude Desktop](./setup-claude-desktop.md) | The Claude Desktop tools menu listing kern-ux |
| `images/docker-compose-up.png` | [Run the HTTP server](./http-server.md) | Terminal showing docker compose up and the listening line |
| `images/inspector-tools.png` | [Debugging and troubleshooting](./debugging-and-troubleshooting.md) | MCP Inspector listing the kern-ux tools and a tool result |
| `images/vscode-first-tool-call.png` | [Set up VS Code Copilot](./setup-vs-code-copilot.md) | Copilot Chat calling render_composition and showing the HTML result |
| `images/vscode-http-server-running.png` | [Set up VS Code Copilot](./setup-vs-code-copilot.md) | MCP: List Servers showing kern-ux running over HTTP |
| `images/vscode-stdio-mcp-json.png` | [Set up VS Code Copilot](./setup-vs-code-copilot.md) | The mcp.json file in VS Code with the Start link above the kern-ux server |
| `images/vscode-tools-picker.png` | [Set up VS Code Copilot](./setup-vs-code-copilot.md) | The Copilot Chat tools picker showing the kern-ux tools |

## Deeper reading

- [Codebase guide](https://github.com/leonio/kern-ux-mcp/blob/main/docs/codebase-guide.md)
- [Contributor guide](https://github.com/leonio/kern-ux-mcp/blob/main/docs/contributor-guide.md)
