# Handover: R6 done (2026-10-05)

Start here in a new session. R6's plan, progress and findings are in [r6-kickoff.md](r6-kickoff.md). The roadmap's remaining steps are in [roadmap.md](roadmap.md#closing-out-the-alpha). This file says where the work stands, what to do first, and what was learned.

## State

- **Branch:** `feat/v2-alpha`. Nothing is pushed since `d784040`.
- **R6 is done:** the bundle import (A), the bundle on the tool path (B), layout on CSS Grid (C), and resources (D): 48 component cards and three guides.
- **Checks:**
  - 2,150 tests pass; coverage is 97.3 / 92.3 / 98.5 / 97.4.
  - Biome, both typechecks, the build and the e2e tests pass.
- **Sizes:**
  - the listing is 116,265 characters, against the 120K budget
  - the stdio bundle is 612 KB (351 KB before R6)
- **Evals after D** (`r6-d`, `nested-r6-d`): base 96/96 and 30/30 strict-valid; nested 99/105 and 12/12 strict-valid, the misses one prose answer. With and without resources (`r6-d-res-on`, `-off`): 14/21 both; the model reads a card only through a `resource_link`, never a guide on its own.

## What group D did

| Commit | What |
|---|---|
| `8401d9c` | The decision after C: an `html` block with a top-level `kern-grid` gets a `div` of its own. |
| `92012a1` | A known-good example for every component tool but `get_pattern`, in `TOOL_EXAMPLES`. |
| `7ca102d` | `validate_html`'s rules in one table, `VALIDATION_RULES` (from D14). |
| `7324594` D11 | `packages/core/src/resources`: the definition type, `registerKernResources`, and the `kern://components/{id}` cards. Examples render with stable IDs (`withStableIds`). |
| `44f4ac3` D12 | `get_component_docs` returns `card` and a `resource_link`. |
| `abe8f4a` D13 | `kern://guides/forms` and `kern://guides/layout`; the registry (2.1.0) carries `GUIDE_FOUNDATIONS`. |
| `1a2d175` D14 | `kern://guides/accessibility`. |
| `614bf94` D15 | The README, migration notes and codebase guide. |
| `d77be2f` D16 | The eval's `--resources` option and the `resources` suite. |

## Do first

1. **Test the two fixes made after R6, untested to save context:**
   - `be08fa7`: `required: true` renders `aria-required="true"` (input-text and its variants, textarea, select, input-file, and field blocks).
   - `d70ae86`: the docs-only note says not to invent `kern-*` classes and names the closest tools (`notificationbanner`: `get_alert`).

   Run `npm test`. Expect the listing snapshots (new `required` fields), the component-docs tests and the `tabs` card snapshot (the longer note) to fail. Check the listing budget (`npm run listing:sizes`), add tests for `required`, update the snapshots (`npx vitest run -u`) and read the diff. Then run `npm run eval -- --label r6-fix-res-off --suite resources` and compare it with `r6-d-res-off`: `form-required` should now mark `aria-required` when asked, and `notice-banner` should stop inventing classes.
2. **R7, prompts.** Read the roadmap's R7 section and its "R7 prompts" design, write `r7-kickoff.md` with the boxes, and check the plan with the user before the first commit. Each prompt can embed the guides and link the cards that D built.

## Open findings

- **From D:**
  - **`aria-required`** and **docs-only pointers:** fixed in `be08fa7` and `d70ae86`, untested (see "Do first").
  - **Claude Code shows a `resource_link` as a text line before the JSON text.** Anything that parses a result's first text block as JSON should take the structured content instead.
  - **The registry carries all of the utilities page** for the guides, though they quote a few sections. Trim it if the bundle size matters.
- **From earlier:**
  - **`get_dropdown` and KERN disagree.** Our description says "Not a menu or a select"; KERN's summary says "Collapsible menu that bundles actions or links".
  - **`get_pattern` fails validation** on KERN's own header story (an `<img>` without `alt`), so it has no example.
  - **Models try a `table` block kind** in compositions, then fall back to `get_table` and an `html` block.
  - **Upstream:** KERN's container stories use the undefined `kern-col-span-8`; the utilities docs claim a default gap the CSS doesn't set.
  - **The fallback markup is on one line** until the packer keeps the stories' formatting.
- **The listing has about 3.7K of headroom** under the 120K budget.

## Environment notes

- **Inline `node -e` scripts in Git Bash break on apostrophes** in the text ("don't", "KERN's"), and lose backslash escapes (`\s`). Use the Edit tool for prose and regexes, or write the script to a file first.
- **Python here-docs in Git Bash turn `\\n` into a real line break**, even with a quoted delimiter. Use the Edit tool for any string with an escape in it. Open files with `newline="\n"` so Python doesn't write CRLF.
- **Scripts with top-level await** run as `.mts` files with `node --import tsx`; import repo modules by `file:///C:/...` URL from outside the repo. `npx tsx` takes about a minute to start on this machine.
- **Browser checks:** Chrome is at `C:\Program Files\Google\Chrome\Application\chrome.exe`. `--headless=new --window-size=W,H --dump-dom <file-url>` runs a page whose inline script writes measurements into a `<pre>`; the narrowest window is 500 px. Get KERN's CSS with `npm pack @kern-ux/native@2.8.2` (its `dist/kern.min.css`), not the sample's copy.
- **Eval runs:**
  - Commit and build first.
  - While one runs, don't create or edit any file in the repo outside `docs/plan-v2/r5-eval/`. The harness records `+dirty` for untracked files too, so move new reports out of the repo before a re-run.
  - Base and nested take 20 to 30 minutes together; the resources suite about two minutes each way.
  - A lost connection or a sleeping machine leaves runs `FAILED` with `$0.000` and an empty or cut-off transcript, and no `.err` file. Repeat the run under a new label.
  - `--resources` gives the model Claude Code's `ListMcpResourcesTool` and `ReadMcpResourceTool`.
- **The import:**
  - `npm run knowledge:import -- ../kern-ux-scraper/bundle/final` takes in a new bundle.
  - Without a path, it regenerates `registry.json` after a change to `knowledge-map.ts`.
  - The packer is now named `kern-ux-knowledge-packer`, but the folder is still `kern-ux-scraper`.
