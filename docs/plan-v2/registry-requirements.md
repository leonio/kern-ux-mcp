# Registry requirements: what kern-ux-mcp needs from `registry.json`

As of 2026-10-02, against `registry.json` from 2026-09-27 (KERN 2.8.2, 44 components). This is the input for the generator in `kern-ux-scraper` ([finding 22](findings.md#22-the-registry-moves-to-an-external-generator-this-repo-owns-the-contract)) and for R4b's Zod contract in this repo.

**Partly superseded (2026-10-02):** the generator now reads three sources (`kern-ux-plain`, the kern-ux.de docs source `technische-dokumentation`, and `kern-react-kit`). The design for what it writes is [knowledge-bundle.md](knowledge-bundle.md), which replaces sections 3, 5 and 6 here. Sections 1, 2 and 4 still describe today's registry and what stays in this repo.

**The contract exists now** (R4b, 2026-10-02): `RegistryManifestSchema` in [packages/core/src/ux/registry.schema.ts](../../packages/core/src/ux/registry.schema.ts), exported as [docs/registry.schema.json](../registry.schema.json) for the generator to validate against. `npm run registry:import -- <path> [--dry-run]` checks a generated file and prints what changes. The schema is the source of truth for the shape; this file is the reasoning, and the list of what to add (section 3) as new optional fields. Sections 2.1–2.4 are done in this repo.

The short version:
- Today's registry is mostly **inventory plus raw German excerpts**. It also carries things that belong to this repo (tool routing, notes about our own tools, generator diagnostics), and it decides which tools exist.
- What the server is missing is **component knowledge in English**, the kind a model needs to pick the right component and use it correctly, plus **inventories** that are hand-coded here today: icons, utility classes, all valid `kern-*` classes, and tokens with values.
- The scraper corpus and `kern-ux-plain` already hold nearly all of it. The work is extracting it deterministically, generating English from the extracted facts, and curating on top.

## 1. How the server uses the registry today

| Field | Read by | Problem |
|---|---|---|
| `components[]` itself | `createTools()` makes one `get_<id>` tool per component | **The registry decides which tools exist.** See 2.1. |
| `id`, `title` | tool names, tool titles ("KERN Input Email") | Titles are source folder names (`InputEmail`, `dropdown`, `index`), not KERN names. |
| `category`, `strategy` | tool routing (`routeComponentTool`), `list_components_by_category` | This is our routing, hard-coded in the generator's ID sets. See 2.2. |
| `status` | the status banner and warnings in tool output | Derived from an SCSS-comment heuristic and a hard-coded `dropdown`. |
| `warnings` | appended to fallback tool output | Generator diagnostics reaching the model. See 2.3. |
| `docs` | `get_component_docs` | Raw German `COMPONENTS.MD` sections with `[COMPONENTS.MD]` prefixes. 15 of 44 components. |
| `reviewedGuidance` | `get_component_docs` | 3 of 44. All three describe *our tools*, not KERN. See 2.4. |
| `sources` | `get_component_docs` (`files`) | Fine. |
| `htmlCanonical` | the output of fallback tools | One example per component; missing for 7. |
| `tokens` | `get_tokens` | 466 names, no values, no themes, grouped by regex. |
| `upstream.version` | `render_page`'s stylesheet URL | Fine; must stay required. |

Hand-coded in this repo, and drifting from upstream:
- `VALID_ICON_NAMES` (`types.ts`): 39 names. `kern-ux-plain` 2.8.2 defines 42; `account-circle`, `dehaze` and `language` are missing.
- `templates/utility-reference.ts`: 376 hand-written lines of utility classes.
- `relatedTools` in `get_component_docs`: four hard-coded `if`s.

## 2. Fix in today's shape (whatever the generator does)

1. **The registry decides which tools exist.** A regeneration adds or removes tools without anyone touching code:
   - `get_index` is a live tool. It comes from `src/scss/core/components/_index.scss`, a partial, and renders a placeholder.
   - The 2.8.2 regeneration (`8964ac2`) added `get_details` and `get_search` silently.

   This conflicts with the 2.0 decision that tool names stay stable. **Fix in this repo (R4b):** code owns the tool list and the component-to-tool mapping. A registry component without a tool is documentation only, reachable through `get_component_docs` and R6 resources. A test fails when a tool's component is missing from the registry.
2. **`category` and `strategy` are routing.** They say which of our tool builders handles a component (`LAYOUT_IDS`, `INTERACTIVE_IDS`… in `build-manifest.ts`). An external generator shouldn't have to know our builders. They move into the code table from 2.1 and become optional in the contract. If the registry wants a classification, it should be KERN's own (the docs navigation: Form Inputs, Text, Layout…).
3. **`warnings` are generator diagnostics** ("No canonical story template extracted for index.") and end up in tool output. They belong in the generator's report, not in the runtime file.
4. **`reviewedGuidance` describes our tools.** The three overlay entries say the Kopfzeile tool is a placeholder (no longer true since R4), that the InputDate tool renders one native field, and what the Dropdown tool leaves out. Those are notes about this repo's implementation, so they move to code next to the tools. The registry carries knowledge about KERN.
5. **Seven components have no example markup:** `dropdown`, `heading`, `label`, `preline`, `subline`, `title`, and `index` (which goes). The corpus has examples for `heading`, `label`, `preline`, `subline` and `title`.
6. **Junk and story-only entries:** `index` (a partial), `pattern` (`stories/Pattern`, the header patterns, which `get_pattern` and `render_page` use), `layers` (story-only; the docs call it Layering, under Foundations).
7. **`upstream.commit` must be the release tag's commit.** The sibling checkout is at `bf7c823` (`v2.8.2-2`), two commits after the release.

## 3. What a good registry contains

### Per component

Keyed by the stable `id` (lowercase, as today). Suggested names; the Zod contract settles them.

| Field | Content | Source | Used for | Priority |
|---|---|---|---|---|
| `id`, `title` | `title` is KERN's name ("Input E-Mail", "Task List") | docs | tool titles, index | P1 |
| `status` | `stable` / `experimental` / `deprecated`, plus `deprecatedIn` and `replacement` when set | `COMPONENTS.MD` markers, `CHANGELOG.md` | status banner, cards | P1 |
| `docsUrl` | the kern-ux.de page | corpus | attribution, cards | P1 |
| `summary` | one English sentence, **≤ 160 characters**; optional `de` | generated from the docs summary | tool descriptions, `kern://components`, cards | P1 |
| `synonyms` | `{ de: [], en: [] }`, ≤ 10 each | corpus `meta.synonyms`, plus English | discovery ("modal" → dialog), mapping free-text form fields in R7 prompts | P1 |
| `similar` | `[{ id, difference }]`: how it differs from components it's confused with | corpus `similarComponents`, generated difference | choosing between details, accordion and disclosure; button and link; alert, badge and notification banner | P1 |
| `whenToUse`, `whenNotToUse` | ≤ 5 items each, ≤ 200 characters; a `whenNotToUse` item can name `useInstead` | docs "Verwendungsregeln", generated | tool choice, cards, anti-use | P1 |
| `examples` | `[{ id, title, html, source }]`, ≤ 6, the first one canonical | `kern-ux-plain` stories (EUPL), corpus examples where stories have none | fallback output, cards, few-shot examples in R7 prompts | P1 |
| `classes` | `{ block, elements[], modifiers: [{ class, meaning }] }` | SCSS (`&__`, `&--`), stories | cards, validation | P1 |
| `accessibility` | `[{ wcag: "1.1.1", status: "passed" \| "implementation-dependent", obligation }]` | corpus `accessibility` | cards, `kern://guides/accessibility`, finding validate rules we lack | P2 |
| `dos`, `donts` | ≤ 6 each, ≤ 200 characters | docs "Dos und Don'ts", generated | cards, R7 prompts | P2 |
| `anatomy` | the element tree, with slots and what each slot accepts (atoms, components, or free content) | `kern-ux-plain/component-layouts.md` (EUPL; 32 components) | the composition guide, checking the per-tool block sets (R5), structure checks in `validate_html` | P2 |
| `webComponent` | tag and attributes (`kern-kopfzeile`) | `COMPONENTS.MD` | cards | P3 |
| `sources` | story and SCSS paths, as today | source scan | `get_component_docs` | P1 |

The `implementation-dependent` WCAG criteria matter most: they're what the *author* must still do ("icon-only buttons need screen-reader text"). Each can later be mapped to a `validate.ts` rule, which shows which checks are missing.

**Size limits belong in the contract.** Only `summary` reaches tool descriptions, so 44 × 160 ≈ 7K is the most the registry can add to the listing. R5 reserves that room. Everything else is served on demand, through `get_component_docs` and R6 resources.

### Global

| Field | Content | Source | Replaces | Priority |
|---|---|---|---|---|
| `upstream` | `package`, `version`, `commit` (release tag), plus `corpus: { source, version, revision }` | pins | today's `upstream` | P1 |
| `generator` | `name`, `version` | generator | new | P1 |
| `docsOnly` | components KERN documents that have no markup in `kern-ux-plain`: `[{ id, title, docsUrl, note }]` | corpus pages that map to nothing | new: lets the model say "not in KERN 2.8.2" instead of inventing `kern-tabs` | P1 |
| `classes` | every valid `kern-*` class (components and utilities) | the compiled CSS, or the SCSS | new: an "unknown KERN class" warning in `validate_html` catches `kern-button` and `kern-bg-*`, which models (and the old formFlow template) do produce | P1 |
| `icons` | `[{ name, keywords: { en, de } }]` | `src/scss/core/utilities/_icons.scss` | `VALID_ICON_NAMES` | P1 |
| `utilities` | `[{ group, class, meaning: { en, de }, example? }]` | utility SCSS, docs "Hilfsklassen" | `utility-reference.ts` | P2 |
| `tokens` | `[{ name, group, value, valueDark?, meaning? }]` plus breakpoints, container widths and the spacing scale | token SCSS or compiled CSS, Foundations pages (Farbe, Größen und Abstände, Layout, Layering) | today's name lists | P2 |

The five corpus pages that map to no component today (Bildwortmarke, Header, Nav, Notification Banner, Tabs) each need a decision: `docsOnly`, or mapped. Header is probably the `stories/Pattern/Header` pattern.

### Example (one component, shortened)

```json
{
  "id": "button",
  "title": "Button",
  "status": "stable",
  "docsUrl": "https://www.kern-ux.de/komponenten/button",
  "summary": { "en": "Triggers an action; its label names the action. For navigation, use a link." },
  "synonyms": { "de": ["Schaltfläche", "Schalter"], "en": ["push button"] },
  "similar": [{ "id": "link", "difference": { "en": "A link navigates to another page; a button acts on this one." } }],
  "classes": {
    "block": "kern-btn",
    "elements": [],
    "modifiers": [{ "class": "kern-btn--primary", "meaning": { "en": "The main action of a view; use once per section." } }]
  },
  "accessibility": [
    { "wcag": "1.1.1", "status": "implementation-dependent", "obligation": { "en": "Icon-only buttons need screen-reader text." } }
  ],
  "examples": [
    { "id": "primary", "title": "Primary", "html": "<button class=\"kern-btn kern-btn--primary\" type=\"button\">…</button>", "source": "stories/Button/Button.stories.js#Primary" }
  ]
}
```

Each generated or curated text item should also carry its provenance (see 5). It can sit beside the text or in a parallel map; the contract decides.

## 4. What stays in this repo

The registry describes KERN and never names our tools. This repo owns:
- the tool list, the component-to-tool mapping and routing (2.1, 2.2)
- tool and parameter text, error hints and `examples` (R5)
- notes about our tools' simplifications (2.4)
- the validation rules, and which block kinds each tool accepts (R5)

Text splits the way finding 22 says:
- A `get_<component>` description is code's API text plus the registry `summary`.
- R6 cards render from the registry plus the Zod field digest.

## 5. How to generate it well

These are recommendations for the generator repo; how it's built is your call. What matters on this side is that the output passes the contract and that a regeneration produces a reviewable diff.

```
pin  ─▶  extract  ─▶  curate  ─▶  generate  ─▶  assemble + validate  ─▶  registry.json + report
```

1. **Pin the inputs.** Use `kern-ux-plain` at the release tag, and docs at the same KERN version. Stop if the versions disagree. The corpus's `kernVersion` field already makes this checkable.
2. **Extract deterministically, with no LLM.** That covers:
   - the inventory (stories and SCSS, with the exclusion and alias tables, which now live only in the generator)
   - `classes` from SCSS or the compiled CSS
   - `anatomy` from `component-layouts.md`
   - `examples` from stories
   - icons, utilities and tokens with values
   - the docs join: synonyms, similar components, URLs, the WCAG lists, and the raw usage rules and do's and don'ts
3. **Curate by hand, in small files.** One YAML file per component (say `curation/button.yaml`), whose entries always win: summary overrides, extra don'ts, pinned examples, "reviewed" flags. The inventory decisions (aliases, exclusions, `docsOnly`) go in one more file. This is where "add to it easily" happens.
4. **Generate English with an LLM, from the extracted facts, not by translating pages.**
   - Version the prompt.
   - Cache each result by a hash of its inputs plus the prompt version and the model, so a run only regenerates what changed.
   - Mark output `origin: generated`, `reviewed: false` until curation flips it.
   - **Never overwrite reviewed text.** If its inputs change, mark it `stale` and list it in the report.
5. **Assemble and validate.**
   - Precedence: curated, then generated, then extracted.
   - Validate against the JSON Schema this repo exports, size limits included.
   - Write deterministically: sorted arrays, stable formatting, and a `generatedAt` that only changes when the content does, so diffs stay readable.
6. **Report, separately from the runtime file:** coverage, stale and unreviewed text, unmapped pages, and diagnostics (what `warnings` holds today).

### If the docs come from their source instead of the site

Reading the docs repository directly (front matter, Markdown or MDX) is sturdier than HTML selectors, and the corpus model (`blocks`, `accessibility`, `meta`) can stay the same. **Check that repository's licence first:**
- If it is open (EUPL, CC BY or similar), the `de` text can be carried over verbatim with attribution, and the LLM only writes English.
- If it isn't, finding 22's rule stands: original English generated from facts, no copied or closely paraphrased text, example markup only from the EUPL source.

## 6. Adding to it and updating it

| Change | In the generator | In this repo |
|---|---|---|
| New KERN release | bump the pins and run; the report lists changed components and stale reviewed text | `npm run registry:import -- <path>`: validates, copies, prints the component and field diff; the listing snapshots show the effect on tool text |
| Fix or add knowledge | edit `curation/<id>.yaml` and run (curation-only changes need no LLM call) | import as above |
| A new kind of knowledge | | add an optional field to the contract first, export the schema, then the generator fills it |
| Review generated text | flip `reviewed` in curation (a `review <id>` command helps) | — |

Generator commands that would pay off: `build`, `diff <old> <new>`, `review <id>`, and `explain <id>`, which shows where each field came from.

## 7. Contract decisions

Decided and implemented on 2026-10-02 (R4b group B):
1. **Versioning.** `manifestVersion` stays 1.x and the contract is additive. Today's file validates unchanged; `category`, `strategy`, `warnings` and `reviewedGuidance` are optional and marked deprecated, since code no longer reads them. New kinds of knowledge arrive as new optional fields: changing what an existing field holds (for example `tokens`) would be major 2, in both repositories.
2. **Unknown keys** are accepted: parsing strips them, and `registry:import` lists them, so the generator can work ahead of the contract and the additions still show up in review.
3. **JSON Schema dialect:** 2020-12, published as `docs/registry.schema.json` by `npm run registry:schema`. A test keeps it current.

Answered on 2026-10-02:

4. **The docs source's licence.** The `technische-dokumentation` repository's licence page says texts and graphics are CC BY-NC-SA and code is EUPL. So docs prose can't be carried into this EUPL package; the generated English is written from facts, as section 5 says.
