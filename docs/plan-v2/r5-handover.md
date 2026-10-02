# R5 handover: part D under way (area 3 done, area 4 drafted)

**Update, later on 2026-10-02:** "Do first" items 1 and 2 are done (`d8e9261`, `f380392`, evals `english-4` and `nested-english-4`); results in [r5-kickoff.md](r5-kickoff.md#d-the-interactive-tools-and-composition-roadmap-boxes-7-and-8). The listing is 115,556 characters; the budget holds at 120,000 (`4730c88`). Item 3: the compact profile was dropped, and R5.1 starts from [r51-kickoff.md](r51-kickoff.md).

As of 2026-10-02, evening. Start a new session here. The plan, progress and lessons are in [r5-kickoff.md](r5-kickoff.md); this is the short version and what to do first. The previous handover (before group C) is in git history at `c1beb8a`.

## State

- **Branch:** `feat/v2-alpha`. The maintainer pushed up to `f521c2f`. Local commits on top, not pushed: `080fa68`, `419bba0`, `18165f5`, `a303ab0`, `890c10e` and the docs commit that adds this file.
- **Server:** 54 tools. Model-facing listing **119,225 characters**. The budget (`LISTING_BUDGET.modelFacing`) is 120,000, which is also the R5 target. About 7K of that target is meant for the bundle's summaries, so area 4 should bring the listing to about 113K. `outputSchema` (not counted) is 47,753.
- **Checks at `a303ab0`:** 1803 tests, coverage 97.0 / 91.3 / 98.1 / 97.0, Biome, both typechecks, build and e2e pass. The eval-harness tests (`--project tools`) pass at `890c10e`.
- **Pull before committing:** the maintainer pushes doc-only changes to this branch (`git fetch` and `git pull --rebase`).

## What landed this session

| Commit | What | Where to read |
|---|---|---|
| `bfb64f0` | Review of the first knowledge bundle. Decisions 6 (the generator owns the bundle schema; this repo owns a consumer contract) and 7 (derive `registry.json` from the bundle, don't merge) | [knowledge-bundle-review.md](knowledge-bundle-review.md), [knowledge-bundle.md](knowledge-bundle.md#10-decisions-2026-10-02) |
| `db14199`, `e4f498c`, `3fa134d` | R5 group C: English areas 1 and 2, with evals | [r5-kickoff.md](r5-kickoff.md#c-english-areas-1-and-2-roadmap-boxes-5-and-6) |
| `080fa68` | Fix: buttons take KERN 2.8's five sizes; `small` renders `kern-btn--small`, no longer `--x-small` (maintainer's choice) | [../migration-2.0.md](../migration-2.0.md) |
| `419bba0`, `18165f5`, `890c10e` | Nested eval scenarios (the proposal in [post-alpha-work.md](post-alpha-work.md) section 4) and the new measurements; the nested baseline | [r5-kickoff.md](r5-kickoff.md#d-the-interactive-tools-and-composition-roadmap-boxes-7-and-8) |
| `a303ab0` | R5 area 3: English for the interactive tools; findings 2 and 4 | the same |

## Do first

1. **Fix the alert's `body` description** (`packages/core/src/ux/schemas/alert.ts`). Area 3 cut it to "Optional content below the heading." In `english-3`, one run then looped: Haiku sent `body` as a plain sentence, 13 times as input that wasn't JSON and once as a string, before it got it right. Say that it's an object: `{ text, links, listItems }`.
2. **Area 4 (roadmap box 8):** composition schemas, `COMPOSITION_CHEAT_SHEET` and the error hints. A full draft exists as a Python script at `C:\Users\leoni\AppData\Local\Temp\claude\c--src-github-leonio-kern-ux-mcp\276806fa-bb0d-45de-a64c-e7cb43760977\scratchpad\area4\apply.py`. It has exact old and new strings, and it was written but never run. If that file is gone, the changes are:
   - **The content union** (`content-union.ts`):
     - English for `text`, `html`, the `paragraphs` shorthand, card `media`, `body` and `formFlow`.
     - No descriptions on the embedded button and badge.
     - The union's description becomes "One block; kind selects which"; the `contentBlocksSchema` description states the limits.
     - The depth and node messages become "Blocks nest at most 4 levels deep." and "At most 60 blocks in all." Two tests match the German depth message: `composition_tool.test.ts` and `templates/card.test.ts`.
   - **Schemas:** English for `section.ts`, `disclosure.ts` and `card-group.ts`. Drop the top-level `.describe()` on `SectionSchema`, `DisclosureSchema`, `CardGroupSchema` and `PageSchema`, and move "a composition helper of this repo" into the tool description.
   - **Tool descriptions** (`tools.ts`): `get_section`, `get_card_group`, `get_disclosure`, `render_composition` and `render_page` drop "(Komposition)", German text and payloads. `get_disclosure` points multi-item accordions at `get_accordion` with mode `group`.
   - **render_composition:** its input schema descriptions in English, and the refine message "Add at least one block."
   - **The cheat sheet:** the card line is aligned; the rules line says a disclosure takes `contentBlocks` or `content`; a new line states the limits.
   - **render_page's example** moves from its description into `TOOL_EXAMPLES` (golden-tested). The composition hint appends the tool's known-good payload when `TOOL_EXAMPLES` has one.
   - **Finding 5** (`invoke.ts`): rename `normalizeFieldBlocks` to `normalizeBlocks`. It also turns a disclosure block's `content` string into `contentBlocks: [{ kind: "text" | "html", … }]`.
   - Then: snapshots (`npx vitest run -u` on `tools.listing.test.ts` and `mcp/listing.test.ts`), the phrase tests, the budget ratchet, a migration-notes entry, and both evals.
3. **Then the end of R5:**
   - The compact profile question (roadmap Q3): the full set is now under 120K.
   - R5.1 (output polish), which now also includes escaping in the typography templates (see below).

## The evals

- Base suite: `npm run eval -- --label <name>`. Nested suite: add `--suite nested`. Runs default to 3 per scenario. Compare with `npm run eval:compare -- <a> <b>`; it shows "-" for measurements an older report lacks. Re-score saved transcripts with `--from-transcripts`.
- **Commit before running, build first (`npm run build`), and don't edit tracked files while it runs.** The eval records `<sha>+dirty` otherwise. Its own reports in `docs/plan-v2/r5-eval/` no longer count (`890c10e`).
- **New measurements** (`419bba0`), for every scenario:
  - how the answer delivered the HTML: verbatim, edited, described or none
  - hand-written KERN markup
  - strict-valid delivered HTML
  - calls, errors and retries on `render_composition` and `render_page`
  - the deepest nesting and largest block count used
  - structure checks (CSS selectors with `min` or `max`)
  - a new error class, `unparsable` (`890c10e`): input that wasn't JSON, which the client rejects before our server sees it

| | english-2 (`e4f498c`) | english-3 (`a303ab0`) | nested-baseline (`419bba0`) | nested-english-3 (`a303ab0`) |
|---|---|---|---|---|
| Completed | 30/30 | 30/30 | 12/12 | 12/12 |
| Checks | 96/96 | 96/96 | 103/105 | 105/105 |
| Error results | 2 | 15 (13 of them one run's unparsable loop on `get_alert`) | 0 | 0 |
| Strict-valid answers | 30/30 | 30/30 | 12/12 | 12/12 |
| Answers: verbatim / edited / described | 17 / 7 / 6 | 21 / 5 / 4 | 4 / 4 / 4 | 5 / 2 / 5 |
| Deepest nesting, most blocks | 3, 11 | 4, 10 | 4, 16 | 4, 18 |
| First request tokens | 42,535 | 38,179 | 42,836 | 38,491 |

`english-3.json` and `nested-english-3.json` are committed with this file. The commit recorded in `nested-english-3` was set to `a303ab0` by hand: it ran right after `english-3` had written its report, which the harness then counted as dirty.

## Open items and findings

- **R5 findings:**
  - 1 (button hint sizes), 2 (payloads in descriptions), 3 (option keys), 4 (accordion items) and 6 (icon names) are done.
  - 5 (disclosure `content` in blocks) is in the area 4 draft.
  - In the evals, `get_accordion` errors went from 2 to 0 after finding 4.
- **Unescaped text in rendered markup (R5.1 or a fix of its own):** body, heading, label, link, lists, preline, subline, title and description-list interpolate text unescaped, and `get_link` does the same with `href`.
- **Not conformant with KERN, for the K2 bundle work:** with `labelVisibility: "sr-only"`, `get_button` replaces `kern-label` with `kern-sr-only`. KERN's markup keeps both: `<span class="kern-label kern-sr-only">`.
- **Knowledge bundle:** waits on the generator for the English text, `tokens.json`, a canonical example per component and pinning to release tags ([knowledge-bundle-review.md](knowledge-bundle-review.md) section 2). K1a, the consumer contract and `knowledge:import`, can start now.
- **What the nested evals show:** Haiku builds depth-4 layouts without errors, and every delivered page is strict-valid. It often describes long results instead of pasting them (5 of 12 nested answers). That's the question post-alpha-work.md raises for R5.1.

## Environment notes

- **Escapes in shell scripts:** Git Bash heredocs mangle backslashes, and Python one-liners in heredocs break on `\s`. Write scripts that contain escapes to a file with the Write tool, and open files with `newline="\n"` in Python: text mode on Windows writes CRLF.
- **Area 3 is in the commits, not in a stash.** An old `stash@{0}` (area 3 work in progress) was popped and applied; `git stash list` may still show older stashes from `main`.
- Earlier notes still apply: [r4-handover.md](r4-handover.md#environment-notes-beyond-r3-handovermd).
