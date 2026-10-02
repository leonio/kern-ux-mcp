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
