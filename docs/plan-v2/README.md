# Plan v2: the 2.0 work

2.0 moved the server to MCP protocol `2026-07-28` and SDK v2, split it into a private core with stdio, MCPB and HTTP hosts, cut the model-facing tool listing from 201K to about 119K characters, built its KERN knowledge from the knowledge bundle, and added resources and prompts. The work ran on `feat/v2-alpha` from 2026-09-27 to 2026-10-06, in steps R0 to R7.

This folder keeps what's useful after the release:

| File | What it is |
|---|---|
| [history.md](history.md) | How the work was carried out, step by step: what each step did, the decisions that shaped it, the measurements and what was learned. |
| [knowledge-bundle.md](knowledge-bundle.md) | The design of the KERN knowledge bundle and how this repo uses it, with the decisions behind it. The packer's schema and `knowledge-map.ts` cite it. |
| [evals/](evals/) | The eval reports. `npm run eval` writes here; the newest reports are the reference for the next comparison. |

Elsewhere:
- What changed for clients: [migration-2.0.md](../migration-2.0.md)
- The code: [codebase-guide.md](../codebase-guide.md), [contributor-guide.md](../contributor-guide.md)
- Releasing: [CONTRIBUTING.md](../../CONTRIBUTING.md#releasing), [release-bootstrap.md](../release-bootstrap.md)

## Open after 2.0

### Planned

- **The `defineTool()` migration**, from the discovery findings. None of it changes what a client sees.
  - `defineTool<I, O>()` ties each handler's argument type to its schema; today `ToolDef` erases it, and handlers type their arguments by hand.
  - `normalize` and `errorHint` move next to each tool, out of the name-keyed branches in `invoke.ts`, with `TOOL_EXAMPLES` as the tool's `examples`.
  - The interactive tools become one declarative table instead of 26 small builders and a switch (`tool-builders/interactive.ts`).
  - A generic `buildHtmlTool()` for `get_section`, `get_card_group`, `get_disclosure` and `render_composition`, which repeat the parameterized tool's steps.
- **`get_tokens` from the bundle**, once the packer writes `foundations/tokens.json`. Today's tokens are carried over from the old registry. Then `get_utility_reference` from the bundle's utilities.
- **K2, conformance with KERN:** the parameter map (`get_button.size` to `button.options.size`), tests against the bundle's tagged examples, and a coverage matrix. This is what would have caught the button sizes, wrong since KERN 2.8.0 until R5 noticed.
- **K5:** React bindings and JSX output.

### Constraints to know

- **The listing has about 580 characters of room** under the 120K budget (`tools.budget.test.ts`). The next schema addition needs a trim first; the shared `strict` description, repeated in 52 tools, is the biggest one left.
- **Unparsable input is the most common error** in the evals: Haiku's JSON breaks on long calls with HTML in strings. Block kinds that replace pasted HTML help (the `summary` block did).
- **The stdio bundle is about 612 KB.** The registry carries all of the utilities page for the guides, which quote a few sections; trim it if size matters.

### Known issues

- `get_dropdown`'s description says "not a menu"; KERN's summary says it's a collapsible menu of actions or links.
- `get_pattern` has no example: KERN's own header story fails strict validation (an `<img>` without `alt`).
- Models try a `table` block kind, then fall back to `get_table` in an `html` block. A table block kind would be a decision of its own.
- The Notification Banner note still loses to the model's habits in about one run of three. It opens with "KERN documents …"; leading with "Use `get_alert` …" might hold better.
- Claude Code shows a `resource_link` as a text line before the JSON text. A client should read the structured content, not the first text block.
- The fallback tools' markup is on one line until the packer keeps the stories' formatting.
- `server.test.ts`'s per-request timing test can fail under coverage (5.1 ms against 5 ms).
- Release tooling: a dry run skips the publish steps, so publish bugs show only in a real release. The pinned `mcpb` and CycloneDX CLIs (`tools/build/`) aren't updated by Renovate.
- `ubuntu-latest` becomes Ubuntu 26 on 2026-10-19; watch the first CI run after it.
- Deferred by decision: OpenTelemetry in the HTTP host, an MCPB `default_locale` option, an MCPB icon (`packages/stdio/mcpb/icon.png` is picked up when added).

### Asks for the packer

None blocks anything here:
- a canonical example marker per component, and multi-line example markup
- one accessibility entry per criterion, with obligations
- defaults (or `required`) for `alert.tone`, `badge.tone`, `button.type`, `heading.size` and `icon.name`
- `foundations/tokens.json`
- `whenNotToUse` with `useInstead`, and `similar[].difference`
- English section headings and pattern titles
- in `index.json` and the schema, descriptions that still predate the one-way design

### Ideas, not scheduled

- Publish to the official MCP Registry (`server.json`): the npm package, the image, later a remote URL.
- The MCP Apps extension: a live preview of rendered HTML in hosts that support it.
- Context size, looked at on 2026-10-02 and not needed at today's size: a gateway (`search_tools` plus `call_tool`) works but only as an opt-in profile, since the model must find the right tool; scoping tools per sub-agent doesn't shrink any schema. Revisit only for models with small windows.

## How to run the next big update

This is how 2.0 ran, and it worked:

1. **Discovery first.** Read the code and write findings as **Where**, **Problem**, **Proposal**, **Risk**, with file references. Then a roadmap of steps that can each be released, with the decisions in a table.
2. **One plan file per step** (a kickoff): the task, the decisions to confirm, and the plan in groups of commits, one commit per box. Check it with the maintainer before the first commit.
3. **Pause after each group** for review. A trailing `docs:` commit records progress, measurements and lessons in the kickoff.
4. **A handover file** when a session's context or usage runs low: the state, what to do first, open findings. The next session starts from it.
5. **Don't push without asking.** The maintainer pushes doc changes to the branch too, so `git pull --rebase` before committing.
6. **Contract changes** get a [migration-2.0.md](../migration-2.0.md)-style entry in the same commit. On a pre-release branch, describe them in the commit body: `!` or `BREAKING CHANGE:` is GitVersion's major bump.
7. **Measure what a model sees** with the eval, and compare on the same commit. Keep the safety nets green: the two listing snapshots, the budget test, the golden examples, `names.test.ts`, the nesting matrix, e2e on both protocol eras, the packed install.
8. **At the end, condense** the step files into a history like [history.md](history.md) and delete them.

### Running the eval

- `npm run eval -- --label <name> [--suite base|nested|prompts|resources] [--only <scenario>] [--runs 3]`, then `npm run eval:compare -- <a> <b>`. `--from-transcripts` rescores saved runs for free, after a new check. `--without-prompts` runs the prompts suite on the tasks' own text; `--resources` gives the model Claude Code's resource tools.
- **Commit and build first, and don't touch the repo while it runs:** it records the commit as `+dirty` otherwise, untracked files included.
- **The first runs of a session write the prompt cache** and cost more. Run the comparison suite first, or compare cost only on warm runs.
- **Read the transcripts** (`tools/eval/.runs/<label>/`) before trusting a number, and add a check for any miss you care about: the checks only see what they look for.
- A lost connection leaves runs `FAILED` at `$0.000`; repeat them under a new label.

### Lessons that carry over

**Writing for models:**
- Say what to do, not what not to do: naming a mistake invites it.
- Quote the shape of a structure instead of describing it.
- Ask for a thing once, and say what comes after as well as what comes first.
- Shorter isn't always safe: name an object's keys.
- Most savings are duplication, not wording.
- Guidance that matters goes on the tool path: models read resources only through links from tools, or when a person attaches them.
- When two rewordings don't fix a behaviour, change the tool.

**Working against KERN:**
- Check KERN before "fixing" towards it; count KERN's own uses when it's inconsistent.
- Check markup against the published CSS (`npm pack @kern-ux/native`), not a sample's copy, and look at it in a headless browser.
- Check that a warning or rule can fire with a test that renders the case.
- Sweep, don't list: grep every instance of a pattern, then add a test that covers all of them.

### Environment notes (Windows)

- Git Bash heredocs and inline `node -e` mangle backslashes and apostrophes. Write scripts with escapes to a file first, and open files with `newline="\n"` in Python.
- `dotnet-gitversion` needs the repo path when run from Git Bash (or run it from PowerShell in the repo root).
- Scripts with top-level await run as `.mts` with `node --import tsx`, importing repo modules by `file:///C:/…` URL.
- Headless Chrome or Edge for visual checks: `--headless=new --window-size=W,H --screenshot=<png>` or `--dump-dom`; the narrowest window is about 500 px.
- `vitest run -u` updates every file snapshot, not just one file's. Review them all.
- For Node 24 checks: `npx -y -p node@24 node …`.
