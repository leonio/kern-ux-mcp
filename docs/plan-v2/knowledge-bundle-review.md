# Review of the first knowledge bundle (0.2.0)

2026-10-02. This is a review of `kern-ux-scraper/kern-knowledge/` (bundle 0.2.0, generated 2026-10-02 11:09 UTC) against [knowledge-bundle.md](knowledge-bundle.md). It covers the bundle's quality, what it still needs before this repo can derive `registry.json` from it alone, and what changes in the design.

## Verdict

The bundle follows the design closely and is already useful. All 57 files validate against the generator's schema. Options with HTML bindings, tagged examples, states and drift (K2) are mostly there, a phase ahead of plan.

**Deriving `registry.json` from the bundle alone is the right goal.** Don't merge the two. Everything in today's registry either is in the bundle, is retired, or is something the bundle should carry anyway (tokens). Merging would give us two sources of truth for the same facts again. Use a one-time parity diff between the projection and today's `registry.json` to catch regressions, then retire the old path.

The bundle must not carry anything shaped like our tools: no tool names, no parameter names, no IDs from this repo. Mapping from KERN to our tools stays a small, code-owned map here (section 3). The bundle supplies KERN facts and English text; this repo's code turns them into tools.

## 1. What works

- **Layout and identity.** It has one document per component, examples split out above 20 KB, `index.json` with all three sources pinned, and a `report.json`. The 46 components cover every docs page. The five docs-only ones (`tabs`, `nav`, `header`, `notification-banner`, `bildwortmarke`) are there with `status: "docs-only"`.
- **Options and bindings (K2).** 25 components have options with `modifier`, `part-class` and `attribute` bindings, `omit` for defaults, and facts from the docs tables (`size.values[].facts.heightPx`). Curation lives in `bundle/components.yaml` and is checked against the SCSS.
- **Examples.** 322 examples come from kern-ux-plain stories (none from the docs), each with its source. 227 are tagged with option values. `variesOver` and `instances` cover stories that show several values at once, and `alsoIn` folds hover, focus and active variants that share markup.
- **States.** They're derived from SCSS selectors, with alternatives (`disabled` or `aria-disabled="true"`).
- **Drift and the report.** These are the most useful parts today. They show unknown classes in stories and docs examples (`kern-accordion-group`, `kern-icon--md`), modifiers no example shows, modifiers no option covers (`uncuratedModifiers`), React binding gaps, and criteria that aren't WCAG 2.2.
- **Licence hygiene.** No docs prose appears anywhere. The docs digest carries only section IDs, German headings and URLs.
- **Icons.** `foundations/icons.json` has 42 names; our hand-coded `VALID_ICON_NAMES` has 39 (`account-circle`, `dehaze` and `language` are missing).

## 2. What the bundle needs before `registry.json` can come from it alone

This table lists every field the server reads from `registry.json` and where the bundle has it:

| `registry.json` field | Read by | From the bundle | Gap |
|---|---|---|---|
| `upstream.package`, `version`, `commit` | `render_page` (CSS version), docs | `index.sources[kern-ux-plain]` | **The pinned commit isn't the release.** The submodule points at `c098170`; the `v2.8.2` tag is `cf2a17b` (our registry has that one). |
| `tokens.colors`, `spacing`, `rawVariables` | `get_tokens` | — | **Missing.** There's no `foundations/tokens.json`. |
| `components[].id` | everything | component `id`, through our alias map | none |
| `title` | tool titles | `title.en` | Some change: `Input Checkboxes`, `Input E-Mail`, `Grid System`. That's fine, but it changes tool titles. |
| `status` | banners and warnings | `status` | `grid` becomes deprecated and `list` experimental (upstream facts, so a migration note). `docs-only` is new to our contract. |
| `docs.excerpt`, `docs.sections` | `get_component_docs` | `knowledge`, `docs` digest | **All text is pending** (`report.text.pending` lists all 46). Today's German excerpt from `COMPONENTS.MD` would disappear. |
| `sources.scss`, `sources.stories` | `get_component_docs` | `implementations.html.sources` | none |
| `htmlCanonical` | the four fallback tools, `get_component_docs` | an example | **No example is marked canonical.** The first example matches today's canonical HTML in 29 of 38 cases, but for `card` it's a 6 KB story. The markup is also minified (see 4.1). |

So the generator needs to deliver, in this order:
1. **The English text.** Run the text step with an API key: `knowledge.summary`, the lists, `similar[].difference`, accessibility `obligation`, and the docs digest summaries. Provenance should be per item, as the design asks; today there's one `*` entry per component.
2. **`foundations/tokens.json`**, pulled forward from K4. Names and groups are enough to replace `registry.tokens`; values and dark values can follow.
3. **A canonical example per component.** It's the one example to show when nothing is asked for: default options, no states, a single instance, the smallest such. Mark it with `"canonical": true`, or name it in a top-level `canonicalExample`.
4. **Pinning to release tags.** Point the submodules at `v2.8.2` and record the tag next to the commit. Regenerate from a submodule checkout: `report.coverage.unverifiedSources` lists all three sources as "not a submodule checkout", and the submodules aren't initialised in the repo.

## 3. What stays in this repo: the code-owned map

The projection is the bundle plus a small map in code, next to `COMPONENT_TOOLS`:

| Ours | Bundle | Note |
|---|---|---|
| `checkbox`, `radio`, `lists` | `checkboxes`, `radios`, `list` | Our tool names stay (`get_checkbox`). |
| `descriptionlist`, `tasklist`, `inputgroup`, `inputtext` … (14 in all) | `description-list`, `task-list`, `input-group`, `input-text` … | These differ only by the hyphen. |
| `layers` | `foundations/utilities.json`, the example from `stories/Layers/Layers.stories.js` | Its ID is `stack`, which is misleading (4.3). |
| `pattern` | `patterns/header.json` examples | |
| `index` | none | It has no tool; drop it. |

The same place later holds the parameter map (`get_button.size` → `button.options.size`) for conformance tests and the coverage matrix.

## 4. Issues in the bundle itself

1. **Minified markup.** Every example is a single line, which causes two problems. Checked-in diffs under `knowledge/` become one-line changes of up to 6 KB, which defeats the reason for checking the bundle in. Our fallback tools would also return one-line HTML (today it's indented). Keep the story's own formatting, normalised: common indentation removed, LF line endings. Tagging works on either.
2. **Accessibility IDs aren't stable.** In 27 places the docs list the same criterion more than once, and the bundle numbers the repeats by position (`info-and-relationships-2`, `-3`). If upstream inserts an entry, the IDs shift. Without `obligation` text, the repeats can't be told apart either. Use one entry per criterion with `obligations: [{ id, en, check? }]`, each obligation ID derived from its source text, for example a short hash of the German requirement.
3. **Example IDs come from export names alone.** The Layers story's `Stack` export became `stack`, and the Stack story then got `stack-stack`. Prefix examples that are merged into foundations with their story file (`layers-stack`).
4. **Enums without a default or a "required" flag.** These are `alert.tone`, `badge.tone`, `button.type`, `heading.size` and `icon.name`. The coverage matrix and conformance tests need to know whether leaving the option out is valid. Give every enum either a `default` or `required: true`. For `button.type`, HTML's own default is `submit`; say so rather than leaving it open.
5. **`classes.json` is 471 KB.** 2,469 of its 2,678 classes are responsive utility variants, and every entry repeats `"entries": ["kern.css"]`. It's for development only, but it's the largest file in the diff. A map from class to owner, or utility families with breakpoint suffixes, would be under 100 KB.
6. **No anatomy or relations yet (K3).** That's as planned. It's worth doing next, though: the per-tool block sets from R5 option B and the R6 composition guide need it, and `component-layouts.md` in kern-ux-plain covers 32 components.
7. **Small things.**
   - The stub patterns use their IDs as titles (`"en": "question-page"`).
   - Utility example IDs are German slugs with a source typo (`flex-hauptachen-ausrichting`). They're fine as IDs; just don't "fix" them later, because that breaks stability.

## 5. Who owns the schema (decided: the generator)

The design had this repo owning the bundle contract (Zod, exported to JSON Schema). The maintainer agreed to change that (decision 6 in [knowledge-bundle.md](knowledge-bundle.md#10-decisions-2026-10-02)):

- **The generator owns the bundle schema.** The bundle has other consumers (`llms.txt`, a React skill), and its 20 KB schema is already detailed, strict and passing. If this repo owned the full schema, every new generator field would need a change here first.
- **This repo owns a consumer contract**: Zod for only the fields it reads, accepting unknown keys, exported as JSON Schema. `knowledge:import` validates against it. The generator's CI validates its output against both its own schema and ours, so a change that would break us fails over there, before an import.
- The rest of the design stays: semver, additive within a major, and a breaking change bumps the major in both repositories.

## 6. What this means for the K phases here

- **K1a: the consumer contract and `knowledge:import`.** Validate, print the diff by component and section, and copy into `knowledge/`. No projection yet. This can start now.
- **K1b: the projection.** Derive `registry.json` from `knowledge/` and the code-owned map, show the parity diff against today's registry, switch over, and retire `registry:import` and `tools/registry/`. This waits on 2.1–2.4.
- **K1c: icons and the unknown-class rule.** Take the icons from `foundations/icons.json` (`VALID_ICON_NAMES` gains three) and add a `validate.ts` rule fed by `classes.json`.
- **K2: the parameter map, the coverage matrix and the conformance tests.** This waits on 4.4.

R5 doesn't wait on any of this. Only its last step does (registry summaries in descriptions, group D), and that needs 2.1.
