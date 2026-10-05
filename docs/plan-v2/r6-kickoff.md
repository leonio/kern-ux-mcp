# Kickoff: roadmap step R6 (the knowledge bundle, layout and resources)

## Your task

Do **R6** from [roadmap.md](roadmap.md#r6-the-knowledge-bundle-layout-and-resources). It's the last big step before R7 (prompts) and the 2.0.0 release ([roadmap.md](roadmap.md#closing-out-the-alpha)). Four groups:

- **A. Import the bundle** into `knowledge/` and generate `registry.json` from it, then retire the in-repo generator.
- **B. Put the bundle on the tool path:** the docs tool, hints in the descriptions that need one, icons, unknown classes. This works in every client without anyone attaching a resource.
- **C. Move our layout to KERN's CSS Grid utilities.** The container grid is deprecated upstream, and 2.0 is the release where markup may change.
- **D. Resources where something uses them:** the component cards and three guides.

One commit per box, a pause for review after each group, and an eval run after A, B, C and D.

## Decisions

From 2026-10-02:

- **KERN knowledge comes only from the bundle**, built by the packer (`kern-ux-knowledge-packer`, in the `kern-ux-scraper` folder), including the docs' German text translated into English ([knowledge-bundle.md](knowledge-bundle.md#10-decisions-2026-10-02), decision 8).
- **Facts about our own tools come from code.**
- **No `/schema` resources.**

From 2026-10-03:

1. **One-way.** The packer publishes the bundle with its schema, and we only read. The packer knows nothing about this repo: no exported contract, no validation of anything of ours (this replaces decision 6).
   - This repo has plain TypeScript types for the fields it reads.
   - It has the checks only we can make: our tools' components exist, the picked examples exist, the major version is one we read.
   - It can check a bundle against the packer's schema that ships inside it.
2. **One command, two files.** `npm run knowledge:import` is a plain script, with no AI in it.
   - It copies the bundle into `knowledge/` (checked in, never shipped).
   - It generates `registry.json` from it (internal, and the only data file the server reads). Generating it there folds K1b into the import.
3. **Text is selected, not rewritten.**
   - The docs tool and the cards use the bundle's text as it is; it's already short.
   - Tool descriptions get a line only where it changes a choice. A skill writes those lines, because the best ones name our tools.
   - Anything this repo derives from bundle text records the bundle's `inputHash`, so a re-import flags it when its source changes.
4. **Canonical HTML** is returned only by the four fallback tools (`details`, `search`, `layers`, `pattern`), picked in code by example ID. A selection rule picks deprecated variants, the web-component Kopfzeile and the search field without a label. `get_component_docs` names the tool for the components that have their own template.
5. **Tokens are carried over** from today's `registry.json` (466 custom property names) until the bundle has `foundations/tokens.json`.
6. **Resources only where something uses them:**
   - **Built:** the component cards, and the forms, layout and accessibility guides.
   - **Dropped:** `kern://components`, `kern://icons`, `kern://utilities`, `kern://tokens`, `kern://templates/page-shell` and the composition guide. Each duplicates a tool or the cheat sheet.
7. **Layout moves to the CSS Grid utilities in 2.0.**
   - **Upstream:** the container grid is deprecated (the Storybook title is "Layout/Container Grid (Deprecate)"). The bundle's utilities and layout texts say `kern-grid` replaces `kern-row` and is preferred for new layouts.
   - **Available:** `kern-grid`, `kern-grid-cols-{n}[-{breakpoint}]` and `kern-col-{n}[-{breakpoint}]` are in the 2.8.2 release.
   - **Why now:** 2.0 is the release where our markup may change. Afterwards it would be another major.
   - **Bonus:** it removes the "columns must divide 12" rule.
8. **Parked:** the listing budget (the tests will catch it) and source pinning. The library is mature; the four commits past the v2.8.2 tag are small fixes.

## Where things stand

- **Branch:** `feat/v2-alpha`, R5 and R5.1 done.
  - 54 tools; the listing is 115,556 characters against a 120K budget.
  - 1,824 tests pass (2026-10-03).
- **SDK v2.1** has what the resources need:
  - `registerResource` with a per-resource `cacheHint`
  - `ResourceTemplate` with `list` and `complete`
  - `ResourceNotFoundError` (`-32602` with `data: { uri }`)

  The list cache hints are already set in `create-server.ts`.
- **The bundle** (0.2.0, 2026-10-03; all files validate against the packer's schema):
  - 46 components (five of them docs-only), 21 foundations docs pages, icons (42), classes (2,678), utilities, 3 stub patterns and `report.json`.
  - English text: 929 items reviewed, none stale or missing.
    - **Filled:** every component's summary, docs summary and section summaries; `whenToUse` (37 components), `dos` (39), `donts` (40), `similar` (35, IDs only).
    - **Still empty:** `whenNotToUse`, `similar[].difference`, option and state text, accessibility `obligation`.
  - **Uses KERN's IDs** (`input-text`, `checkboxes`, `radios`, `list`). Ours are `inputtext`, `checkbox`, `radio`, `lists`.
  - **Upstream changes the import brings:**
    - 19 titles change ("Input Checkboxes", "Input E-Mail").
    - `grid` becomes deprecated and `list` experimental.
    - `index` goes.
    - `pattern`'s example loses its inline toggle script: the bundle drops scripts from example markup.
- **Today's `registry.json`** (made by `tools/manifest/`):
  - 15 of 44 components have a German excerpt.
  - 37 carry story markup.
  - The tokens are 466 custom property names, grouped by regex. `get_tokens` hasn't been called in any eval run.
- **The container grid** is rendered by `get_grid`, `get_card_group`, the composition renderer's grid block, and the page shell's layout.

## Plan

### A. Import the bundle and generate `registry.json`

1. **Bundle types, the ID map and the import checks.**
   - Plain TypeScript types for the fields we read: `index.json`, components, `*.examples.json`, foundations pages, `icons.json`, the utilities examples, patterns.
   - **The ID map:**
     - Our ID is the KERN ID without hyphens, except `checkboxes`, `radios` and `list`, which map to `checkbox`, `radio` and `lists`.
     - `layers` comes from the utilities example `stack`, and `pattern` from `patterns/header`.
     - The four fallback picks are in it.
   - **The checks, as pure functions with tests:**
     - The major version is one we read.
     - Every component tool resolves.
     - The picked examples exist.
     - No two KERN IDs map to the same ID of ours.
2. **`npm run knowledge:import -- <bundle-dir> [--dry-run]`.**
   - Check every file against the packer's schema from the bundle (ajv), then run our checks.
   - Print the diff by document and section (ignoring `generatedAt`), plus the report's text state and drift count.
   - Replace `knowledge/` (repo root, excluded from Biome, not in any package). A test runs our checks on the checked-in copy.
   - The first import is the 2026-10-03 bundle.
3. **`registry.json` from `knowledge/`.**
   - The registry contract becomes internal (major 2).
     - **Dropped:** `category`, `strategy`, `reviewedGuidance`, `warnings`.
     - **Added:** `kernId`, `group`, synonyms, links, the English knowledge and docs digest, accessibility per criterion (the strictest status), `docs-only`, and the bundle's pins in `upstream`.
   - `htmlCanonical` is kept only for the four fallback tools. Tokens are carried over.
   - `get_component_docs` keeps its output shape for now, filled from the new fields.
   - The import writes the file, and a test checks that it equals the projection of `knowledge/`.
   - Review the parity diff in the snapshots, then run the eval.
4. **Retire the old path:**
   - `registry:import`, `tools/registry/`
   - `tools/manifest/*`, the overlay files, `validate-guidance-overlay`, `generate-manifest` (and its use in `loop:*`)
   - `docs/registry.schema.json` and its test
   - `fast-glob`

   Update the two skills that point at the old path.

### B. The bundle on the tool path

5. **`get_component_docs` from the bundle.**
   - It returns the summary, when to use, do's and don'ts, similar components (with our tool where one exists), the WCAG criteria and the kern-ux.de links.
   - It accepts KERN IDs (`input-text`).
   - A docs-only component says it has no implementation in KERN 2.8.2.
   - Our tool notes stay.
   - New output schema, snapshots, and an update to the tool-description-quality skill's ID section.
6. **Hint lines in tool descriptions.**
   - **The skill** (`.github/skills/tool-hints/`) adds a line only where one of these holds:
     - the name doesn't say what the component is
     - a look-alike exists
     - the status matters

     Per tool, it reads the bundle document and our description, then writes one line of 80 characters or less, or records "not needed".
   - **The lines** live in a code table with the bundle's `inputHash`, and `knowledge:import` lists the stale ones.
   - The eval runs before and after.
7. **`list_icons` from the bundle.** `VALID_ICON_NAMES` gives way to `foundations/icons.json` through `registry.json`: 42 names, three more than today.
8. **`validate_html` warns on unknown `kern-*` classes.**
   - The classes come from `foundations/classes.json`, kept compact in `registry.json`: base names, with breakpoint suffixes checked by rule.
   - It's a warning, not a strict failure.
   - It catches the classes models invent (`kern-bg-*`, `kern-tabs`).

### C. Layout on the CSS Grid utilities

9. **`get_grid` and the composition grid block on `kern-grid`.**
   - The markup becomes `kern-grid kern-grid-cols-{n}-md` (one column on small screens), with any `n` from 1 to 12.
   - The "divides 12" validation and its hints go.
   - The column count follows `columnsContent` when `columns` is missing. Today, three arrays without `columns` render two columns and drop the third.
   - The tool's description and the cheat sheet change to match.
10. **`get_card_group`, sections and the page shell** move to `kern-grid`. `kern-container` stays, because it's the page container, not the deprecated grid.
    - The R5.1 leftover goes with it: the section error message says to put the following blocks into `contentBlocks`.
    - A migration-notes entry covers the markup change.

### D. Resources and guides

11. **Registration, cache hints, the test harness and the component cards.**
    - A resource definition type and a catalog built once.
    - `registerKernResources(server)`: capability `resources: {}`, with a `cacheHint` of an hour and `public`.
    - Tests on both protocol eras:
      - list, templates list, read
      - an unknown URI (`-32602` with `data.uri`)
      - the cache fields
    - Content snapshots, a size budget per resource, and `validateHtmlStrict` on every HTML block.
    - **The first resource is `kern://components/{id}`** (Markdown), listed and completed.
      - **From the bundle:** title, status, synonyms, summary, when to use, do's and don'ts, similar components, WCAG criteria, links.
      - **From code:** the tool, its field digest, our rendered examples, the validation rules that apply, our tool notes.
      - Empty sections are left out.
12. **`resource_link`s from `get_component_docs`** to the component's card.
13. **The forms and layout guides.**
    - `kern://guides/forms`:
      - **From code:** label, hint and error, ids, optional marking, the error summary with group errors.
      - **From the bundle:** `form-inputs-overview`'s general input rules.
    - `kern://guides/layout`:
      - **From the bundle:** `layout-overview`'s "what to use when", breakpoints and spacing from `layout` and `sizes-and-spacing`.
      - **From code:** how our tools lay things out on `kern-grid`.
14. **The rule table and `kern://guides/accessibility`.**
    - The validator's rules move into one table that both `validate.ts` and the guide read.
    - The guide lists each rule with how to satisfy it, next to the bundle's accessibility foundation and the WCAG criteria per component.
15. **Docs:** "Resources" and "Layout on CSS Grid" in the migration notes, the README's feature list, `codebase-guide.md`.
16. **The eval with resources.**
    - An option in the harness allows Claude Code's MCP resource tools.
    - Scenarios where a card or guide helps: a form with an error summary, and a component the model doesn't know well.
    - Compare with and without on the same commit.

## Evals

Run the base and nested suites after A (titles and status banners), after B (the docs tool and hints), after C (new layout markup) and in D16. Compare against `r51-b` and `nested-r51-b`. The checks are substring checks: a change in a check means a transcript to read, and C will need its layout checks updated from `kern-row` to `kern-grid`.

## Where group A ended

- **Evals** against `r51-b` and `nested-r51-b`:
  - base 96/96 checks, as before, 30/30 strict-valid
  - nested 105/105, up from 103/105
  - No run called a tool A changed (`get_component_docs`, `get_grid`, `get_lists`). The extra calls (`get_button`, `get_badge`, `render_page`) are run-to-run variance.
- **`get_grid`'s deprecation banner** sends the model to `get_component_docs` for migration guidance, which the grid's docs don't have. Group C settles it: once `get_grid` renders `kern-grid`, its status shouldn't come from the deprecated container grid.
- **`get_pattern` fails validation, as it did before:** KERN's header story has an `<img>` without `alt`. It's upstream markup.
- **The fallback markup is on one line** until the packer keeps the stories' formatting.
- **The stdio bundle** grew from 351 KB to 494 KB with the richer registry.

## Where group B ended

- **Evals** against `r6-a` and `nested-r6-a`:
  - **Base 95/96.** One `fix-markup` run replaced the image with an icon instead of adding `alt`. That's Haiku's choice; the other runs passed.
  - **Nested 105/105**, with no error results (A had 3).
  - **All 42 answers strict-valid.**
  - **`class.unknown`** appeared where the scenarios use the invented `kern-button`.
  - **No run called `get_component_docs`.** Its value shows when a model is unsure, which these scenarios rarely make it.
- **Group C starts from [r6-handover.md](r6-handover.md)**, which has the notes from reading for C9. They cover where the container grid is rendered, `.kern-grid`'s 12-column default, `get_grid`'s status, and the eval checks to update.

## Where group C ended

- **The markup**, checked in headless Chrome against the published 2.8.2 CSS at phone and desktop widths:
  - Every grid of ours is `kern-grid kern-grid-cols-1 kern-grid-cols-{n}-md kern-gap-lg`, in a `div` of its own.
  - **The `div` matters.** 2.8.2 has `.kern-container:has(> .kern-grid) { padding: 0 }`. A grid right inside `render_page`'s `<main>` would take main's padding away, and with it the inset of the `h1` and every block.
  - **`kern-grid` sets no gap.** The line is commented out in `_utilities.scss`, although the docs text says `gap-lg`. Hence `kern-gap-lg`.
  - **`kern-grid` has 12 columns** until a `kern-grid-cols-*` class applies. The story that says "Mobile: 1 Spalte (Standard)" gives 12 columns of 29 px on a phone.
  - **Check against the npm package's `dist/kern.min.css`**, not `samples/basic-layout/assets/kern.min.css`. The sample's copy is older than 2.8.2: its rule is `:has(.kern-grid)`, at any depth.
- **`get_grid`'s entry** is the utilities page's CSS Grid sections, checked at import: "CSS Grid", stable, no banner. KERN's container grid left the registry. The tool-hints rule needs no line for `get_grid`.
- **The first eval run** (`r6-c`) found a model copying the descriptions' shorthand, `kern-grid kern-grid-cols-3-md`, into a hand-written `html` block right inside `<main>`: no padding, and 12 columns on a phone. Hence `ff80158` and `d264223`.
- **Evals** against `r6-b` and `nested-r6-b`:
  - **Base 96/96** (`r6-b`: 95/96), 30/30 completed, 29/30 strict-valid. The one invalid answer has `aria-hidden="true\"`, a typo from the model's own edit.
  - **Every grid our tools rendered** has the new classes (`get_card_group`, `render_composition`, `render_page`). `service-cards` and `dashboard` pass their updated checks in every run.
  - **One `landing-page` run** still hand-wrote a grid of cards in an `html` block right inside `<main>`, now with the full classes. `render_page` returned `layout.grid_in_container`, and Haiku delivered the page anyway.
  - **Nested 99/105** (`nested-r6-b`: 105/105), 12/12 strict-valid. All six misses are one `application-flow` answer that summarised the form in prose and kept a fragment of the HTML; the tool's output had the structure. One `dashboard` run tried a `table` block kind, then used `get_table`.
- **The listing** is 116,265 characters, down from 116,871. The stdio bundle is 532 KB.
- **Settled 2026-10-05:** an `html` block with a top-level `kern-grid` gets a plain `div` of its own, wherever it's rendered. The warning alone didn't stop Haiku.
- **Upstream findings:**
  - KERN's container stories use `kern-col-span-8`, which the CSS doesn't define. An example uses it, so `class.unknown` accepts it. Our utility reference copied it until C9.
  - The utilities docs say `.kern-grid` has `gap-lg` by default; the CSS sets no gap.

## Where group D ended

- **Resources:** 48 component cards (`kern://components/{id}`) and three guides (`kern://guides/{name}`: forms, layout, accessibility), registered as two templates with listing, completion, an hour's public cache hint and `-32602` with `data.uri` for unknown URIs, on both protocol eras.
- **Order changed:** D14's rule table came first, in D11 (`7ca102d`), because the cards list the rules that apply. D14 kept the guide.
- **Two things the cards needed:**
  - **Examples:** `TOOL_EXAMPLES` had 10 of 43 component tools; now every one has an example, except `get_pattern` (KERN's header story fails strict validation).
  - **Stable IDs:** generated IDs were random, so a card's bytes differed between processes. Cards and guides render inside `withStableIds` (`AsyncLocalStorage`); tool calls keep random IDs.
- **The field digest** is a Markdown table, not the roadmap's YAML: the card is Markdown, and YAML needed a new dependency.
- **The registry** (contract 2.1.0) carries six foundations pages for the guides (`GUIDE_FOUNDATIONS`), about 39 KB. The stdio bundle is 612 KB, up from 532 KB after C. Much of the utilities page is unused; the projection could keep only quoted sections.
- **The resource eval** (`r6-d-res-off`, `r6-d-res-on`, same commit, 3 runs per scenario):
  - Both 14/21. With the resource tools, Haiku never listed resources and never read a guide. It read a card only by following `get_component_docs`'s `resource_link` (2 of 3 `notice-banner` runs).
  - **`form-required`** missed `aria-required` in all six runs: our field tools don't set it, and nothing links to the forms guide that says so.
  - **`notice-banner`** invented `kern-notification-banner` in 4 of 6 runs, with and without the card. The bundle has nothing for the docs-only Notification Banner beyond "KERN doesn't implement it", so neither the docs tool nor the card names an alternative. The scenario's comment claimed the card points to the alert; it doesn't.
  - So resources reach a model through links from tools, or when a person attaches them. They don't replace guidance on the tool path.
- **Evals** against `r6-c2` and `nested-r6-c2`:
  - **Base 96/96**, 30/30 completed and strict-valid, no error results (`r6-c2`: 29/30 strict-valid, 1 error).
  - **Nested 99/105**, 12/12 strict-valid, as in `nested-r6-c2`. Again all six misses are one `application-flow` answer that summarised the form in prose; the tool's output had the structure. Two invalid-input errors, both retried: an empty text block, and a section without content, which got C10's new message.

### Findings for after R6

- **`aria-required`:** done in `be08fa7`, see below.
- **Docs-only components need a pointer:** done in `d70ae86`, see below.
- **Claude Code shows a `resource_link` as a text line** before the JSON (`[Resource link: notificationbanner] kern://components/notificationbanner`). Clients that parse the first content block as JSON should take the last text block, or the structured content.

## After R6: the two fixes from D

- **`required: true`** (`be08fa7`) adds `aria-required="true"` to the control: `get_inputtext` and its six variants, `get_textarea`, `get_select`, `get_inputfile`, and text-like, textarea and select field blocks. No visible marker and no native `required`, as KERN's form rules ask. A radio or checkbox field block warns that it ignores `required` (`07b55e5`); the radio and checkbox tools don't take it.
- **Docs-only notes** (`d70ae86`) say not to invent `kern-*` classes and name the closest tools from `RELATED_TOOLS`: Notification Banner `get_alert`, Header `render_page` and `get_pattern`, Nav `render_page`. The card shows the same note.
- **Tests** (`b0fd99f`): 2,173 pass; coverage 97.3 / 92.4 / 98.5 / 97.4.
- **The listing** is 118,941 characters, up from 116,265: the `required` field in 10 tools and the field block in 8. About 1,060 characters are left under the 120K budget.
- **The resource eval** (`r6-fix-res-off`, against `r6-d-res-off`): 19/21, up from 14/21.
  - **`form-required`:** 15/15, up from 12/15. All three runs set `required` on the composition's field blocks.
  - **`notice-banner`:** 4/6, up from 2/6. Two runs called `get_alert` after reading the note. One read the note naming `get_alert` and still hand-wrote `kern-notification-banner` markup, "based on the KERN design system", offering the alert only as a fallback. The note opens with "KERN documents Notification Banner", which Haiku took as permission. Leading with the action ("Use get_alert …") might hold better.
- **Flaky under coverage:** `server.test.ts`'s per-request timing test failed once at 5.10 ms against its 5 ms limit with coverage on, and passed on the re-run and without coverage.

## Asks for the packer (none blocks R6)

- a canonical example marker (one `canonical:` line per component in `components.yaml`)
- multi-line example markup
- one accessibility entry per criterion, with obligations
- defaults for `alert.tone`, `badge.tone`, `button.type`, `heading.size` and `icon.name`
- `foundations/tokens.json`: the `--kern-*` custom properties, grouped by the docs' token levels
- `whenNotToUse` with `useInstead`, and `similar[].difference`
- English section headings and pattern titles
- in `index.json`, the licence note, which still says no docs prose is included
- in its schema, the description, which still says this repo's schema will replace it

## Progress

- [x] A1 `745eaaf`: bundle types, the ID map and the import checks. The 2026-10-03 bundle passes them all.
- [x] A2 `dff3d1c`: `knowledge:import` and the checked-in `knowledge/` (bundle 0.2.0, 87 files, 1.8 MB). A rerun shows "No changes."
- [x] A3 `0dcf484`: the old registry path retired. A3 and A4 swapped places: the old generator imported the registry types, so it had to go before the contract changed.
- [x] A4 `a72a4dd`: `registry.json` from `knowledge/` (contract major 2, 48 components), with the contributor docs and the component-update skill describing the import.
- [x] Evals after A: [r5-eval/r6-a.json](r5-eval/r6-a.json), [r5-eval/nested-r6-a.json](r5-eval/nested-r6-a.json)
- [x] B5 `7f1ac4b`: `get_component_docs` from the bundle, in `tool-builders/component-docs.ts`. It takes our IDs, KERN's and other spellings.
- [x] B6 `f0c9586`: the `tool-hints` skill and 18 description lines (`tool-hints.ts`), each with its source's `inputHash`. The listing is 116,871 characters.
- [x] B7 `61c59eb`: `list_icons` and the icon checks use the bundle's 42 icons (`icons.ts`).
- [x] B8 `63dddab`: `validate_html` warns on unknown `kern-*` classes (`kern-classes.ts`). Fixing our own invented classes changed `get_disclosure` (KERN's accordion markup) and `formFlow` (data attributes).
- [x] Evals after B: [r5-eval/r6-b.json](r5-eval/r6-b.json), [r5-eval/nested-r6-b.json](r5-eval/nested-r6-b.json)
- [x] C9 `b0cd9dd`: `get_grid` and the grid block on `kern-grid`, 1 to 12 columns, the count from `columnsContent`. `get_grid`'s entry is the utilities' CSS Grid sections (`TOOLS_FROM_SECTIONS`): stable, no banner.
- [x] C10 `ae5076a`: card groups and the page footer on `kern-grid`, the section error message, the migration notes. Sections needed no change: none rendered the container grid.
- [x] From the first eval run: `ff80158` spells out the full classes in the grid descriptions; `d264223` adds the `layout.grid_in_container` and `layout.grid_columns_small` warnings.
- [x] Evals after C: [r5-eval/r6-c2.json](r5-eval/r6-c2.json), [r5-eval/nested-r6-c2.json](r5-eval/nested-r6-c2.json). The first run, [r6-c](r5-eval/r6-c.json) and [nested-r6-c](r5-eval/nested-r6-c.json), lost six runs to a lost connection.
- [x] `8401d9c`, the decision after C: an `html` block with a top-level `kern-grid` gets a `div` of its own.
- [x] D11 `7324594`: registration, cache hints, the test harness and the 48 component cards. Before it, `92012a1` gave every component tool an example and `7ca102d` moved the rule table forward from D14.
- [x] D12 `44f4ac3`: `get_component_docs` returns a `card` field and a `resource_link`.
- [x] D13 `abe8f4a`: the forms and layout guides; the registry (2.1.0) carries the foundations pages they quote.
- [x] D14 `1a2d175`: the accessibility guide.
- [x] D15 `614bf94`: the README, migration notes and codebase guide.
- [x] D16 `d77be2f`: `--resources` and the resources suite. Evals: [r6-d](r5-eval/r6-d.json), [nested-r6-d](r5-eval/nested-r6-d.json), [r6-d-res-off](r5-eval/r6-d-res-off.json), [r6-d-res-on](r5-eval/r6-d-res-on.json).
- [x] After R6: `be08fa7` `required` renders `aria-required`, `d70ae86` docs-only notes name the closest tools; tested in `07b55e5` and `b0fd99f`. Eval: [r6-fix-res-off](r5-eval/r6-fix-res-off.json).
