# R5 handover: mid-step, before the English areas

As of 2026-10-02. Start a new session here. R5 is about half done: the groundwork, the scripted baseline and option B have landed, and the English areas (groups C and D) are next. The plan, progress and everything learned so far are in [r5-kickoff.md](r5-kickoff.md); this file is the short version plus what to do first.

## State

- **Branch:** `feat/v2-alpha`. The maintainer pushed up to `86b3fb4` (CI green). 9 local commits since then, from `bfb41ed` to this file, not pushed.
- **Server:** 54 tools. Model-facing listing (name, description and `inputSchema`, compact JSON) **143,097 characters**; budget 144,000; R5 target 120,000. `npm run listing:sizes` prints the table.
- **Checks:** 1779 tests; coverage 97.0 / 91.3 / 98.0 / 97.0 (floors 94.5 / 88 / 96 / 94.5); Biome, both typechecks, build and e2e pass.
- **Release:** the last release is `2.0.0-alpha.69` (R3). Everything since (R4, R4b A and B, R5 so far) is unreleased. A release no longer needs a registry regeneration.

### What landed this session

| Step | Commits | Where to read |
|---|---|---|
| The 2026-10-02 review: plan revisions, decisions | `0279b68`–`b03eda9` | [r4-handover.md](r4-handover.md#review-on-2026-10-02), [roadmap.md](roadmap.md) |
| Migration notes from 1.1.2 to now | `0279b68`, then one entry per contract change | [../migration-2.0.md](../migration-2.0.md) |
| R4b A: code owns the tool list (`COMPONENT_TOOLS`); notes about our tools in `tool-notes.ts` | `61fa863`, `88467a6` | [r4b-kickoff.md](r4b-kickoff.md) |
| R4b B: the registry contract (Zod), its JSON Schema export, the validation test, `registry:import` | `a49d540`–`e522b80` | [r4b-kickoff.md](r4b-kickoff.md) |
| The knowledge-bundle design, and the decisions on it | `241286a`, `9fb3682` | [knowledge-bundle.md](knowledge-bundle.md) |
| R5 A: the context budget, the `examples` table | `67ee553`, `52b24fa` | [r5-kickoff.md](r5-kickoff.md) |
| R5: the scripted eval harness and the baseline | `bfb41ed`–`9ff5a80` | [r5-kickoff.md](r5-kickoff.md#the-scripted-baseline-roadmap-box-1), [r5-eval/](r5-eval/) |
| R5 B: option B (simple blocks in the six standalone block tools) | `3b896de`, `c7bf5cc`, `4fa2bb5` | [r5-kickoff.md](r5-kickoff.md#b-option-b-done-roadmap-box-3) |

### The eval, in short

`npm run eval -- --label <name>` runs ten scenarios × three runs through Claude Code in headless mode with Haiku 4.5 against the built stdio server (`npm run build` first). It uses the Claude Code login, not an API key, and costs about $1.10 for 30 runs. Reports go to [r5-eval/](r5-eval/); `npm run eval:compare -- baseline <label>` compares; `--from-transcripts` re-scores saved runs.

| | baseline | option B |
|---|---|---|
| First request tokens | 70,676 | **50,340** |
| Completed / checks | 30 / 95 of 96 | 30 / 95 of 96 |
| Error results | 2 | 9 (none in the narrowed tools; see below) |

With 30 runs, error counts are noisy; read the transcripts (`tools/eval/.runs/<label>/`) before concluding.

## Do first

1. **Review the generator's first bundle** (the maintainer asked for feedback). It's at `C:\src\github\leonio\kern-ux-scraper\kern-knowledge\` (bundle version 0.2.0, 49 component files with examples split into `*.examples.json`, `foundations/`, `patterns/`, `report.json`, 1.3 MB), with its own schema at `kern-ux-scraper/schema/knowledge-bundle.schema.json`. Check it against [knowledge-bundle.md](knowledge-bundle.md):
   - the layout and the component document's sections
   - stable IDs, size limits, provenance, drift
   - option bindings and example tags (K2)
   - no copied docs prose (CC BY-NC-SA)
   - who owns the schema: the design has this repo owning the contract (Zod, exported); the generator wrote its own
   Give feedback first, then plan the bundle contract and `knowledge:import` (R4b, re-planned as phases K1–K4).
2. **Then R5 group C** (English areas 1 and 2), with the eval after each area.

## Next in R5

From [r5-kickoff.md](r5-kickoff.md) and the [roadmap](roadmap.md#r5-english-base-language-and-the-context-budget):
- **C:** English for the foundations and form-field schemas, then for layout and typography.
- **D:** English for the interactive tools, then composition: `COMPOSITION_CHEAT_SHEET`, the error hints (render known-good payloads from `TOOL_EXAMPLES`), and descriptions as API text only, leaving about 7K of budget for registry summaries.
- **Then:** the optional compact profile (ask whether it's still wanted once the full set is under 120K), and R5.1 (output polish).

Fold these findings into the area they belong to (details in r5-kickoff.md):
1. The `get_button` hint's stale size list (`default | small`).
2. Three descriptions repeat payloads now in `TOOL_EXAMPLES`.
3. `field` options: accept `{ value, text }` as well as `{ value, label }` (the baseline's only errors).
4. `get_accordion`: infer `mode: "group"` from `items`, or say so in the hint.
5. The `disclosure` block: accept `content` like the tool, or name `contentBlocks` in the hint.
6. Icon names: suggest the closest valid names in the hint (`arrow_forward` → `arrow-forward`, `trash` → `delete`).

Each area: one commit, lower `LISTING_BUDGET.modelFacing` when the ratchet asks, run the eval with a new label and compare, record in r5-kickoff.md, migration-notes entry where the contract changes, pause after each group.

## Environment notes

- **Git Bash heredocs mangle backslashes** in JavaScript and Python. Write scripts that contain escapes with the Write tool.
- **Generated files Biome ignores:** `registry.json`, `docs/registry.schema.json`, `docs/plan-v2/r5-eval/`.
- **`git stash` keeps untracked files.** A coverage comparison against `HEAD` with a new module still present counts that module as untested.
- **The eval records the server commit when it finishes,** so commit before running it, and don't rebuild `dist/` while it runs.
- **The eval spawns `claude.exe`** (`~/.local/bin`) with `--tools ""`, `--strict-mcp-config`, `--setting-sources project` and an empty temp working directory. Override the binary with `CLAUDE_BIN`.
- **"No visible change" can be proved:** capture every tool's validation hint for one invalid input before and after a refactor and compare (see r5-kickoff.md, A2).
- Earlier notes still apply: [r4-handover.md](r4-handover.md#environment-notes-beyond-r3-handovermd).
