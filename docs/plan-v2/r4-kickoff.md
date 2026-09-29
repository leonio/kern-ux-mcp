# Kickoff: roadmap step R4 (composition gaps)

This file holds the R4 plan, its progress and what was learned. Snapshot date: 2026-09-29. The state R4 starts from is in [r3-handover.md](r3-handover.md).

## Your task

Do **R4: Composition gaps** from [roadmap.md](roadmap.md#r4-composition-gaps-prerequisite-for-prompts): one composition renderer, `field`/`fieldset`/`form` blocks, the `formFlow` fixes, a real `get_fieldset`, the `.kern-error` validate rules, schema rules for nesting, and `render_page`.

Read these first:
1. [roadmap.md](roadmap.md): the R4 tracker and "R4 composition gaps".
2. [findings.md](findings.md): items 9 (the `render_composition` closure web), 18 (the gaps) and 19 (the context budget, which the new kinds must not blow up).

Working agreements (standing, from the user):
- One commit per roadmap checkbox on `feat/v2-alpha`, a **pause for review after each group** (A, B, C), and a trailing `docs:` commit per group that updates this file.
- **Don't push without asking.**
- New LLM-facing text is **English** (decisions table). The existing German text stays until R5 rewrites it.

## Where things stand

- **Branch:** `feat/v2-alpha` at `419e012`, pushed. `2.0.0-alpha.69` is released.
- **Server:** 54 tools. The listing is 198K compact characters (finding 19).
- **Checks:** 536 tests in 68 files, all passing (2026-09-29).

### How composition worked before R4

- The block union has 9 kinds: `text`, `html`, `button`, `badge`, `section`, `disclosure`, `grid`, `card`, `formFlow` ([schemas/content-union.ts](../../packages/core/src/ux/schemas/content-union.ts)). Its JSON Schema appears once per tool, with recursion as `$ref`s into itself, so each composition tool carries 8–11K characters of it.
- Six tools accept blocks: `render_composition`, `get_section`, `get_disclosure`, `get_card`, `get_grid`, `get_card_group`.
- Rendering was `templates/content-union.ts` (replaced in A1) plus four optional callbacks (`renderCardNode`, `renderGridNode`, `renderSectionNode`, `renderDisclosureNode`). Each container passes on only some of them, so what renders depends on where a block sits:

  | Container | Drops |
  |---|---|
  | `section`, `disclosure` inside `render_composition` | nothing (their callbacks come from the tool) |
  | `card` inside a `card` | the inner card's `grid`, `section`, `disclosure` |
  | `grid` inside a `grid`, `section` or `disclosure` | the inner grid's `section`, `disclosure` |
  | standalone `get_grid` (no context, no locale) | every `section` and `disclosure` |
  | standalone `get_section`, `get_disclosure`, `get_card` | nested `section`, `disclosure` (no callbacks) |

  Each drop is a warning; the schema accepted the input.
- The schema's depth limit (`MAX_RECURSIVE_CONTENT_DEPTH = 4`, a `superRefine` walk) and the renderer's skip (`currentDepth >= maxDepth`) are two separate checks.

### Form markup today

- Input templates emit `kern-form-input`, `kern-hint` and `<p class="kern-error" id=… role="alert">`, with the input's `aria-describedby` pointing at hint and error. IDs are random (`generateId`); only checkbox and radio items accept an explicit `id`.
- `validate.ts` looks for `.kern-input__error, .kern-select__error, .kern-textarea__error, .kern-fieldset__error`. None of these exist upstream or in our templates, so `form.error_id` and `form.error_describedby` never fire.
- Upstream fieldset markup (`kern-ux-plain` 2.8.2, `stories/Fieldset`): `legend.kern-label` (optionally `kern-label--large`, `kern-label__optional`), a `kern-hint` referenced by the fieldset's `aria-describedby`, `kern-fieldset__body` (`--horizontal`), and for errors `kern-fieldset--error` plus a trailing `p.kern-error` that the fieldset also references.
- Upstream has **no** error-summary, form or footer pattern. The header patterns are `stories/Pattern/Header` (flex and grid). The real Kopfzeile is the "Offizielle Website – Bundesrepublik Deutschland" bar (`kern-kopfzeile` > `kern-container` > `__content` > `__flagge` + `__label`); our `buildKopfzeile` renders a placeholder header with a fake nav instead.

### Other bugs found while reading (not in the tracker)

- `input-text.ts` (and siblings) interpolate `label`, `value`, `placeholder` and `error` without escaping. A `&` or `<` in a label produces broken HTML. Fixed in B1 (agreed), when `field` starts routing model text through these builders.

## Agreed plan (2026-09-29)

The user approved the plan below and decisions 1–7 as recommended. For decision 5 the page shell links the KERN CSS from jsDelivr:
- `https://cdn.jsdelivr.net/npm/@kern-ux/native@<version>/dist/kern.min.css`
- `https://cdn.jsdelivr.net/npm/@kern-ux/native@<version>/dist/fonts/fira-sans.css`

`<version>` is the registry's `upstream.version` (2.8.2 today), so the CSS matches the markup the registry was built from. The user's example had no version; pinning it is our addition.

Three commit groups, eight commits, one per roadmap checkbox. Each leaves the repo green, with snapshot diffs reviewed in the same commit. **The order differs from the tracker** in one place: `get_fieldset` comes before `form`, because the form's fieldset groups are the same block.

### A. One renderer (no new kinds)

**A1. `createCompositionRenderer(locale)`** (item 9), in `templates/composition-renderer.ts`.
- Returns `{ renderBlocks(blocks, depth) }`. Every container (`card`, `grid`, `section`, `disclosure`, `formFlow`) recurses through the same renderer, so the callback plumbing, the `as Parameters<…>` casts and the "no renderer was provided" warnings go away.
- The six tools and the standalone builders use it. The builders keep their signatures for the tool builders and tests, taking an optional renderer.
- Effect: every nesting the schema accepts now renders. HTML changes only where a warning used to say "skipped".
- Test: a nesting matrix (every container × every child kind, standalone and inside `render_composition`) with no skip warnings.

**A2. `validate.ts` targets `.kern-error`**.
- The two rules select `.kern-error` (and nothing else; the old selectors never existed).
- Regression tests: every form template with `error` set passes; an error without `id` warns `form.error_id`; one that nothing references warns `form.error_describedby`. A fieldset referencing its error counts.

### B. Form building blocks

**B1. `field` block kind.** One flat schema, not the 11 input schemas:
`{ kind: "field", field: { type, name, label, id?, hint?, error?, optional?, value?, placeholder?, autocomplete?, rows?, options?: [{ value, label, selected?, disabled? }] } }`
with `type` one of `text`, `email`, `tel`, `url`, `number`, `date`, `password`, `textarea`, `select`, `radio`, `checkbox`.
- It dispatches to the existing builders and maps `options` onto each one's own shape (select `text`/`selected`, radio and checkbox `label`/`checked`). `options` is required for select and radio, and turns a checkbox into a list.
- Builders take an optional `id`, so B3 can link to fields. Escaping is fixed on the way.
- Why flat: embedding the real schemas would add roughly 30K characters to each of the six tools (finding 19). The flat one should cost 2–3K each. The commit prints the before/after sizes.

**B2. `get_fieldset` wraps child fields, plus a `fieldset` block kind.**
- `{ kind: "fieldset", fieldset: { legend, legendSize?: "default" | "large", optional?, hint?, error?, horizontal?, contentBlocks } }`, rendered as the upstream markup above, with `aria-describedby` on the fieldset for hint and error.
- `get_fieldset` takes the same fields (`contentBlocks` required, at least one). The hard-coded Vorname/Name example and its fixed IDs go. This changes the tool's contract on purpose (2.0).

**B3. `form` block kind.**
- `{ kind: "form", form: { action?, method?: "get" | "post", errorSummary?: { title? }, contentBlocks, actions?: { submitLabel, secondaryLabel? } } }`.
- Renders `<form … novalidate>`, then the error summary, the blocks, and an actions row of `kern-btn` buttons.
- The error summary is **collected, not written**: a `kern-alert` (danger) listing every field in the form that has an `error`, each linking to the field's ID. The model sets `error` on the fields and gets a consistent summary.

**B4. `formFlow` fixes.**
- `kern-btn kern-btn--*` with `<span class="kern-label">`, like `templates/button.ts`.
- The step renders inside a `<form>` (the same element B3 renders), so submit submits.
- `heading` becomes the form heading; a new `tasklistHeading` (default "Fortschritt" / "Progress") titles the tasklist.
- `renderAllSteps`: every step renders, the inactive ones with `hidden`.

### C. Rules and the page

**C1. The schema rejects nestings the renderer won't produce.** After A1 the renderer produces every structural nesting, so what is left are design rules and the depth limit:
- no `form` inside a `form` or a `formFlow` (nested forms are invalid HTML)
- no `formFlow` below the top level
- no `card` directly inside a `card`
- ~~the schema's depth check and the renderer's become one constant with one meaning~~ (done in A1)
- a `section` or `disclosure` block must have content: the union accepts one without, and the builder then throws a raw Zod error (found in A)
- no `form` inside a `formFlow` step either (the steps already sit in a form since B4)
- These go into the existing `superRefine` walk, which reports the exact path. Per-context unions would multiply the listing size. The rules are listed in the cheat sheet and the union's description.

**C2. `render_page` tool.**
- Input: `{ locale, strict, kopfzeile?: boolean | { label }, header?: { title, homeHref?, navigation?: [{ label, href, current? }] }, main: contentBlocks (required), footer?: { columns?: [{ heading, links: [{ label, href }] }] (max 4), note? }, document?: boolean }`.
- Output: skip link, the real Kopfzeile (CSS variant), a header after the upstream flex header pattern, `<main id="main">` with the blocks, and a footer as a section with a 4-column grid.
- `document: true` wraps it in an HTML5 shell (`<!doctype html>`, `lang`, the jsDelivr KERN CSS `<link>`s). This is the same shell R6 serves as `kern://templates/page-shell`.
- `get_kopfzeile` switches to the real Kopfzeile markup too, so both tools agree.

### Decisions (raised before starting, all agreed)

1. **Flat `field` schema** (B1) instead of embedding the input schemas. Recommended, for the listing size. The `get_input*`/`get_select`/… tools keep their full schemas.
2. **Which tools get the new kinds.** They join the one shared union, so all six block tools accept `field`, `fieldset` and `form`. Recommended: one union and one renderer are simpler, and R5 decides how the standalone tools shrink (option B there limits them to a shallow set anyway). The alternative is a second, larger union for `render_composition` and `render_page` only.
3. **`get_fieldset` requires children** (B2). Recommended: the placeholder output is the bug. The alternative keeps the example as a default when `contentBlocks` is omitted.
4. **Collected error summary** (B3) rather than a list the model writes. Recommended.
5. **`render_page` output** (C2): a fragment by default, `document: true` for a full HTML5 page, whose stylesheets come from jsDelivr (see above).
6. **`get_kopfzeile` markup** (C2): switch it to the upstream Kopfzeile bar. Recommended; today it renders a made-up header.
7. **Language of new text:** English descriptions and messages in the new schemas, German left as is until R5. Recommended, per the decisions table.

### Verification per commit

`npx biome ci .`, `npm run typecheck`, `npm run test:coverage`, and `npm run build && npm run test:e2e` where a tool's contract changes. Every snapshot diff (`tools-list.json`, `mcp-tools-list.json`) is reviewed in its commit, and B1–C2 print the per-tool listing sizes before and after.

## Progress

- [x] A1 `42b49be`: `createCompositionRenderer(locale)` in `templates/composition-renderer.ts`, with the nesting matrix test
- [x] A2 `d538e05`: `validate.ts` targets `.kern-error`, tested on every form template
- [x] B1 `aa209a9`: `field` block kind (`schemas/field.ts`, `templates/field.ts`), escaping in the input, select and radio templates
- [x] B2 `a3dd41c`: `get_fieldset` with children, `fieldset` block kind
- [x] B3 `71c4542`: `form` block kind with the collected error summary
- [x] B4 `132dffc`: `formFlow` in a form, KERN buttons, `tasklistHeading`, `renderAllSteps`
- [x] C1 `6f277a6`: nesting rules in the schema walk, content required in sections and disclosures, `type` on buttons
- [x] C2 `436a998`: `render_page`, the real Kopfzeile in `get_kopfzeile`
- [x] After a visual check of a `render_page` sample: `1f3099d` spaces form content, `1fd248a` stops nested `kern-container`s

Learned in A:
- **Builder API.** `buildCard`, `buildGrid`, `buildSection`, `buildDisclosure` and `buildFormFlow` take an optional `BlockContext` (`{ renderer, depth }`) as their third argument. Without one they render standalone at depth 0 through `standaloneContext(locale)`, so existing callers and tests needed no change.
- **Depth now has one meaning** (moved forward from C1): a tool's own blocks are depth 1, a standalone container is depth 0, and the renderer skips blocks deeper than `MAX_RECURSIVE_CONTENT_DEPTH` (4), exactly where the schema's walk stops. Before, leaves past the limit still rendered, and a standalone container counted as depth 1, one level short of what its schema allowed.
- **`callHandler` skips schema validation.** A test can pass input the server would reject: the old "section → grid → card → disclosure" test had a depth-5 leaf and only passed because leaves escaped the depth check. Tests that care now `safeParse` their payload first.
- **Import cycles are fine.** `composition-renderer.ts` and the container builders import each other, but only call each other at render time. esbuild bundles them, and e2e passes.
- The nesting matrix adds 450 cases (5 × 5 containers × 9 kinds, composed and standalone). The whole suite still runs in about 6 s.
- A2 needed no snapshot changes: no tool output had a `.kern-error` without its reference.
- Tests: 536 → 1002. Coverage 96.0 / 89.2 / 97.7 / 96.0.

Learned in B:
- **The listing grew by 41K**, from 198.0K to 238.9K compact characters: `field` +10.8K, fieldset +16.5K (10.7K of it because `get_fieldset` now carries the block union), `form` +7.9K, the `formFlow` options +5.6K. Every block tool repeats the union, and reused sub-schemas (like `errorSummary` in `form` and `formFlow`) are inlined each time. R5's shrink has to win this back; its option B (a shallow block set for the standalone tools) would take most of it.
- **Where the shapes live.** `schemas/field.ts` holds `FieldSchema` plus `FieldsetBaseSchema` and `FormBaseSchema` without their `contentBlocks`: the union and the `get_fieldset` schema each extend them. Importing `fieldset.ts` from `content-union.ts` instead would be a module cycle evaluated at load time.
- **Form helpers.** `templates/form.ts` exports `withErrorIds`, `renderErrorSummary`, `formOpenTag`, `formButton` and `buttonRow`; `formFlow` uses them.
- **Choices made along the way:**
  - Fields get no default format hint (`defaultHint: false`). `get_inputtext` keeps its default, which says "enter your full name" for any text field.
  - A single checkbox has no hint; the field warns when one is given, and when a property doesn't apply to the type.
  - Error summary entries read "Label: message", so a generic "Pflichtfeld" still says which field. Fields whose error is empty are left out.
  - In `formFlow` without `renderAllSteps`, "next" is `type="submit"` (each step is its own page); with it, back and next are `type="button"` for a script.
- **Commit messages:** `!:` or a `BREAKING CHANGE:` footer is GitVersion's major bump and would likely turn the alpha into 3.0.0. Contract changes on this branch (like `get_fieldset`'s) are described in the body instead.
- **Git Bash heredocs:** a `\n` inside a Python heredoc ended up as a real line break in the TypeScript twice. Escape sequences go in with the Edit tool.
- Tests: 1002 → 1797 (the nesting matrix is now 7 × 7 containers × 12 kinds). Coverage 96.1 / 89.9 / 97.9 / 96.1.

Open after B (not in the tracker):
- ~~A `button` block has no `type`, so inside a form it submits (the HTML default).~~ Fixed in C1: `type="button"` by default, `type: "submit"` on request.
- A fieldset's group error isn't in the error summary, only field errors are. GOV.UK links such an entry to the group's first input.

Learned in C:
- **C1 changed one rule from the plan.** "No `formFlow` below the top level" would also reject a wizard in a `section` under a page heading. The actual problem was nested forms, so the rule is: no `form` or `formFlow` inside a `form` or `formFlow`.
- **Nesting rules need the tool's own container.** `contentBlocksSchema(parent)` starts the schema walk inside it, so `get_card` rejects a card among its blocks just like a card in a card inside `render_composition`. The walk tracks the enclosing kinds and reports the exact path.
- **`render_page`'s input** is `heading` (the h1) plus `contentBlocks`, rather than the plan's `main`, to match the other block tools. The Kopfzeile is opt-in (`kopfzeile: true`), because its label claims an official federal website.
- **KERN has no skip-link or focusable `sr-only` class**, and a hidden focus fails WCAG 2.4.7, so the skip link is a small visible link, and only on pages with a header.
- **The stylesheet version** comes from `registry.json`'s `upstream.version`, now kept on the runtime `Registry`. `buildDocumentShell` is exported for R6's `kern://templates/page-shell`.
- **The guidance overlay** entry for `kopfzeile` describes the new tool. `registry.json` bakes the overlay in, so `get_component_docs` shows the old "placeholder" text until the next `generate-manifest` run, which is the maintainer's.
- **Visual check.** Headless Edge takes screenshots without extra installs: `msedge --headless=new --window-size=1280,2200 --screenshot=<png> file:///<html>`. Below about 500px it clips instead of reflowing, so check mobile at 520px. It found three layout problems the tests couldn't:
  - Fields outside a fieldset have no spacing of their own (`kern-form-input` sets none), so forms and `formFlow` steps now stack with `kern-flex kern-flex-col kern-gap-lg`. KERN has no `[hidden]` rule, so a flex class on a hidden step would show it; the stack is an inner element.
  - The grid always added a `kern-container`, which nested inside `<main>` and other grids. The block context now carries `inContainer`, and a grid inside a container renders just its row.
  - The header kept upstream's `kern-p-md`, meant for a full-width header.
- **Commit messages:** the `get_kopfzeile` contract change is described in the body, not with `!` (see B).
- **Listing:** 238.9K → 257.6K compact characters, 55 tools (C1 +1.9K, `render_page` +16.9K). R4 as a whole took it from 198.0K to 257.6K; R5 has to win that back.
- Tests: 1797 → 1713 (rejected nestings are tested once, not twice). Coverage 96.3 / 89.7 / 97.9 / 96.2.

Open after C (not in the tracker):
- Blocks in `<main>` and in `render_composition` have no spacing between them (a form's buttons sit right above the next grid). A stack on `<main>`, like the form's, would fix it.
- Every grid warns "KERN UX has two layout systems…", even when the columns divide 12. That is noise in every page's warnings.
- A fieldset's group error isn't in the error summary (see B).
- `registry.json` needs a `generate-manifest` run for the new `kopfzeile` guidance.
