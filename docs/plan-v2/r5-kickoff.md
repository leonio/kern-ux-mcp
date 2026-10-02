# Kickoff: roadmap step R5 (English base language and the context budget)

This file holds the R5 plan, its progress and what was learned. Snapshot date: 2026-10-02. The state R5 starts from: [r4-handover.md](r4-handover.md) (measurements and the 2026-10-02 review) and [r4b-kickoff.md](r4b-kickoff.md) (what R4b changed).

## Your task

Do **R5** from [roadmap.md](roadmap.md#r5-english-base-language-and-the-context-budget): a scripted baseline, the context-budget test, option B, the `examples` table, English in four areas, and optionally a compact profile. Then R5.1 (output polish).

Working agreements (standing, from the user):
- One commit per roadmap checkbox on `feat/v2-alpha`, a **pause for review after each group**, and a trailing `docs:` commit per group that updates this file.
- **Don't push without asking.** A contract change adds an entry to [../migration-2.0.md](../migration-2.0.md).
- English is the base language for model-facing text; German stays where the decisions table says.
- The maintainer is rebuilding the generator from [knowledge-bundle.md](knowledge-bundle.md). R5 doesn't wait for it: tool descriptions carry API text only and leave about 7K of budget for the bundle's summaries.

## Where things stand

- **Branch:** `feat/v2-alpha` at `9fb3682`, 18 commits ahead of origin. The last release is `2.0.0-alpha.69` (R3).
- **Server:** 54 tools. Model-facing listing (name, description and `inputSchema`, compact JSON) about 200K characters; `outputSchema` adds 49K.
- **Checks:** 1742 tests, coverage 96.9 / 90.5 / 97.9 / 96.9.

## The baseline without a release

The scripted baseline spawns the stdio server itself, so it doesn't need an npm release. It runs against a local build of **the last commit before R5 changes anything the model sees**, checked out in a separate worktree. Group A changes nothing model-facing (the listing snapshots and tool outputs stay identical), so that commit is the end of group A. The harness can run any time after that, against that commit and against later ones.

## Plan

### A. Model-neutral groundwork

**A1. Context-budget test** (roadmap box 2).
- `listing-budget.ts` measures each tool's model-facing size (compact JSON of name, description and `inputSchema`) and `outputSchema` separately.
- `tools.budget.test.ts` fails when the total passes the budget, and also when the budget sits well above the actual total, so each saving lowers it (a ratchet). The budget starts at today's total and steps down to the 120K target during R5. A failure message lists the largest tools.
- `npm run listing:sizes` prints the per-tool table, sorted, with the totals and the target.

**A2. The `examples` table** (roadmap box 4).
- `tool-examples.ts`: known-good inputs keyed by tool name, the first piece of `defineTool()`'s `examples`.
- A golden test: every example passes the tool's input schema and renders with `strict: true`, with no validation errors.
- `formatInputValidationHint` builds its "Known-good payload" lines from the table, rendered **byte for byte** as today. The English pass changes the wording later.

### B. Option B (roadmap box 3)

Measure a fixed shallow block set against sets matched to each tool's job, then choose and implement. Model-facing; needs the baseline first.

### C, D. English, two areas each (roadmap boxes 5–8)

### E. Optional compact profile, then R5.1

## Open (for the maintainer)

1. **The harness:** which model API it calls (the Claude API, OpenAI, or both), which model, and whose API key. Also the scenario list (8–10 tasks: Wohngeld wizard, contact form, landing page, …) to review.

## Progress

- [x] A1 `67ee553`: `LISTING_BUDGET` with a ratchet test, `npm run listing:sizes`
- [x] A2 `52b24fa`: `TOOL_EXAMPLES` with a golden test; the hints render their payloads from it, byte for byte

**Baseline commit: `52b24fa`.** Group A changed nothing model-facing, so the harness measures the pre-R5 server at this commit (build it in a worktree: `git worktree add ../kern-ux-mcp-baseline 52b24fa`, then `npm ci && npm run build` there).

Learned in A:
- **The numbers:** 201,295 model-facing characters in 54 tools; `outputSchema` 48,281 more. The budget starts at 202,000 with 2,000 of slack, so the first saving of more than about 1,300 characters makes the test ask for a lower budget.
- **"No visible change" can be proved.** For A2, a scratch script captured every tool's validation hint for one invalid input (44 tools produce one) before and after the change and compared them: identical. The same check fits any refactor that must not change model-facing text.
- **Git Bash heredocs mangle backslashes in JavaScript too,** not only in Python: a regex in a heredoc script lost its escapes. Scripts with escapes go through the Write tool.
- For the English areas (C, D):
  - The `get_button` hint says "Allowed sizes: default | small"; the schema also allows `x-small`. The hint text is stale.
  - Three descriptions repeat a known-good payload that is now in `TOOL_EXAMPLES` (`get_section`, `get_card_group` in `tools.ts`, `get_dialog` in `interactive.ts`). The English pass should render them from the table, or drop them in favour of the hint.
- Tests: 1742 → 1764. Coverage 97.0 / 91.1 / 98.0 / 96.9.

### The scripted baseline (roadmap box 1)

- [x] `bfb41ed`, `2a329f9`: `npm run eval -- --label <name>` (harness in `tools/eval/`), with `--from-transcripts` to re-score saved runs
- [x] `c07f269`: the baseline, [r5-eval/baseline.json](r5-eval/baseline.json)

**How it runs.** Claude Code in headless mode (`claude -p`) with Haiku 4.5 (`claude-haiku-4-5`, the maintainer's choice), the kern stdio server as its only MCP server, built-in tools off, a short client-like system prompt, an empty working directory and no project settings. It runs on the Claude Code login, so no API key. Ten scenarios × three runs; about $0.03–0.06 a run once the tool listing is cached, $1.09 and ten minutes for the whole baseline.

**The baseline** (server model-facing identical to `52b24fa`):

| | |
|---|---|
| Completed | 30/30 |
| Kern tool calls | 61 (2 per run on average; composite tasks often take one `render_page` or `render_composition` call) |
| Error results | 2, both invalid input on `get_fieldset`, both retried successfully |
| Markup checks | 95/96 (the miss: one run replaced the `<img>` with an icon instead of adding `alt`) |
| **First request** | **70,676 input tokens**: the system prompt plus our tool listing. This is the number R5 is shrinking. |

What the transcripts show:
- **The standalone block tools are barely used.** Composite tasks go to `render_page` (6 calls) and `render_composition` (11). The six standalone block tools saw 5 calls, all `get_fieldset` with `field` blocks only. That's the evidence for option B.
- **A real API inconsistency.** Both errors: Haiku wrote a `field` block's select options as `{ value, text }`, which is `get_select`'s shape; `field` blocks want `{ value, label }`. For the English pass: accept both, or align the two.
- **Models describe long pages instead of pasting them.** For `render_page` results Haiku often summarized. The first scoring missed this (82/96); the checks now also read the HTML the tools returned.
- Most-used tools: `render_composition` 11, `get_button` 10, `get_badge` 10, `render_page` 6, `get_fieldset` 5.

### Option B, measured

Replacing the full block union in the six standalone block tools with:

| Variant | Six tools (now 90.6K) | Listing (now 201.3K) |
|---|---|---|
| V1a: `text`, `html`, `badge`, `field` | 32.4K | **143.2K** (−58.1K) |
| V1b: V1a plus `button` | 43.4K | 154.1K (−47.2K) |
| V2: per-tool sets (`get_section` with cards and grids, `get_grid` with cards, …), inlined | 64.0K | 174.7K; `get_section` grows to 24.4K |
| V2 with the leaf union shared through `$ref` inside each tool (estimate) | about 50.4K | about 161K |

Per-tool sets lose most of the saving, because each nested container carries its own leaf union. `button` alone is 1.8K, mostly German descriptions the English pass will shorten.

### B. Option B, done (roadmap box 3)

- [x] `3b896de`: V1a, as the maintainer chose. The six standalone block tools take `text`, `html`, `badge` and `field` blocks; a container block fails with a hint that names the tool and points at `render_composition`.
- [x] `c7bf5cc`: `npm run eval:compare -- <before> <after>` prints two eval reports side by side.
- [x] [r5-eval/option-b.json](r5-eval/option-b.json): the eval against option B. Its recorded server commit is `c7bf5cc`, which has the same server code as `3b896de`.

Learned in B:
- **The builders parse with their own schemas,** so narrowing a tool schema also narrows what its builder accepts, and a section block in `render_composition` would have failed at render time. Each block kind's builder now parses a wide render schema (with the nesting rules), and the tool schema derives from it with `safeExtend`/`extend`, which overrides only the blocks and keeps refinements and key order. `get_card_group` isn't a block kind, so it parses narrow.
- **Listing:** only the six tools changed; model-facing 201,295 → 143,097 characters, exactly the measured −58.2K. The budget ratchets to 144,000.

**Baseline against option B** (`npm run eval:compare -- baseline option-b`):

| | baseline | option B | change |
|---|---|---|---|
| Completed | 30 | 30 | |
| Checks passed | 95 | 95 | |
| **First request tokens** | **70,676** | **50,340** | **−20,336 (−29 %)** |
| Input tokens, all runs | 5.18M | 4.02M | −1.15M (−22 %) |
| Tool calls | 61 | 62 | +1 |
| Error results | 2 | 9 | +7, none in the six narrowed tools |
| Cost | $1.09 | $1.20 | +$0.11: the new listing is a new cache prefix, written once at about $0.12 a run until it's cached |

The seven extra errors are model variance meeting API problems that were there before:
- `get_accordion` (4): Haiku sent `items` without `mode: "group"`. The mode defaults to `single`, so the error only names the single mode's missing `title` and `content`. In the baseline Haiku happened to get it right.
- `render_composition` (1): a `disclosure` block given `content` (a string). The block requires `contentBlocks`, although the `get_disclosure` tool accepts `content`.
- `get_button` (2): guessed icon names, `arrow_forward` and `trash` (KERN has `arrow-forward` and `delete`).
- `get_fieldset` (2): the known `{ value, text }` option shape, as in the baseline.

**For the English areas (C, D)**, collected so far:
1. The `get_button` hint's stale size list (`default | small`; the schema also has `x-small`).
2. Three descriptions repeat payloads that are now in `TOOL_EXAMPLES`.
3. `field` options: accept `{ value, text }` as well as `{ value, label }`, or align them with `get_select`.
4. `get_accordion`: infer `mode: "group"` from `items` (a `normalize` step), or say so in the hint. `get_disclosure`'s description sends multi-item accordions to `get_accordion` without mentioning the mode.
5. The `disclosure` block: accept `content` like the tool, or name `contentBlocks` in the hint.
6. Icon names: suggest the closest valid names in the hint ("did you mean arrow-forward?") instead of only pointing at `list_icons`.

### C. English: areas 1 and 2 (roadmap boxes 5 and 6)

- [x] `db14199`: area 1, foundations and form fields. English for the shared parameters (`locale`, `strict`, heading level, grid columns, size, icon) and the 13 form-field tools. Findings 3 and 6 folded in: option keys `text` and `label` are accepted both ways, and an unknown icon name suggests the closest names. [r5-eval/english-1.json](r5-eval/english-1.json)
- [x] `e4f498c`: area 2, layout and typography. English for the 13 layout and typography tools, the four tools that return KERN's example HTML, `get_utility_reference`, `get_tokens` and `list_icons`. [r5-eval/english-2.json](r5-eval/english-2.json)

Learned in C:
- **Most of the saving was duplication, not translation.** Every component tool's input schema had a top-level `description` that repeated its tool description at more length. Dropping it, and keeping one short tool description, saved more than the shorter English did.
  - What a tool renders, and what it leaves out, went into that description: `get_heading` uses `kern-heading-medium` at every level, and `get_inputdate` is a native date field, not KERN's day/month/year fieldset.
  - Advice on when to use a component, such as select or radios, went out, as decided. It comes back from the bundle's summaries.
- **The listing:** 143,097 → 131,548 (area 1) → 129,939 (area 2). Area 2's tools were already small.
  - What's left to shrink: `render_composition` and `render_page` (31.6K together), the block tools, and the interactive tools.
  - German is still left in the simple-block union (`html` and `badge` blocks) inside `get_fieldset` and `get_grid`, which belongs to D.
- **`outputSchema` counts too, even off the budget.** Area 1's English for the shared `validation` field was longer than the German, which added 2.3K across 48 tools; area 2 shortened it. `npm run listing:sizes` prints the `outputSchema` total, so check it.
- **The eval:**
  - `npm run eval` defaults to 2 runs per scenario; the baseline and option B ran 3, so pass `--runs 3`. `english-1` ran with 2. A third attempt ran under its own label against the same build, and its transcripts were merged in as attempt 3 and re-scored with `--from-transcripts`.
  - Don't edit the working tree while the eval runs: it records the commit as `<sha>+dirty` when it finishes. For `english-1` the build predates the edits (`dist/` 13:59:54, first edit 14:01:01), so its `serverCommit` was set to `db14199` by hand.
- **The errors left are on interactive tools (area 3):**
  - `get_accordion` (one in `english-1`, two in `english-2`): `items` sent with `mode: "single"`, and then, in the retry, with no mode at all. The mode defaults to `single`, so the hint names `title` and `content`, and the model gives up and uses `render_composition`. That makes finding 4 the most frequent error now, so area 3 should do it first.
  - `get_button` got `trash` in `english-1`. The new hint said "Did you mean delete?" and the next call worked. That hint still lists the stale sizes (finding 1).
  - The `field` option errors from the baseline and option B are gone.
- **For later (rendered markup, R5.1 or a fix of its own):** the body, heading, label, link, lists, preline, subline, title and description-list templates interpolate text unescaped, and `get_link` does the same with `href`. R4 fixed this in the form templates only.

| | baseline | option B | english-1 | english-2 |
|---|---|---|---|---|
| Server | `52b24fa` | `c7bf5cc` | `db14199` | `e4f498c` |
| Listing (characters) | 201,295 | 143,097 | 131,548 | 129,939 |
| First request tokens | 70,676 | 50,340 | 43,591 | 42,535 |
| Completed | 30 | 30 | 30 | 30 |
| Checks passed (of 96) | 95 | 95 | 96 | 96 |
| Error results | 2 | 9 | 2 | 2 |
| Retries | 2 | 7 | 1 | 1 |
| Tool calls | 61 | 62 | 64 | 56 |
| Cost (USD) | 1.09 | 1.20 | 1.10 | 0.99 |

`english-2` against `english-1`: the same checks and errors, 8 fewer calls, and 1,056 fewer first-request tokens.

Pause for review here. Next: D (the interactive tools, then composition), starting with finding 4.
