# Handover: R6 after groups A and B (2026-10-03)

Start here in a new session. The plan and its progress are in [r6-kickoff.md](r6-kickoff.md). The roadmap's remaining steps are in [roadmap.md](roadmap.md#closing-out-the-alpha). This file says where the work stands, what to do first, and what was learned.

## State

- **Branch:** `feat/v2-alpha`. Nothing is pushed since `d784040`.
- **Groups A and B are done:** A1–A4 (the bundle import, `registry.json` from it, the old generator retired) and B5–B8 (the docs tool, hint lines, icons, unknown classes).
- **Checks:**
  - 1,957 tests pass; coverage is 97.2 / 91.9 / 98.3 / 97.3.
  - Biome, both typechecks, the build and the e2e tests pass.
- **Sizes:**
  - the listing is 116,871 characters, against the 120K budget
  - the stdio bundle is 535 KB, up from 351 KB before R6: the registry now carries the bundle's text, icons and classes
- **Evals:**
  - After A (`r6-a`, `nested-r6-a`): base 96/96, nested 105/105.
  - After B (`r6-b`, `nested-r6-b`):
    - Base 95/96. The miss is one `fix-markup` run that replaced the coat-of-arms image with an icon (`get_icon`) instead of adding `alt`. That's Haiku's choice: the other two runs and all of A's passed.
    - Nested 105/105, with no error results (A had 3).
    - All 42 answers were strict-valid.
    - `class.unknown` showed up where the scenarios' markup uses the invented `kern-button`. No run called `get_component_docs`.

## What this session did

| Commit | What |
|---|---|
| `8a2f14b`, `98f0bc2` | The re-plan. R6 becomes the bundle import, the tool path, layout on CSS Grid, and resources. R7 has three prompts. "Release 2.0.0" takes R0's client check. "After 2.0.0" takes the `defineTool()` migration, tokens and utilities from the bundle, and K2/K5. |
| `745eaaf` A1 | Plain types for the bundle (`knowledge-bundle.ts`), the ID map (`knowledge-map.ts`), and the import checks (`knowledge-import.ts`). The packer owns its schemas and knows nothing about us (decision 6 revised): no exported contract. |
| `dff3d1c` A2 | `npm run knowledge:import`, and `knowledge/` checked in (bundle 0.2.0, 87 files) |
| `0dcf484` A3 | The old path retired: `tools/manifest`, the overlay, `registry:import`, `registry:schema`, `fast-glob`. Swapped with A4: the old generator imported the registry types. |
| `a72a4dd` A4 | `registry.json` generated from `knowledge/` (contract major 2, 48 components). The contributor docs and the component-update skill describe the import. |
| `46af2ab` | Group A recorded, with its evals |
| `7f1ac4b` B5 | `get_component_docs` from the bundle (`tool-builders/component-docs.ts`). It takes our IDs, KERN's (`input-text`) and other spellings. |
| `f0c9586` B6 | The `tool-hints` skill, and 18 one-line hints (`tool-hints.ts`), each with its source's `inputHash`. The import lists stale ones, and a test fails until they're handled. |
| `61c59eb` B7 | `list_icons` and the icon checks use the bundle's 42 icons (`icons.ts`). |
| `63dddab` B8 | `validate_html` warns on unknown `kern-*` classes (`class.unknown`, `kern-classes.ts`). `get_disclosure` renders KERN's accordion markup, and `formFlow` uses data attributes instead of invented classes. |

## Do first

1. Read [r6-kickoff.md](r6-kickoff.md): its decisions, group C's boxes, and "Where group B ended".
2. Start **C9**. The notes below are what I found while reading for it. One commit per box, and a pause for review after group C, with the evals.

## Notes for group C (layout on the CSS Grid utilities)

**Where the container grid is rendered:**
- `templates/grid.ts`, which serves both `get_grid` and the composition grid block: `kern-row`, `kern-col-md-{12/n} kern-col-sm-12`.
- `templates/card-group.ts`: the same, with `Math.floor(12 / columns)`, so 5 cards don't fill the row.
- `templates/page.ts`, `renderFooter`: link columns in `kern-row` / `kern-col-md-{span}`.
- `kern-container` stays: it's the page container, documented under the utilities' "Container", not the deprecated grid. It's used by `main`, the header, the footer, the Kopfzeile, and standalone grids.

**Where the 12-column rule lives:**
- `GridColumnsSchema` in `schemas/foundations.ts`: a union of 1, 2, 3, 4, 6 and 12. It's used by `schemas/grid.ts`, `schemas/card-group.ts` and the grid block in `schemas/content-union.ts`, where `columns` defaults to 2.
- The hint in `invoke.ts` around line 228 ("columns must be a divisor of 12…").
- The descriptions: `get_grid` in `tool-builders/layout.ts`, `get_card_group` in `tools.ts` (around line 314).
- The text of `utility-reference.ts`, where CSS grid is "the alternative to the 12-column grid".

**What KERN 2.8.2 offers** (in the v2.8.2 tag, `src/scss/core/layout/_grid.scss` and `_utilities.scss`):
- `kern-grid` itself, plus `kern-grid-cols-{1..12}` with `-sm`, `-md`, `-lg`, `-xl` and `-xxl` variants, `kern-col-{n}[-bp]`, `kern-col-start-*` and `kern-col-end-*`, and `kern-gap-*`.
- **`.kern-grid` defaults to 12 columns** (`repeat(12, minmax(0, 1fr))`), not to one. A story's comment says "Mobile: 1 Spalte (Standard)", but the SCSS disagrees. So equal columns that stack on small screens need `kern-grid kern-grid-cols-1 kern-grid-cols-{n}-md`. Check it in a browser (`samples/basic-layout`) before relying on it.
- The bundle's utilities text says: use `kern-gap` for spacing; don't mix `kern-row` with `kern-grid`.

**Decisions to make in C9:**
- **`get_grid`'s status.** Its registry entry is the deprecated container grid (`grid`), so its HTML carries the deprecation banner. Once it renders `kern-grid`, that status is wrong. One option: a code-owned override in `knowledge-map.ts` that maps `get_grid` to the utilities, so it gets no banner and its docs point at the CSS Grid text.
- **Whether `get_grid` keeps its name** and its `columns` / `columnsContent` interface. I'd keep both, and widen `columns` to 1–12.

**The R5.1 leftovers that go with C:**
- **C9:** infer `columns` from `columnsContent` when it's missing. Today, three arrays without `columns` render two and drop the third, with a warning.
- **C10:** the section error message should say to put the following blocks into `contentBlocks`.

**Tests and evals that name container-grid classes:**
- `composition_tool.test.ts` (around lines 49–56 and 234), `templates/grid.test.ts`, `templates/card-group.test.ts`, `templates/page.test.ts`.
- `tools/eval/scenarios.ts:88` expects `kern-col` (service-cards), and `scenarios.ts:124` checks `.kern-row .kern-card` (dashboard). Update both to `kern-grid`, in the same commit as the markup change.
- After C, the evals' "checks" change by construction. Compare with `r6-b` and read the transcripts rather than trusting the counts.

**Hints:** if `get_grid` changes meaning, check its line and the others that mention grids in `tool-hints.ts` (none do today). Re-run the `tool-hints` skill for `get_grid` and `get_card_group`.

## Open findings

- **`get_dropdown` and KERN disagree.** Our description says "Not a menu or a select". KERN's summary says "Collapsible menu that bundles actions or links". The tool notes in `tool-notes.ts` cover the dropdown; check whether they explain this, or whether the tool should change (after R6).
- **`get_pattern` fails validation** on KERN's own header story: an `<img>` without `alt`. Upstream markup, as before R6.
- **The fallback markup is on one line** until the packer keeps the stories' formatting. That's on the packer list in the kickoff, which also covers canonical examples, multi-line markup, per-criterion accessibility, enum defaults, `tokens.json`, `whenNotToUse`/`useInstead` and `similar[].difference`.
- **The listing has about 3.1K of headroom** under the 120K budget.

## Environment notes

- **Inline `node -e` scripts in Git Bash break on apostrophes** in the text ("don't", "KERN's"), and lose backslash escapes (`\s`). Use the Edit tool for prose and regexes, or write the script to a file first.
- **Python's text mode on Windows writes CRLF.** Open files with `newline="\n"`, or convert back with `sed -i 's/\r$//'`.
- **Scripts with top-level await** run as `.mts` files with `node --import tsx`. `npx tsx` takes about a minute to start on this machine.
- **Eval runs:**
  - Commit and build first.
  - While one runs, don't create or edit any file in the repo outside `docs/plan-v2/r5-eval/`. The harness records `+dirty` for untracked files too.
  - Both suites take about 20 minutes.
- **The import:**
  - `npm run knowledge:import -- ../kern-ux-scraper/bundle/final` takes in a new bundle.
  - Without a path, it regenerates `registry.json` after a change to `knowledge-map.ts`.
  - The packer is now named `kern-ux-knowledge-packer`, but the folder is still `kern-ux-scraper`.
