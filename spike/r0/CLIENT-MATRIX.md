# R0 client matrix runbook

This is the manual half of R0: the clients that need a person at the keyboard. The automated half (SDK clients over in-memory, HTTP and stdio, and MCP Inspector 2.8.0) is already done. Its results are in [findings.md item 17](../../docs/plan-v2/findings.md#17-sdk-v2-migration-facts).

Allow about 10 minutes per client. Fill in the table at the end, then copy it into finding 17.

## What you're running

The spike server is the real 52 KERN tools on SDK v2, plus diagnostic probes when `KERN_SPIKE_COMPAT=1` is set:

| Probe | What it tells us |
|---|---|
| `probe_defs_ref` | Does the client accept 2020-12 `$defs` with a recursive `$ref`? (R5 option A) |
| `probe_definitions_ref` | The same, using draft-07 `definitions` |
| `probe_anyof_root` | Does the client accept an `anyOf` root? The real `get_accordion`, `get_checkbox`, `get_radio` and `get_summary` also have one. |
| `probe_prompt` | Does the client surface MCP prompts? |
| `kern://probe/hello` | Does the client surface MCP resources? |
| `KERN_SPIKE_PAD=N` | Adds N no-op tools, to find the tool-count limit |

Every probe tool echoes its arguments back as `received: {...}`.

**Protocol era.** Every stdio and HTTP connection is logged, with client name, version, method and protocol version, to `%TEMP%\kern-r0-clients.log`. Read the era from there rather than guessing: `initialize` + `2025-11-25` means legacy, and `server/discover` + `2026-07-28` means modern.

## Build once

```bash
bash spike/r0/build.sh   # → spike/r0/mcpb/server/index.js, spike/r0/mcpb-http/index.js, spike/r0/kern-ux-r0-spike.mcpb
```

The stdio entry is `C:/src/github/leonio/kern-ux-mcp/spike/r0/mcpb/server/index.js`. It's `SERVER` below.

## Test script (same for every client)

Start a fresh chat or agent session with only this server enabled, and say each line below.

1. **T1 Listing.** "Which KERN tools do you have?" Check that the count is 55, or 55 + N with padding, and note any warnings the client shows.
2. **T2 Happy path.** "Use get_button to render a primary button labelled Weiter."
3. **T3 Error recovery.** "Call get_button with label OK and variant rainbow, then fix it if it fails." Did the model see the `isError` hint and retry with a valid variant?
4. **T4 `$defs`.** "Call probe_defs_ref with a tree: A → B → C." Was the tool available? Did the args arrive nested 3 levels deep?
5. **T5 `definitions`.** The same with `probe_definitions_ref`.
6. **T6 `anyOf` root.** "Call probe_anyof_root with mode email and address a@b.de", then "Render a radio group with get_radio: Ja/Nein."
7. **T7 Prompts.** Look for `probe_prompt` in the client's prompt UI, usually `/` or a prompt picker.
8. **T8 Resources.** Look for `kern://probe/hello` in the client's resource or attach UI.
9. **T9 Tool count.** Restart with `KERN_SPIKE_PAD=80` (135 tools). Does the client warn, truncate, refuse, or ask you to pick tools? Find where it breaks.
10. **T10 Era.** Copy the client's lines from `%TEMP%\kern-r0-clients.log`.

## Client setup

### VS Code + GitHub Copilot (stdio, then HTTP)

`.vscode/mcp.json` is git-ignored, so this is safe to create:

```json
{
  "servers": {
    "kern-spike": {
      "type": "stdio",
      "command": "node",
      "args": ["C:/src/github/leonio/kern-ux-mcp/spike/r0/mcpb/server/index.js"],
      "env": { "KERN_SPIKE_COMPAT": "1", "KERN_SPIKE_PAD": "0" }
    },
    "kern-spike-http": { "type": "http", "url": "http://localhost:3000/mcp" }
  }
}
```

For HTTP, start `KERN_SPIKE_COMPAT=1 node spike/r0/mcpb-http/index.js` first. Use Agent mode. The tool picker shows the enabled-tool count, which is where the tool cap applies.

### Codex CLI (stdio)

Codex isn't installed on this machine: `npm i -g @openai/codex`. Then in `~/.codex/config.toml`:

```toml
[mcp_servers.kern-spike]
command = "node"
args = ["C:/src/github/leonio/kern-ux-mcp/spike/r0/mcpb/server/index.js"]
env = { KERN_SPIKE_COMPAT = "1" }
```

### Claude Code (stdio)

```bash
claude mcp add kern-spike -s local -e KERN_SPIKE_COMPAT=1 -- node C:/src/github/leonio/kern-ux-mcp/spike/r0/mcpb/server/index.js
# afterwards: claude mcp remove kern-spike -s local
```

Prompts show up as `/mcp__kern-spike__probe_prompt`, and resources as `@kern-spike:` mentions.

### Claude Desktop (MCPB, and the Node 24 check)

1. Open `spike/r0/kern-ux-r0-spike.mcpb` (double-click, or Settings → Extensions → install from file).
2. Run the test script.
3. **Node 24 check:** record which Node runs the bundle, the built-in one or the system one (Settings → Extensions → advanced/runtime setting). Then flip the setting and repeat T2. The system Node here is 26.7.0. `npx -p node@24` gives a 24.21.0 binary if you need to point the system setting at 24.
4. The *Padding tools* field in the extension settings drives T9.

### ChatGPT (HTTP through a tunnel)

```bash
cloudflared tunnel --url http://localhost:3000        # prints https://<name>.trycloudflare.com
KERN_SPIKE_COMPAT=1 KERN_ALLOWED_HOSTS=localhost,127.0.0.1,<name>.trycloudflare.com node spike/r0/mcpb-http/index.js
```

In ChatGPT, open Settings → Connectors (developer mode) and add `https://<name>.trycloudflare.com/mcp` with no auth. A 403 in the server log means the tunnel host is missing from `KERN_ALLOWED_HOSTS`. Stop the tunnel when you're done, because the server has no auth.

### Responses API `mcp` tool (HTTP through the same tunnel)

```bash
curl https://api.openai.com/v1/responses -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" -d '{
  "model": "<current model>",
  "tools": [{ "type": "mcp", "server_label": "kern", "server_url": "https://<name>.trycloudflare.com/mcp", "require_approval": "never" }],
  "input": "Call probe_defs_ref with a tree A -> B -> C, then render a primary button labelled Weiter with get_button."
}'
```

The response's `mcp_list_tools` item shows which tools it imported. Tools it silently drops are the `$ref`/`anyOf` answer.

## Results

Legend: ✅ works · ⚠️ works with caveats · ❌ fails · — not applicable.

| Client (version) | Era (from log) | T1 count | T2 | T3 retry | T4 `$defs` | T5 `definitions` | T6 `anyOf` | T7 prompts | T8 resources | T9 tool cap | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MCP Inspector CLI 2.8.0 (stdio) | both | 55 ✅ | ✅ | `isError` ✅ | listed ✅ | listed ✅ | ✅ | ✅ | ✅ | — | automated; portability check: 2 warnings (`get_summary` `type` array) |
| MCP Inspector CLI 2.8.0 (HTTP) | both | 55 ✅ | ✅ | `isError` ✅ | listed ✅ | listed ✅ | ✅ | — | — | — | automated |
| VS Code Copilot (stdio) | | | | | | | | | | | |
| VS Code Copilot (HTTP) | | | ✅ | | | | | | | | reported working 2026-09-27; probes not recorded |
| Codex CLI | | | | | | | | | | | |
| Claude Code | | | | | | | | | | | reported "working with Claude" 2026-09-27 (Code or Desktop not recorded) |
| Claude Desktop (MCPB) | | | | | | | | | | | Node used: |
| ChatGPT (tunnel) | | | | | | | | | | | |
| Responses API `mcp` (tunnel) | | | | | | | | | | | |
