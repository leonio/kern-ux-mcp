# Handover: R6 after groups A, B and C (2026-10-05)

Start here in a new session. The plan and its progress are in [r6-kickoff.md](r6-kickoff.md). The roadmap's remaining steps are in [roadmap.md](roadmap.md#closing-out-the-alpha). This file says where the work stands, what to do first, and what was learned.

## State

- **Branch:** `feat/v2-alpha`. Nothing is pushed since `d784040`.
- **Groups A, B and C are done.** C moved every layout of ours to KERN's CSS Grid utilities; see "Where group C ended" in the kickoff.
- **Checks:**
  - 1,979 tests pass; coverage is 97.3 / 92.1 / 98.4 / 97.3.
  - Biome, both typechecks, the build and the e2e tests pass.
- **Sizes:**
  - the listing is 116,265 characters, against the 120K budget
  - the stdio bundle is 532 KB
- **Evals after C** (`r6-c2`, `nested-r6-c2`): base 96/96 and 29/30 strict-valid, nested 99/105 and 12/12 strict-valid. The misses are model delivery, not layout; the kickoff has the details.

## What group C did

| Commit | What |
|---|---|
| `b0cd9dd` C9 | `get_grid` and grid blocks on `kern-grid kern-grid-cols-1 kern-grid-cols-{n}-md kern-gap-lg`, in a `div` of their own; 1 to 12 columns, the count from `columnsContent`. `get_grid`'s registry entry is the utilities' CSS Grid sections (`TOOLS_FROM_SECTIONS` in `knowledge-map.ts`), so it's stable with no banner. The utility reference lists `kern-col-{n}` instead of the undefined `kern-col-span-{n}`. |
| `ae5076a` C10 | Card groups (the cards are the grid items, so a row shares one height) and the page footer on the same classes, through `equalColumnsGridClasses()` in `templates/grid.ts`. The section error message says where the blocks go. The migration notes have "Layout on CSS Grid". |
| `ff80158` | The grid descriptions spell out the full classes: the first eval run copied the shorthand into hand-written markup. |
| `d264223` | `validate_html` warns on `layout.grid_in_container` and `layout.grid_columns_small`. |

## Do first

1. Read the kickoff's group D boxes (D11 to D16) and start **D11**. One commit per box, and a pause for review after group D, with the evals (D16).

## Notes for group D

- **D13's layout guide** has its code facts in "Where group C ended": the grid's own `div`, `kern-grid-cols-1`, and the explicit gap. The bundle's side is `layout-overview`, `layout` and `sizes-and-spacing`, plus the utilities' CSS Grid sections that `get_grid`'s entry already uses.
- **D14's rule table** gets the two `layout.*` rules and `class.unknown` along with the older ones.

## Open findings

- **`get_dropdown` and KERN disagree.** Our description says "Not a menu or a select". KERN's summary says "Collapsible menu that bundles actions or links". Check whether the notes in `tool-notes.ts` explain it, or whether the tool should change (after R6).
- **`get_pattern` fails validation** on KERN's own header story: an `<img>` without `alt`. Upstream markup.
- **Models try a `table` block kind** in compositions (one `dashboard` run), then fall back to `get_table` and an `html` block.
- **Upstream:** KERN's container stories use `kern-col-span-8`, which the CSS doesn't define, so `class.unknown` accepts it. The utilities docs say `.kern-grid` has `gap-lg`; the CSS sets no gap.
- **The fallback markup is on one line** until the packer keeps the stories' formatting. That's on the packer list in the kickoff.
- **The listing has about 3.7K of headroom** under the 120K budget.

## Environment notes

- **Inline `node -e` scripts in Git Bash break on apostrophes** in the text ("don't", "KERN's"), and lose backslash escapes (`\s`). Use the Edit tool for prose and regexes, or write the script to a file first.
- **Python's text mode on Windows writes CRLF.** Open files with `newline="\n"`. In a Python replacement, a `\n` inside a JS string literal must be `\\n` or the edit lands a real line break.
- **Scripts with top-level await** run as `.mts` files with `node --import tsx`; import repo modules by `file:///C:/...` URL from outside the repo. `npx tsx` takes about a minute to start on this machine.
- **Browser checks:** Chrome is at `C:\Program Files\Google\Chrome\Application\chrome.exe`. `--headless=new --window-size=W,H --dump-dom <file-url>` runs a page whose inline script writes measurements into a `<pre>`; the narrowest window is 500 px. Get KERN's CSS with `npm pack @kern-ux/native@2.8.2` (its `dist/kern.min.css`), not the sample's copy.
- **Eval runs:**
  - Commit and build first.
  - While one runs, don't create or edit any file in the repo outside `docs/plan-v2/r5-eval/`. The harness records `+dirty` for untracked files too, so move new reports out of the repo before a re-run.
  - Both suites take 20 to 30 minutes.
  - A lost connection or a sleeping machine leaves runs `FAILED` with `$0.000` and an empty or cut-off transcript, and no `.err` file. Repeat the run under a new label.
- **The import:**
  - `npm run knowledge:import -- ../kern-ux-scraper/bundle/final` takes in a new bundle.
  - Without a path, it regenerates `registry.json` after a change to `knowledge-map.ts`.
  - The packer is now named `kern-ux-knowledge-packer`, but the folder is still `kern-ux-scraper`.
