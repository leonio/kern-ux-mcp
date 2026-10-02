# R4 handover: composition done, preparing R5 and R4b

As of 2026-09-29, **reviewed on 2026-10-02** (see [the review](#review-on-2026-10-02)). Branch `feat/v2-alpha`, pushed on 2026-10-02 with CI green; none of R4 is released yet (the last release is `2.0.0-alpha.69`, from R3). How R4 was planned and what was learned on the way is in [r4-kickoff.md](r4-kickoff.md). This file is the state to pick up from, and the groundwork for the next two steps: [R5](#r5-english-base-language-and-the-context-budget) and [R4b](#r4b-registry-contract).

## Where R4 ended

All eight R4 boxes are ticked in [roadmap.md](roadmap.md). The server has 55 tools.

| What | Where |
|---|---|
| One renderer for every block container; depth means the same in schema and renderer | `templates/composition-renderer.ts` (`createCompositionRenderer`, `BlockContext`, `renderChildBlocks`) |
| Block kinds `field`, `fieldset`, `form` (12 kinds in all), and the schema rules for nesting | `schemas/field.ts` (field, fieldset and form shapes), `schemas/content-union.ts` (union, walk, `contentBlocksSchema(parent)`) |
| `get_fieldset` wraps your own fields | `schemas/fieldset.ts`, `templates/fieldset.ts` |
| `form` with a collected error summary; `formFlow` inside a form, with KERN buttons and `renderAllSteps` | `templates/form.ts` (shared helpers), `templates/form-flow.ts` |
| `render_page`, a whole page (skip link, Kopfzeile, header, main, footer), and `document: true` with jsDelivr CSS pinned to the registry's KERN version | `schemas/page.ts`, `templates/page.ts` (`buildDocumentShell`, for R6's page shell) |
| `get_kopfzeile` renders the real Kopfzeile | `templates/kopfzeile.ts` |
| Form error rules fire on `.kern-error`; input templates escape the model's text; buttons have a `type` | `validate.ts`, `templates/escape.ts`, `templates/button.ts` |

All paths are under `packages/core/src/ux/`. Checks on 2026-09-29: 1713 tests, coverage 96.3 / 89.7 / 97.9 / 96.2, Biome, both typechecks, build and e2e all pass.

## Review on 2026-10-02

The maintainer and Claude went through this handover. Decisions, all written into [roadmap.md](roadmap.md):

| Topic | Decision |
|---|---|
| R0 | No longer blocks R5. The client matrix is a check before GA. |
| R5 order | Scripted baseline, budget test, **option B**, the `examples` table, then the English areas, then the optional compact profile. |
| R5 targets | ≤ 120K compact characters model-facing for the full toolset, ≤ 60K for a compact profile; `outputSchema` reported, not counted. |
| Option B | Measure a fixed shallow set against sets matched to each tool's job before choosing. The registry's `anatomy` (from `kern-ux-plain/component-layouts.md`) checks the sets later. |
| Error hints | The known-good payloads move into an `examples` table with a golden test, early in R5. |
| Baseline | Scripted against a model API, run against the R4 release and after each R5 step, to save manual runs and tokens. |
| R4 output leftovers | A new **R5.1**, after R5, so before/after stays comparable: the grid warning, the default text-field hint, spacing in `<main>`, fieldset errors in the summary. |
| R4b validation | In a test and in `registry:import`, not at startup: the bundled file is the one CI checked. |
| R4b descriptions | "Combine with the registry summary" waits on the generator delivering summaries, not on R5. |
| Registry | What it's missing and how to generate it: [registry-requirements.md](registry-requirements.md). New R4b first box: code owns the tool list and routing (`get_index` goes). |
| Migration notes | [docs/migration-2.0.md](../migration-2.0.md), written now for the record, then one entry per contract change. |
| Housekeeping | Raise the coverage floors and update [README.md](README.md) in this folder after this review. No runner pin for Ubuntu 26. |

New order:
1. The maintainer regenerates `registry.json` and releases the next alpha (below).
2. R4b's code and contract boxes (the tool list in code, the schema, the export, the validation test, `registry:import`). They don't touch tool text, and they give the generator a schema to validate against while R5 runs.
3. R5, then R5.1.
4. The generator's first import (R4b), then the knowledge fields and summaries, next to R6.
5. The R0 client matrix, any time before GA.

## Before either step (the maintainer)

1. **Release an alpha** before R5, so R5's baseline has a release to run against: `gh workflow run release.yml --ref feat/v2-alpha -f dry-run=false`, then the approvals in [CONTRIBUTING.md](../../CONTRIBUTING.md#releasing). **No registry regeneration is needed** since R4b A2 (2026-10-02): the Kopfzeile notes that were stale in `registry.json` now come from code. The external generator's output comes later, through R4b's `registry:import` ([registry-requirements.md](registry-requirements.md)).
2. **R0 client matrix**, before GA (runbook: `git checkout 31110cf -- spike/r0`, then `spike/r0/CLIENT-MATRIX.md`). It no longer decides anything in R5.

## R5: English base language and the context budget

Tracker: [roadmap.md R5](roadmap.md#r5-english-base-language-and-the-context-budget). Details: "R5 English base language and the context budget" in the same file, and [findings.md](findings.md) item 19.

### Measured on 2026-09-29

| | Compact characters |
|---|---|
| Whole `tools/list`, 55 tools | 257.6K |
| What reaches the model (name, description, `inputSchema`) | 199.7K |
| `outputSchema` (48 tools repeat the same 845-character `ComponentOutputSchema`) | 49.1K |
| Tool descriptions | 12.0K |
| Schema `description` strings, as listed (the union repeats per tool) | 80.7K |
| The block union: 12.5K in each of 8 tools | 100.3K |

The 8 block tools are `render_composition`, `render_page`, `get_card`, `get_card_group`, `get_grid`, `get_section`, `get_disclosure` and `get_fieldset`. Union branch sizes: `formFlow` 1964, `button` 1888, `field` 1739, `card` 1329, `grid` 1158, `form` 1048, `fieldset` 922, `section` 808, `badge` 754, `disclosure` 388, `html` 187, `text` 175.

Language, by a simple German-word heuristic on the listing: 52 of 55 tool descriptions and 276 of 360 unique schema descriptions (28.4K of 32.8K characters) are German. There are 390 `.describe()` calls under `schemas/`, `tool-builders/` and `tools.ts`.

### What the numbers say about the shrink options

- **Option A (`$defs`/`$ref`) doesn't shrink anything.** Emitting reused sub-schemas as references (`z.toJSONSchema` with `reused: "ref"`) made the input schemas *larger*, 186.6K to 256.5K, and no single tool got smaller by more than 300 characters. The duplication is *across* tools, and a tool's `inputSchema` can't reference another tool's. Recursion already goes out as in-document `$ref` pointers (`json-schema.ts` inlines each definition at its first use), so every client that runs `render_composition` today already resolves `$ref`.
- **Option B is the big lever.** The six standalone block tools carry the full union (75K). A shallow set per tool, say `text`, `html`, `badge` and `field` (about 2.9K), would save roughly 55–58K. `render_composition` and `render_page` keep the full union, and deep nesting goes through them.
- **The 60K target predates R2b and R4.** At the time the whole listing was 142K. Now the model-facing part alone is 200K. Option B brings it to about 145K, and shorter English text maybe another 20–30K. Reaching 60K would take the compact profile (`KERN_TOOLSET=compact`) or dropping tools. The target needs resetting at the R5 kickoff (see the questions below).
- `outputSchema` (49K) only counts if a client passes it to the model. The R0 matrix answers that; until then, measure it separately, as the roadmap already says.

### Where the text lives

- Tool descriptions: `tools.ts`, `tool-builders/{interactive,layout,typography,shared}.ts`.
- Schema text: `schemas/*.ts`. The R4 schemas (`field.ts`, `fieldset.ts`, `page.ts`, `kopfzeile.ts`, the new `formFlow` options) are already English.
- `COMPOSITION_CHEAT_SHEET` and `COMPOSITION_VALID_KINDS` (`tools.ts`): shared by the `render_composition` description and the error hints of `render_composition` and `render_page` (`invoke.ts`, `COMPOSITION_TOOLS`).
- Error hints with known-good payloads, in German: `invoke.ts` (`formatInputValidationHint`).
- Validation messages: the walk's size and depth messages in `content-union.ts` are German; the R4 nesting-rule messages are English.
- The failure catalog to check each area against: [.github/skills/tool-description-quality/references/failure-catalog.md](../../.github/skills/tool-description-quality/references/failure-catalog.md).

Per-tool sizes from the snapshot on 2026-10-02: the 8 block tools are 122K of the ~200K model-facing characters (60%), the 13 form-input tools 37K, the other 34 tools 43K. The six standalone block tools are 90.6K together. Option B saves about 58K (to about 144K), and the English pass should take it to about 115–125K.

### R4 leftovers: now R5.1

The grid's "two layout systems" warning on every grid, and the "enter your full name" default hint in `get_inputtext` and its siblings, moved to [R5.1](roadmap.md#r51-output-polish-after-r5) (decided 2026-10-02), together with the two "Other open items" from R4 below.

### Questions for the R5 kickoff

Answered on 2026-10-02:
- **Q1, budget targets:** ≤ 120K model-facing for the full toolset, ≤ 60K for a compact profile, `outputSchema` reported but not counted.
- **Q2, option B's block set:** measure a fixed shallow set (`text`, `html`, `badge`, `field`) against per-tool sets (`get_grid` and `get_card_group` with cards, `get_section` with a grid, and so on; containers whose children are simple blocks), then choose. `get_fieldset` needs at least `field` and `text`.
- **Q4, baseline:** a scripted harness against a model API, run against the R4 release, with VS Code Copilot and Claude Code as spot checks. Which API and model it uses is for the kickoff.
- **Q5, error hints:** the known-good payloads move into an `examples` table with a golden test, before the hints are translated.

Still open:
- **Q3, compact profile:** which tools it keeps, and whether it's needed once the full set is under 120K. The roadmap lists `render_composition`, `render_page`, `render_component`, `validate_html` and the docs tools.

## R4b: registry contract

Tracker: [roadmap.md R4b](roadmap.md#r4b-registry-contract-consumer-side-of-the-external-generator). Background: [findings.md item 22](findings.md#22-the-registry-moves-to-an-external-generator-this-repo-owns-the-contract).

### The registry today

- `registry.json`: 120 KB, `manifestVersion` `"1.0.0"`, `generatedAt`, `upstream` `{ package: "@kern-ux/native", version: "2.8.2", commit: "cf2a17b" }`, 44 components, and tokens (317 colors, 57 spacing, 466 raw variables).
- The types are hand-written in `types.ts`: `RegistryManifest`, `ComponentInfo`, `ReviewedComponentGuidance` and friends. Component keys in use: `id`, `title`, `status` (`stable`/`experimental`), `category`, `strategy` (`interactive`/`layout`/`typography`/`fallback`), `docs`, `reviewedGuidance`, `sources`, `htmlCanonical`, `warnings`.
- The loader (`registry.ts`) checks only that `manifestVersion` and a `components` array exist.
- `docs/registry.schema.json` is **stale and unused**. It is 2020-12 and describes component properties `guidance` and `guidanceSections` (the registry uses `docs`). Nothing validates against it.

What reads which field (non-test code):

| Field | Read by |
|---|---|
| `id`, `title` | tool names and titles (`tool-builders/shared.ts`, `tools.ts`) |
| `category`, `strategy` | routing (`routeComponentTool`) and `list_components_by_category` in `tools.ts` |
| `status`, `warnings` | the status banner and tool warnings (`tool-builders/shared.ts`) |
| `docs`, `reviewedGuidance`, `sources` | `get_component_docs` (`tools.ts`) |
| `htmlCanonical` | fallback output (`tool-builders/layout.ts`, `typography.ts`, `tools.ts`) |
| `tokens` | `get_tokens` |
| `upstream.version` | `render_page`'s stylesheet version (new in R4; kept on the runtime `Registry`, so the contract must keep it required) |

### The in-repo generator to retire

`tools/manifest/` (`build-manifest.ts`, `guidance-overlay.ts`, `validate-guidance-overlay.ts`, `stories.ts`, `paths.ts`), `docs/guidance-overlay.json` and its schema, the root scripts `generate-manifest`, `validate-guidance-overlay`, `loop:start` and `loop:full` (both run `generate-manifest`), and the dev dependency `fast-glob`. (`ajv` and `ajv-formats` stay for the registry-schema export test, R4b B2.)

### The generator side

`C:\src\github\leonio\kern-ux-scraper` (Go) finished its Phase 1: an offline corpus of kern-ux.de (64 pages, 382 chunks, KERN 2.8.2) plus a corpus-to-component mapping in `mapping/`. Its `HANDOFF.md` still describes Phase 2 as feeding the corpus into *this* repo's generator. That predates finding 22, which made the scraper the generator. Updating that handoff is the maintainer's call, in that repo. This repo builds no corpus mapping or curation (finding 22).

### What the registry is missing

Reviewed on 2026-10-02: [registry-requirements.md](registry-requirements.md). In short:
- **The registry decides which tools exist** (`createTools()` makes one per component). That's how `get_index` exists, and how `get_details` and `get_search` arrived silently with 2.8.2.
- `category`/`strategy` are our routing, `warnings` are generator diagnostics that reach tool output, and the three `reviewedGuidance` entries describe our tools, not KERN. All of these move to code.
- Missing: English summaries, synonyms, similar components, when to use, examples (7 components have none), classes, accessibility obligations, anatomy, and the inventories hand-coded here (icons, which have already drifted: 3 upstream icons are missing; utilities; all valid `kern-*` classes; tokens with values).
- How to generate it: pin, extract, curate, generate, then assemble and validate, with per-component curation files for easy additions and cached, reviewable LLM text.

### Suggested order

- **First:** code owns the tool list and routing (the new first box), then the contract: the Zod `RegistryManifestSchema` with the types derived from it, the JSON Schema export replacing `docs/registry.schema.json`, validation in a test and in `registry:import`, and `registry:import` with the component diff. None of this touches tool text, so it can run before, after or alongside R5.
- **Then:** the generator's first import, the optional knowledge fields, and consuming the inventories (icons, utilities, tokens, the unknown-class warning).
- **Last:** the box "tool descriptions combine code-owned API text with the registry summary", once the generator delivers summaries, next to R6's cards. R5 leaves room for them in the budget.

### Questions for the R4b kickoff

Answered on 2026-10-02:
- **Q4, startup cost:** no validation at startup. The bundles inline `registry.json`, so the server runs the file CI validated.

Still open, with recommendations in [registry-requirements.md](registry-requirements.md#7-open-questions-r4b-kickoff):
- **Q1, `manifestVersion`:** the loader accepts major 1 (`"1.x"`), and a breaking contract change means `2.0.0` in both repos? Recommended: yes, and keep the contract additive.
- **Q2, unknown keys:** strict (reject) or passthrough? Recommended: accept them when loading, and have `registry:import` list them.
- **Q3, JSON Schema dialect** for the export: draft-07 like the tool schemas, or 2020-12? Recommended: 2020-12, published as `docs/registry.schema.json`.
- **Q5, the docs source's licence**, if the generator reads the docs repository instead of the site: it decides whether German text can be carried over verbatim with attribution.

## Other open items (not scheduled)

- From R4 ([r4-kickoff.md](r4-kickoff.md), "Open after C"): blocks in `<main>` and in `render_composition` have no spacing between them; a fieldset's group error isn't in the error summary. **Now in R5.1.**
- From R3 ([r3-handover.md](r3-handover.md)): Claude Desktop running the `.mcpb`; the MCPB icon; dry runs can't test the publish job; release tools pinned outside Renovate; `ubuntu-latest` becomes Ubuntu 26 on 2026-10-19 (no pin; the maintainer is fine with the release as it is).
- ~~**Coverage floors** are still 87 / 79 / 87 / 87.~~ Raised to 94.5 / 88 / 96 / 94.5 on 2026-10-02.
- ~~**Docs:** [README.md](README.md) in this folder still describes the pre-R1 layout.~~ Rewritten on 2026-10-02.

## Environment notes, beyond r3-handover.md

- **Visual checks without extra installs:** `msedge --headless=new --window-size=1280,2200 --screenshot=<png> file:///<html>` (Edge is at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`). Below about 500px it clips instead of reflowing, so check mobile at 520px. To render a sample, run a scratch `.mts` script with `npx tsx --conditions=@leonio/source <file>.mts` that imports core source by `file:///C:/…` URL.
- **Git Bash heredocs into Python:** `\n` escapes in a Python string can arrive as real line breaks. Use raw strings (`r'''…'''`) or the Edit tool for anything with escapes.
- **GitVersion:** a `!:` subject or a `BREAKING CHANGE:` footer is its major bump and would likely turn the alpha into 3.0.0. On this branch, contract changes are described in the commit body.
- **`callHandler` skips schema validation.** Tests that care whether the server would accept a payload `safeParse` it first.
- **Listing sizes:** compare `packages/core/src/ux/__snapshots__/tools-list.json` against `git show HEAD:…` per tool, until R5's budget test does it.
- `vitest run -u` updates both listing snapshots; the wire-versus-domain test in `mcp/listing.test.ts` reads the domain file, so it passes on the next run.
