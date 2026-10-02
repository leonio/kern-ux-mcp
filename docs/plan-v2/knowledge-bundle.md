# The KERN knowledge bundle: what the generator writes, and how this repo builds tooling from it

Draft for review, 2026-10-02. It replaces the "what to add" and "how to generate" parts of [registry-requirements.md](registry-requirements.md) (sections 3, 5 and 6), which assumed two sources. The generator now reads three:

- **`kern-ux-plain`**: the HTML/CSS implementation
- **`technische-dokumentation`**: the kern-ux.de docs source
- **`kern-react-kit`**: a third-party React implementation

All three live under `kern-ux-scraper/kern-ux/`.

This is analysis and design only. Nothing here changes tools yet; examples of gaps (Button sizes) are illustrations of what the bundle would surface.

## 1. The idea

The generator writes a **knowledge bundle**: one English JSON document per KERN component, plus patterns, foundations and a report.
- Each component document describes the component **independently of any framework**: what it's for, its parts, its options, its states, its accessibility obligations.
- It then says how each implementation **binds** to that description. In HTML, an option is a modifier class or an attribute. In React, it's a prop.
- The examples are real markup, and each is tagged with the option values it shows.

In this repo, three things happen with the bundle:
1. **Import.** `knowledge:import` validates the bundle against a contract owned here and checks it in under `knowledge/`. It's for development only and isn't bundled. The import then derives the runtime `registry.json` from it.
2. **Deterministic checks.** Code and tests use the bundle directly: tool descriptions, `get_component_docs`, R6 resources, and conformance tests that render our tools with each example's options and compare the markup.
3. **Agent work.** Skills read one component document at a time, next to our tool's schema, template and the coverage report, and update the tooling one gap at a time.

The same bundle lets the generator repo build other AI outputs (`llms.txt`, a React skill and so on) without this repo being involved.

```
kern-ux-plain ─┐                                   ┌─▶ registry.json (runtime projection, bundled)
technische-    ├─▶ generator ─▶ knowledge bundle ─▶ knowledge:import ─▶ knowledge/ (checked in, dev only)
dokumentation ─┤   (extract → generate English     │        │                │
kern-react-kit ┘    → curate → validate)           │        ▼                ▼
                     └─▶ llms.txt, React skill…    │  conformance and     skills: triage,
                                                   │  coverage tests      tool-sync, a11y-rules…
```

## 2. What each source is good for

| Source | Licence | Authoritative for | Watch out for |
|---|---|---|---|
| `kern-ux-plain` (`@kern-ux/native`) | EUPL-1.2 | Markup and the class API: blocks, elements and modifiers in SCSS. Stories as examples. `component-layouts.md` as anatomy (32 components). Token values, icons, utility classes. `CHANGELOG.md` for when things appeared or were deprecated. | Story names carry the variant (`PrimaryXSmallIconOnly`), not structured args. |
| `technische-dokumentation` (kern-ux.de) | Code EUPL-1.2. **Texts and graphics CC BY-NC-SA** (its licence page) | Front matter: title, description, Figma link. Synonyms and similar components. Usage rules, do's and don'ts, size tables. `accessibility/*.json`: WCAG criterion slug, status, date checked. Foundations pages. Patterns and templates (stubs today). | **Its prose can't be copied** into an EUPL package (non-commercial, share-alike). Facts go in; the English is written fresh from those facts, and nothing is close paraphrase. Example markup is code (EUPL), but prefer the plain stories. |
| `kern-react-kit` (`@publicplan`, 1.3.5) | EUPL-1.2 | Typed props with defaults and JSDoc. The prop-to-class mapping in its source (`variant` → `kern-btn--{variant}`). Compound parts (`Card.Header`). Story `args` and `argTypes`. Its own agent skill. | **It lags behind and differs from plain**: Button has no size prop, and its own `COMPONENTS.md` uses a `text` prop that Button doesn't have. Bindings must come from source, and examples must be rendered to be trusted. |

**Precedence:**
- Markup facts: plain, then React, then docs examples.
- Usage, content rules and accessibility: the docs.
- Props: React source.

Where sources disagree, the bundle reports it (`drift`). It doesn't pick a winner silently.

## 3. Design rules

1. **A framework-neutral spec first; frameworks are bindings.** A KERN component, a React component and one of our tools are three different things. The spec says what the component is; each binding says how one implementation expresses it.
2. **Stable IDs for everything.** That covers components, parts, options, option values, examples and criteria. Mappings and diffs survive regeneration only if IDs don't move.
3. **Facts are extracted; prose is generated from facts.**
   - Extraction is deterministic and comes first.
   - The LLM writes English only from extracted facts, and each text item cites the facts it came from.
   - Text a human has reviewed is never overwritten; when its inputs change, it's marked `stale`.
4. **Examples are verified data.** HTML comes from plain stories. Each example's option tags are derived by parsing its classes and attributes against the bindings, not guessed. React examples are typechecked and rendered to HTML, which must match the HTML binding.
5. **One file per component, small enough to read whole:** about 20 KB at most. Agents load one component, not the bundle.
6. **Versioned and additive.** `bundleVersion` is semver; new fields are optional; a breaking change bumps the major in both repositories.
7. **It never names this repo's tools or parameters.** Mapping KERN options to tool parameters is this repo's job (section 7).
8. **Size limits are part of the contract:** `summary` ≤ 160 characters, list items ≤ 200, and so on. Text that reaches tool descriptions has to fit R5's budget.

## 4. Bundle layout

```
kern-knowledge/
  index.json                  # bundleVersion, generatedAt, generator, sources (version + commit of all three),
                              # components [{ id, title, status, group, file }], patterns, foundations
  components/
    button.json               # one document per KERN component (section 5)
    card.json
    …
  patterns/
    header.json               # composition recipes (section 6)
    question-page.json
  foundations/
    tokens.json               # name, group, value, dark value, meaning
    icons.json                # name, keywords
    utilities.json            # class, group, meaning, example
    classes.json              # every valid kern-* class, with the component or utility it belongs to
    layout.json               # breakpoints, container widths, the 12-column grid, layers
    typography.json           # type scale and the classes that apply it
  report.json                 # coverage per source, drift, stale and unreviewed text, unmapped pages
```

Components the docs describe but no implementation provides (Tabs, Nav, Notification Banner today) still get a document, with `implementations` empty and `status: "docs-only"`. Then a model can say "not in KERN 2.8.2" instead of inventing `kern-tabs`.

## 5. The component document

Shortened example. The English is illustrative, not final copy.

```json
{
  "id": "button",
  "title": { "en": "Button", "de": "Button" },
  "status": "stable",
  "group": "actions",
  "synonyms": { "de": ["Schaltfläche", "Schalter"], "en": ["push button", "action button"] },
  "links": { "docs": "https://www.kern-ux.de/komponenten/button", "figma": "https://www.figma.com/community/file/1624024563231427311" },

  "knowledge": {
    "summary": { "en": "Triggers an action; its label names the action." },
    "whenToUse": [{ "en": "Submitting, confirming or moving to the next step of a process." }],
    "whenNotToUse": [{ "en": "Navigating to another page or inline in running text.", "useInstead": "link" }],
    "dos": [{ "en": "Use one primary button per page." }],
    "donts": [{ "en": "Don't stack buttons vertically when there is room side by side." }],
    "contentGuidelines": [{ "en": "Short labels in sentence case, on one line." }],
    "similar": [{ "id": "link", "difference": { "en": "A link navigates; a button acts on the current page." } }]
  },

  "anatomy": {
    "root": { "id": "root", "html": { "element": "button", "class": "kern-btn" }, "react": { "component": "Button" } },
    "parts": [
      { "id": "icon", "required": false, "position": ["start", "end"], "accepts": [{ "component": "icon" }],
        "html": { "class": "kern-icon", "attributes": { "aria-hidden": "true" } } },
      { "id": "label", "required": true, "accepts": [{ "content": "text" }],
        "html": { "element": "span", "class": "kern-label" }, "react": { "prop": "children" } }
    ]
  },

  "options": [
    { "id": "variant", "kind": "enum", "summary": { "en": "How much weight the action carries." },
      "values": [
        { "id": "primary", "default": true, "summary": { "en": "The main action of a page; use once." } },
        { "id": "secondary", "summary": { "en": "Supports the primary action, e.g. Back or Cancel." } },
        { "id": "tertiary", "summary": { "en": "Actions unrelated to the main task, e.g. sorting." } }
      ],
      "html": { "binding": "modifier", "pattern": "kern-btn--{value}" },
      "react": { "prop": "variant" } },
    { "id": "size", "kind": "enum",
      "values": [
        { "id": "x-small", "facts": { "heightPx": 32 } }, { "id": "small", "facts": { "heightPx": 40 } },
        { "id": "default", "default": true, "facts": { "heightPx": 48 } },
        { "id": "large", "facts": { "heightPx": 56 } }, { "id": "x-large", "facts": { "heightPx": 64 } }
      ],
      "html": { "binding": "modifier", "pattern": "kern-btn--{value}", "omit": ["default"] },
      "react": null },
    { "id": "block", "kind": "boolean", "summary": { "en": "Full width; for mobile layouts." },
      "html": { "binding": "modifier", "class": "kern-btn--block" }, "react": { "prop": "isBlock" } },
    { "id": "labelVisibility", "kind": "enum", "values": [{ "id": "visible", "default": true }, { "id": "sr-only" }, { "id": "sr-only-mobile" }],
      "html": { "binding": "part-class", "part": "label", "pattern": "kern-{value}", "omit": ["visible"] },
      "constraints": [{ "en": "sr-only needs an icon part." }] },
    { "id": "type", "kind": "enum", "values": [{ "id": "button", "default": true }, { "id": "submit" }, { "id": "reset" }],
      "html": { "binding": "attribute", "attribute": "type" }, "react": { "prop": "type" } }
  ],

  "states": [
    { "id": "disabled", "html": { "binding": "attribute", "attribute": "disabled" },
      "guidance": { "en": "Avoid where possible: low contrast, easily mistaken." } },
    { "id": "focus", "html": { "binding": "pseudo", "selector": ":focus-visible" } }
  ],

  "accessibility": [
    { "criterion": "1.1.1", "slug": "non-text-content", "level": "A", "status": "implementation-dependent",
      "obligation": { "en": "An icon-only button carries its name in a kern-sr-only label." },
      "check": { "selector": ".kern-btn:has(.kern-icon) .kern-label", "en": "When the label is visually hidden, it uses kern-sr-only." } },
    { "criterion": "2.1.1", "slug": "keyboard", "level": "A", "status": "passed" }
  ],

  "examples": [
    { "id": "primary-x-small-icon-only",
      "options": { "variant": "primary", "size": "x-small", "labelVisibility": "sr-only" },
      "parts": ["icon", "label"],
      "html": { "markup": "<button class=\"kern-btn kern-btn--primary kern-btn--x-small\">…</button>",
                "source": { "repo": "kern-ux-plain", "path": "stories/Button/ButtonPrimary.stories.js", "export": "PrimaryXSmallIconOnly" } } },
    { "id": "secondary-block",
      "options": { "variant": "secondary", "block": true },
      "html": { "markup": "…", "source": { "…": "…" } },
      "react": { "jsx": "<Button variant=\"secondary\" isBlock>Zurück</Button>", "verified": "rendered", "source": { "…": "…" } } }
  ],

  "relations": { "containedIn": ["card.footer", "dialog.footer"], "usedWith": ["icon"], "patterns": ["question-page"] },

  "implementations": {
    "html": { "package": "@kern-ux/native", "version": "2.8.2",
      "classes": { "block": "kern-btn", "modifiers": ["kern-btn--primary", "kern-btn--secondary", "kern-btn--tertiary", "kern-btn--block", "kern-btn--x-small", "kern-btn--small", "kern-btn--large", "kern-btn--x-large"] },
      "sources": ["src/scss/core/components/_button.scss", "stories/Button/"] },
    "react": { "package": "@publicplan/kern-react-kit", "version": "1.3.5", "import": "import { Button } from '@publicplan/kern-react-kit'",
      "props": [{ "name": "variant", "type": "'primary' | 'secondary' | 'tertiary'", "default": "primary", "option": "variant" },
                { "name": "isBlock", "type": "boolean", "default": "false", "option": "block" },
                { "name": "as", "type": "'button' | 'a'", "default": "button", "summary": { "en": "Renders an anchor with href instead." } }] }
  },

  "drift": [{ "en": "React Button has no size prop (html has five sizes).", "sources": ["kern-react-kit", "kern-ux-plain"] }],

  "provenance": { "knowledge.summary": { "origin": "generated", "reviewed": false, "from": ["docs:komponenten/button.mdx#kurzbeschreibung"], "inputHash": "…" } }
}
```

What each section is for:

| Section | Holds | Why tooling needs it |
|---|---|---|
| identity (`id` … `links`) | Names, status, group, synonyms, links | Tool titles, discovery ("modal" → dialog), status banners, attribution |
| `knowledge` | Generated English: summary, when to use or not, do's and don'ts, content rules, how it differs from similar components | Tool descriptions, `get_component_docs`, R6 cards, choosing between look-alikes |
| `anatomy` | Root and parts, with what each part accepts and its bindings | Composition (which blocks a container takes), the R6 composition guide, structural checks |
| `options` | The component's configurable axes and values, with meaning, defaults, constraints and per-framework bindings | Our tool input schemas mirror these; coverage and conformance tests key on them |
| `states` | Interactive and validation states and how each is expressed | Templates, validation rules, docs |
| `accessibility` | WCAG criterion number, slug, level, status, the author's obligation, and a check hint where one can be checked statically | New `validate.ts` rules, the R6 accessibility guide |
| `examples` | Verified markup (and JSX) tagged with option values and parts, with source | Conformance tests, few-shot examples, cards |
| `relations` | Where it sits (`card.footer`), what it's used with, which patterns use it | Composition rules, prompts, related tools |
| `implementations` | Per framework: package, version, class inventory or props | Bindings; future React tooling |
| `drift` | Where the sources disagree | Deciding what to trust; spotting upstream lag |
| `provenance` | Origin, sources, review state and input hash per generated item | Review, staleness, licence hygiene |

## 6. The other documents

- **`patterns/<id>.json`** are composition recipes: a tree of component IDs, parts and option values, with English intent and rules ("the error summary comes first in the form"). The docs patterns are stubs today (Adresse, Frageseite, Header). Until they fill in, the generator can derive recipes from `component-layouts.md` and plain's `stories/Pattern`. They feed `render_page`, the R6 guides and the R7 prompts.
- **`foundations/*.json`** hold the inventories that are hand-coded in this repo today. `VALID_ICON_NAMES` has already drifted: 39 names here, 42 upstream. The others are `utility-reference.ts`, the token name lists, and a list of all valid `kern-*` classes for an "unknown class" validation rule.
- **`report.json`** is the generator's account of itself:
  - per source: what was found and what wasn't mapped
  - drift between sources
  - text that is stale or unreviewed
  - the diagnostics that today leak into `registry.json` as `warnings`

## 7. How this repo uses the bundle

### Import

`npm run knowledge:import -- <bundle-dir> [--dry-run]` will:
1. Validate the bundle against the contract. The contract is Zod in this repo, exported as JSON Schema for the generator, the same way `registry.schema.ts` works today.
2. Print a diff by component and section ("button: options.size.values +large +x-large").
3. Write the bundle to `knowledge/`, checked in, so upstream changes show up as reviewable diffs.
4. Regenerate `registry.json` from it. That file is the runtime projection: only what the server reads.

This changes the role of what R4b group B built. The bundle becomes the external contract. `registry.json` and `registry.schema.ts` become this repo's internal runtime format, still validated by the existing test. `registry:import` gives way to `knowledge:import`.

### Deterministic consumers (code and tests)

- **The runtime projection** feeds tool titles and status, summaries in tool descriptions (within R5's budget), `get_component_docs`, R6 resources, and the icon, token and utility tools.
- **The parameter map** is code-owned: each tool declares how its parameters map to KERN options, for example `get_button.size` → `button.options.size`. Tool parameter names stay ours and stay stable. The bundle never needs to know them.
- **Conformance tests.** Every example whose option values all map to a tool's parameters is rendered by that tool. The result is compared with the example as normalized DOM: the same elements, classes and relevant attributes, ignoring text and whitespace. A mismatch is a failing test with the example's ID.
- **The coverage matrix** lists, for each component, option and value, whether it's supported, not supported, or not mapped. It's generated by a script and printed. This is the to-do list the skills work from.
- **Size tests** include the projected summaries in the budget.

### Skills and prompts (agent workflows)

Each skill reads a small, known set of files. That's why the bundle is one file per component, with stable IDs.

| Skill | Reads | Does | Output |
|---|---|---|---|
| `knowledge-triage` | The `knowledge/` diff after an import, `report.json`, the coverage matrix | Sorts changes: text only (re-project, no code), new option value, new part, new component, changed accessibility obligation, drift | A worklist, one item per component and change, with the files to touch |
| `tool-sync` | One component document, the tool's schema, template, tests and parameter map | Extends the schema with the option, renders the binding in the template, adds tagged examples to the `examples` table, adds conformance cases, writes the migration-notes entry | One commit per component change, coverage cell turned green |
| `new-tool` | A component document without a tool | Decides between canonical HTML (fallback) and a dedicated tool, then scaffolds the `COMPONENT_TOOLS` entry, schema, template, examples and tests | A proposal first, then the scaffold |
| `a11y-rules` | Criteria with `status: "implementation-dependent"` and a `check` | Turns checkable obligations into `validate.ts` rules with de/en messages and tests | New rules, mapped back to criteria |
| `description-writer` (R5) | `knowledge.summary`, the tool's API text, the budget test | Writes descriptions as API text plus summary, within budget | Description changes with the listing diff |
| `composition` (R5–R7) | `anatomy`, `relations`, patterns | Derives block sets per tool, the cheat sheet, guides and prompt workflows | Schema rules, guide text, prompts |

An illustration, not a task: suppose the next KERN release adds `large` and `x-large` buttons. After the import:
1. `knowledge-triage` sees `button.options.size` gain two values, and the coverage matrix shows `get_button` lacks them.
2. It lists "button: size large, x-large (html: `kern-btn--{value}`)".
3. `tool-sync` extends the enum, the template and the tests, then writes the migration note.
4. Conformance confirms the markup matches the upstream examples.

(Today's `get_button` already lacks `large` and `x-large`; the bundle would show that on the first import.)

## 8. Phases

| Phase | Generator writes | This repo builds | Roadmap |
|---|---|---|---|
| K1 | `index.json`; components with identity, `knowledge`, `accessibility`, `examples` (untagged); `foundations/icons.json` and `classes.json`; `report.json` | The bundle contract, `knowledge:import`, the projection to `registry.json`, summaries in `get_component_docs`, the unknown-class rule, icons from the bundle | R4b |
| K2 | `options` with HTML bindings; examples tagged with options; `states` | The parameter map, conformance tests, the coverage matrix, `knowledge-triage` and `tool-sync` | R4b, then ongoing |
| K3 | `anatomy`, `relations`, patterns | Per-tool block sets checked against the anatomy, the composition guide, `composition` | R5 option B, R6, R7 |
| K4 | Tokens with values, utilities, layout and typography | `get_tokens`, `get_utility_reference` and the R6 guides from the bundle | R6 |
| K5 | React bindings, rendered JSX examples, drift | Nothing required here. Later: JSX output in prompts, or a React tool. The generator can publish a React skill and `llms.txt` from the same data. | after 2.0 |

## 9. Brief for the generator repo

To paste into a session in `kern-ux-scraper`:

> **Goal.** Generate the KERN knowledge bundle described in `kern-ux-mcp/docs/plan-v2/knowledge-bundle.md` from the three sources under `kern-ux/`: `kern-ux-plain` (markup, SCSS, stories, `component-layouts.md`, tokens, icons, CHANGELOG), `technische-dokumentation` (MDX front matter and sections, `accessibility/*.json`, foundations, patterns) and `kern-react-kit` (TypeScript props, prop-to-class mapping, compound parts, stories). Start with phase K1 (identity, knowledge, accessibility, examples; icons and classes; report), then K2 (options with HTML bindings, tagged examples, states).
>
> **Rules.**
> - One JSON document per component, about 20 KB at most, stable IDs for components, parts, options, values, examples and criteria.
> - Extract facts deterministically first. Write English only from extracted facts. Cite sources per text item. Never overwrite reviewed text; mark it stale.
> - **Docs prose is CC BY-NC-SA: don't copy or closely paraphrase it.** Take example markup from `kern-ux-plain` stories (EUPL). Facts (names, classes, criterion IDs, sizes) are fine.
> - Derive example option tags by parsing classes and attributes against the bindings. Typecheck and render React examples before marking them verified.
> - Report disagreements between sources as drift; don't resolve them silently.
> - Never name kern-ux-mcp tools or parameters.
> - Pin all three sources to a version and commit in `index.json`; stop if `kern-ux-plain` and the docs describe different KERN versions.
>
> **Done when.** The bundle validates against the JSON Schema kern-ux-mcp exports (it will publish one for the bundle, as it does for `registry.json` today). Every component page of the docs has a document. Every example in `kern-ux-plain` stories appears in a document. `report.json` lists what couldn't be mapped. A rerun with unchanged inputs produces no diff.

## 10. Open questions

1. **Check the bundle into this repo** under `knowledge/`? Recommended. Upstream changes become reviewable diffs, and skills and tests can read it without the generator. The cost is maybe 1–2 MB of JSON, not shipped in the packages.
2. **The bundle replaces `registry.json` as the external contract**, and `registry.json` becomes the internal runtime projection. Recommended; it keeps the runtime file small while the knowledge grows.
3. **German text.** The docs prose can't be reused. Proposed: English only for generated text. German component names and synonyms stay as facts, and the UI labels in examples come from EUPL code. `get_component_docs` already serves de/en; German knowledge text would need its own generation, and its own review.
4. **The React step needs Node.** The generator is Go; typechecking and rendering React examples need a small Node step in the generator, or can wait until K5.
5. **Option IDs follow KERN's vocabulary, not React's** (`block`, not `isBlock`). Recommended, since the HTML class names are the shared ground.
