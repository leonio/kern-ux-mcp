# Kickoff: roadmap step R6 (resources)

## Your task

Do **R6** from [roadmap.md](roadmap.md#r6-resources-packagescoresrcresources): MCP resources where something uses them, served next to the tools. Before the resources, two groups prepare the ground:
- **Group A** imports the knowledge bundle and generates `registry.json` from it (K1a and K1b).
- **Group B** puts the bundle's English text on the tool path, which works in every client without anyone attaching a resource.

The spec points that shape the resources are in the roadmap's R6 section ("Protocol 2026-07-28"). One commit per box, and a pause for review after each group.

## Decisions

From 2026-10-02:

- **KERN knowledge comes only from the bundle.** The packer (`kern-ux-knowledge-packer`, in the `kern-ux-scraper` folder) builds everything, including the kern-ux.de docs' German text translated into English ([knowledge-bundle.md](knowledge-bundle.md#10-decisions-2026-10-02), decision 8). This repo consumes it as static JSON.
- **Facts about our own tools come from code:** fields from the Zod schemas, rendered examples, validation rules, composition rules, tool notes, the page shell.
- **No `/schema` resources.** Every input schema already reaches the model in `tools/list`.

Added on 2026-10-03, after reviewing the bundle in `bundle/final`:

1. **Two files, one command.** `npm run knowledge:import` copies the bundle into `knowledge/` and generates `registry.json` from it. That folds K1b into the import.
   - `knowledge/` is checked in and never shipped. It's the only versioned copy of the bundle, since `bundle/final` is git-ignored in the packer.
   - `registry.json` is generated and internal. It's the only data file the server reads, it holds only what the server serves, and nobody edits it.
   - The server never reads `knowledge/`.
2. **Resources only where something uses them:** the component cards (attached in VS Code, read in Claude Code, embedded by R7's `explain_component`) and three guides that R7's prompts embed: forms, accessibility and layout.
   - **Dropped:** `kern://components`, `kern://icons`, `kern://utilities`, `kern://tokens`, `kern://templates/page-shell` and the composition guide. Each duplicates a tool or the cheat sheet. We add one back if we need it.
3. **Tool descriptions get a one-line hint only where it changes a choice:**
   - the name doesn't say what the component is (preline, details)
   - a look-alike exists (details or accordion, textarea or inputtext)
   - the status matters

   A skill in this repo writes the lines, because the best ones name our tools and the packer must never know them. Every component still gets the full text in `get_component_docs` and its card.
4. **Canonical HTML** is returned only by the four fallback tools (`details`, `search`, `layers`, `pattern`). Code picks the bundle example by ID: a rule can't, because it picks deprecated variants, the web-component Kopfzeile and the search field without a label. `get_component_docs` names the tool for the components that have their own template. If the packer later marks canonical examples, we revisit.
5. **Tokens are carried over** from today's `registry.json` until the bundle has `foundations/tokens.json`. The docs pages explain the naming system but don't list the names.
6. **Grid's deprecation is let through.** It's upstream: the Storybook title is "Layout/Container Grid (Deprecate)", and the bundle's utilities and layout texts say `kern-grid` replaces the `kern-row` grid. Whether `get_grid` moves to the CSS Grid utilities is a separate decision (open questions).
7. **Trimming:** prefer choosing a short field (a summary over section text) to rewriting. Where a skill condenses text, the result is checked in with the bundle's `inputHash`, so a re-import flags it when its source changes.
8. **Parked:** the listing budget (testing will catch it) and source pinning (the library is mature, and updates are occasional).

## Where things stand

- **Branch:** `feat/v2-alpha`, R5 and R5.1 done.
  - 54 tools; the listing is 115,556 characters against a 120K budget.
  - 1,824 tests pass (2026-10-03).
- **Clients:** VS Code Copilot and Claude. In both, the user attaches resources; Claude Code also gives the model tools to list and read them.
- **SDK v2.1** has what the resources need:
  - `registerResource` with a per-resource `cacheHint`
  - `ResourceTemplate` with `list` and `complete`
  - `ResourceNotFoundError` (`-32602` with `data: { uri }`)

  The list cache hints are already set in `create-server.ts`.
- **The bundle** (0.2.0, 2026-10-03; all 85 files validate against the packer's schema):
  - 46 components (five of them docs-only), 21 foundations docs pages, icons, classes, utilities, 3 stub patterns and `report.json`.
  - English text: 929 items reviewed, none stale or missing.
    - **Filled:** every component's `knowledge.summary`, docs summary and section summaries; `whenToUse` (37 components), `dos` (39), `donts` (40), `similar` (35, IDs only).
    - **Still empty:** `whenNotToUse`, `similar[].difference`, `contentGuidelines`, option and state text, accessibility `obligation`.
  - **Uses KERN's IDs** (`input-text`, `checkboxes`, `radios`, `list`). Ours are `inputtext`, `checkbox`, `radio`, `lists`.
  - **Upstream changes the import brings:**
    - 19 titles change ("Input Checkboxes", "Input E-Mail").
    - `grid` becomes deprecated and `list` experimental.
    - `index` goes.
- **Today's `registry.json`** (made by the in-repo generator in `tools/manifest/`):
  - 15 of 44 components have a German excerpt.
  - 37 carry story markup as `htmlCanonical`.
  - The tokens block mixes SCSS `$variables` into 466 names. `get_tokens` hasn't been called in any eval run.

## Plan

### A. Import the bundle and generate `registry.json` (K1a and K1b)

1. **The consumer contract and the ID map.**
   - `knowledge.schema.ts`: loose Zod objects for only the fields this repo reads, from `index.json`, components, `*.examples.json`, foundations pages, `icons.json`, the utilities examples and patterns.
     - The text limits are mirrored.
     - The `bundleVersion` major is checked.
     - Accessibility is read by criterion, never by the positional `id`.
   - The contract is exported as JSON Schema to `docs/knowledge-contract.schema.json` (`npm run knowledge:schema`), and a test keeps the file current. The packer's CI can validate against it (decision 6).
   - **The ID map**, two-way:
     - Our ID is the KERN ID without hyphens, except `checkboxes`, `radios` and `list`, which map to `checkbox`, `radio` and `lists`.
     - `layers` comes from the utilities example `stack`, and `pattern` from `patterns/header`.
     - It holds the canonical picks for the four fallback tools.
     - A test checks that every component tool resolves.
2. **`npm run knowledge:import -- <bundle-dir> [--dry-run]`.**
   - Validate every file and check that the map resolves.
   - Print the diff by document and section (ignoring `generatedAt`), plus the report's text state and drift count.
   - Replace `knowledge/` (repo root, excluded from Biome, not in any package).
   - A test validates the checked-in copy.
   - The first import is the 2026-10-03 bundle.
3. **`registry.json` from `knowledge/`.**
   - The registry contract becomes internal and moves to major 2.
     - **Dropped:** `category`, `strategy`, `reviewedGuidance` and `warnings`.
     - **Added:** `kernId`, `group`, synonyms, links, the English knowledge and docs digest, accessibility criteria (the strictest status per criterion), `docs-only` and the bundle's pins in `upstream`.
   - `htmlCanonical` is kept only for the four fallback tools. Tokens are carried over.
   - `get_component_docs` keeps its output shape for now, filled from the new fields. For components with their own template, it names the tool instead of returning canonical HTML.
   - The import writes `registry.json`, and a test checks that it equals the projection of `knowledge/`.
   - Review the parity diff in the snapshots (titles, statuses, `index`, the docs-only components), then run the eval.
4. **Retire the old path:**
   - `registry:import`, `tools/registry/`
   - `tools/manifest/*`, the overlay files, `validate-guidance-overlay`, `generate-manifest` (and its use in `loop:*`)
   - `docs/registry.schema.json` and its test
   - `fast-glob`

   Update the two skills that point at the old path.

### B. The bundle text on the tool path

5. **`get_component_docs` from the bundle.**
   - It returns the summary, when to use, do's and don'ts, similar components (with our tool where one exists), the WCAG criteria and the kern-ux.de links.
   - It accepts KERN IDs (`input-text`).
   - A docs-only component says it has no implementation in KERN 2.8.2.
   - Our tool notes stay.
   - New output schema and snapshots.
6. **Hint lines in tool descriptions.**
   - **The skill** (`.github/skills/tool-hints/`) applies the rule from decision 3. Per tool, it reads the component's bundle document, our description and the listing budget, and either writes a line of 80 characters or less or records "not needed".
   - **The lines** live in a code table with the bundle's `inputHash`, and `knowledge:import` lists the ones whose source changed.
   - The eval runs before and after.

### C. Resources and guides (R6 proper)

7. **Registration, cache hints, the test harness and the component cards.**
   - A resource definition type (URI or template, name, title, description, MIME type, annotations, a pure `read`), and a catalog built once.
   - `registerKernResources(server)`: capability `resources: {}`, with a `cacheHint` of an hour and `public` on every resource.
   - Tests on both protocol eras:
     - `resources/list` and `resources/templates/list`
     - a read
     - an unknown URI (`-32602` with `data.uri`)
     - the cache fields
   - Content snapshots, a size budget per resource, and `validateHtmlStrict` on every HTML block.
   - **The first resource is `kern://components/{id}`** (Markdown), for every component, listed and completed.
     - **From the bundle:** title, status, synonyms, summary, when to use, do's and don'ts, similar components, WCAG criteria, kern-ux.de links.
     - **From code:** the tool, its field digest, our rendered examples, the validation rules that apply, our tool notes.
     - A component without a tool gets a card without the tool part. Empty sections are left out.
8. **`resource_link`s from `get_component_docs`** to the component's card.
9. **The forms and layout guides.**
   - `kern://guides/forms`:
     - **From code:** label, hint and error, ids, optional marking, the error summary with group errors.
     - **From the bundle:** the general input rules in `form-inputs-overview`.
   - `kern://guides/layout`:
     - **From the bundle:** `layout`, `layout-overview` and `sizes-and-spacing`, plus the utilities summary.
     - **From code:** how our tools lay things out.
10. **The rule table and `kern://guides/accessibility`.**
    - The validator's 13 rules move into one table that both `validate.ts` and the guide read.
    - The guide lists each rule with how to satisfy it, next to the bundle's accessibility foundation and the WCAG criteria per component.
11. **`list_icons` from the bundle.** `VALID_ICON_NAMES` gives way to `foundations/icons.json` (42 names, three more than today) through `registry.json`.
12. **Docs:** a "Resources" section in the migration notes, the README's feature list, `codebase-guide.md`.
13. **The eval with resources.**
    - An option in the harness allows Claude Code's MCP resource tools.
    - One or two scenarios where a card or guide helps: a form with an error summary, and a component the model doesn't know well.
    - Compare with and without on the same commit. The base and nested suites stay as they are.

## Open questions

- **`get_grid` and the CSS Grid utilities.** KERN prefers `kern-grid` for new layouts, and the container grid is deprecated. `get_grid`, `get_card_group` and the page tools render the container grid. Moving them is a tool change of its own, not part of R6.
- **Asks for the packer** (none blocks R6):
  - a canonical example marker (one `canonical:` line per component in `components.yaml`)
  - multi-line example markup
  - one accessibility entry per criterion, with obligations
  - defaults for `alert.tone`, `badge.tone`, `button.type`, `heading.size` and `icon.name`
  - `foundations/tokens.json`: the `--kern-*` custom properties, grouped by the docs' token levels
  - `whenNotToUse` with `useInstead`, and `similar[].difference`
  - English section headings and pattern titles
  - the `index.json` licence note, which still says no docs prose is included
  - the schema description, which still says it will be replaced by this repo's schema

## Progress

- [ ] A1 The consumer contract and the ID map
- [ ] A2 `knowledge:import` and the checked-in `knowledge/`
- [ ] A3 `registry.json` from `knowledge/`
- [ ] A4 Retire the old registry path
- [ ] B5 `get_component_docs` from the bundle
- [ ] B6 The hint-lines skill and the description lines
- [ ] C7 Registration, cache hints, test harness, the component cards
- [ ] C8 `resource_link`s from `get_component_docs`
- [ ] C9 The forms and layout guides
- [ ] C10 The rule table and the accessibility guide
- [ ] C11 `list_icons` from the bundle
- [ ] C12 Docs
- [ ] C13 The eval with resources
