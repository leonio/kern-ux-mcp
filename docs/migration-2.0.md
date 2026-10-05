# Migrating from 1.x to 2.0

This file lists what changes for clients and integrators between `@leonio/kern-ux-mcp` 1.1.2 and 2.0.0. It's also the record of *why* the contract looks the way it does, for anyone working on the server later. Each entry says which pre-release first has it. The plan behind these changes is in [plan-v2/roadmap.md](plan-v2/roadmap.md).

**Keep it current.** Every commit that changes the MCP contract (tool names, inputs, outputs, error behaviour, or rendered markup a client may rely on) adds an entry here in the same commit. Commit subjects on `feat/v2-alpha` don't use `!` or a `BREAKING CHANGE:` footer, because GitVersion would bump the major, so this file is where breaking changes are recorded.

Pre-releases go out under the npm dist-tag `alpha`. "Next alpha" means landed on `feat/v2-alpha` but not released yet.

## Breaking changes at a glance

| Change | Since | What to do |
|---|---|---|
| Invalid arguments and strict-mode failures are tool results with `isError: true`, not JSON-RPC errors | 2.0.0-alpha.69 | Read the hint text from the result content |
| An unknown tool fails with JSON-RPC `-32602` "Tool \<name\> not found" | 2.0.0-alpha.69 | Match on the code, not the old "Unknown tool" text |
| `get_fieldset` wraps your own fields: `legend` and `contentBlocks` are required; `includeHint` and `hintText` are gone | next alpha | Pass `field` blocks in `contentBlocks`; use `hint` |
| `get_kopfzeile` renders the upstream Kopfzeile: `title` and `includeNav` are replaced by `label` and `fluid` | next alpha | Use `render_page` for a header with navigation |
| Buttons render `type="button"` unless you ask for `type: "submit"` | next alpha | Set `type: "submit"` on a button that should submit its form |
| A button with `size: "small"` renders KERN's `kern-btn--small` (40 px), not `kern-btn--x-small` (32 px) | next alpha | Ask for `size: "x-small"` if you want the 32 px button |
| Block content rejects nested forms, a card directly in a card, and a section or disclosure without content | next alpha | Restructure; the error names the path |
| `formFlow`: `heading` is the form heading; the step list has its own `tasklistHeading` | next alpha | Set `tasklistHeading` if you relied on `heading` for the step list |
| Text in labels, hints, errors, values and option text is escaped | next alpha | Don't pass markup in these strings |
| `get_index` is gone | next alpha | Nothing: it rendered a placeholder for an internal SCSS file, not a KERN component |
| `get_section`, `get_card`, `get_card_group`, `get_grid`, `get_disclosure` and `get_fieldset` take only `text`, `html`, `badge` and `field` blocks | next alpha | Build nested layouts (cards in a section, a grid in a disclosure, buttons in a card's body) with `render_composition` or `render_page`; put card actions in `footer` |
| `get_grid`, grid blocks, `get_card_group` and `render_page`'s footer render `kern-grid` instead of `kern-row` and `kern-col-*` | next alpha | Update CSS or scripts that select `.kern-row` or `.kern-col-md-*` in our markup |
| `get_component_docs` returns KERN's guidance in new fields (`summary`, `whenToUse`, `dos`, `docs`, …); `excerpt`, `sections` and `files` are gone, and `canonicalHtml` comes only for `details`, `search`, `layers` and `pattern` | next alpha | Read the new fields; call the component's `tool` for its markup |

## Protocol and errors (2.0.0-alpha.69)

- The server runs on the MCP TypeScript SDK v2 and speaks protocol **2026-07-28**. It still serves 2024-11-05 through 2025-11-25 clients.
- **Invalid arguments** and **strict-mode validation failures** come back as tool results with `isError: true`. The text starts with `Input validation error: Invalid arguments for tool <name>:`, followed by the same hint as in 1.x. In 1.x these were JSON-RPC errors, which most models never see. Now a model can read the hint and correct its call.
- An **unknown tool** is rejected with JSON-RPC `-32602` "Tool \<name\> not found".
- `serverInfo.version` is the package version. In 1.x it was always `0.1.0`.
- On 2026-07-28, `tools/list`, `prompts/list`, `resources/list`, `resources/templates/list` and `server/discover` can be cached for one hour (`public`).

## Tool listing (2.0.0-alpha.69)

- Every tool has a `title` and `annotations` (`readOnlyHint`, `idempotentHint`, `openWorldHint: false`). The tools only generate or check markup.
- Every tool advertises an `outputSchema`. Successful results add `structuredContent`, next to the unchanged JSON text block.
- New tools from the KERN 2.8.2 registry: `get_details` and `get_search`. 1.1.2 had 52 tools; alpha.69 has 54.
- `validate_html.html` accepts at most 500,000 characters.

## Packages and distribution (2.0.0-alpha.69)

- `@leonio/kern-ux-mcp` stays the stdio server, with the same `kern-ux-mcp` bin and Node `>=24.16.0`. It's now one bundled file. Its dependencies are `@modelcontextprotocol/server` (replacing `@modelcontextprotocol/sdk`), `node-html-parser` and `zod`. `fast-glob` no longer installs.
- **New:** `@leonio/kern-ux-mcp-http`, a Streamable HTTP server (`kern-ux-mcp-http` bin), configured through `HOST`, `PORT`, `KERN_ALLOWED_HOSTS`, `KERN_ALLOWED_ORIGINS`, `KERN_AUTH_TOKEN`, `KERN_RATE_LIMIT` and `KERN_CORS_ORIGINS`. See the [README](../README.md).
- **New:** the container image `ghcr.io/leonio/kern-ux-mcp-http`, for amd64 and arm64.
- **New:** an MCP Bundle (`kern-ux-mcp-<version>.mcpb`) attached to each GitHub release, for Claude Desktop.
- npm packages are published with provenance and ship a CycloneDX SBOM.

## Tool list (next alpha)

- **Code decides which tools exist, not the registry.** In 1.x and alpha.69, every component in `registry.json` became a `get_<id>` tool, so regenerating the registry could add or remove tools. That's how `get_details` and `get_search` arrived with KERN 2.8.2, and how `get_index` came from `_index.scss`, an internal partial. Now a table in code lists the 54 component tools; a registry component outside it is documented by `get_component_docs` but has no tool.
- `get_index` is removed: 54 tools.
- `get_heading`, `get_label`, `get_preline`, `get_subline` and `get_title` no longer return the warning "No canonical story template extracted for …" on every call. It was a diagnostic from the registry generator.
- `get_component_docs` takes `reviewedGuidance` (notes about where our tools differ from upstream KERN) from code instead of the registry. Its shape is unchanged. The Kopfzeile notes now describe the real Kopfzeile; alpha.69 still called the tool a placeholder.
- `list_components_by_category` no longer lists `index`. It reports `strategy: "interactive"` for `inputdate`, `inputemail`, `inputfile`, `inputgroup`, `inputnumber`, `inputpassword`, `inputtel`, `inputurl` and `tasklist`, whose tools have full schemas; it said `"fallback"`.

## Smaller standalone block tools (next alpha)

- `get_section`, `get_card`, `get_card_group`, `get_grid`, `get_disclosure` and `get_fieldset` take **simple blocks only**: `text`, `html`, `badge` and `field`. Each of them used to list the full recursive block union, 12.5K characters of JSON Schema per tool. Without it the listing shrinks from 201K to 143K characters.
- Containers still nest in `render_composition` and `render_page`, which take every block kind. A `section`, `card`, `grid`, `disclosure` or `fieldset` block there holds any block, as before.
- A container block sent to one of the six tools is rejected. The hint names the tool and points at `render_composition`.
- Why: the R5 baseline (Haiku 4.5, ten scenarios, three runs each) sent composite tasks to `render_page` and `render_composition`. The six tools got 5 calls in 30 runs, all `get_fieldset` with field blocks only.

## English descriptions (next alpha)

- English text for:
  - the 13 form-field tools: `get_inputtext`, `get_inputdate`, `get_inputemail`, `get_inputnumber`, `get_inputpassword`, `get_inputtel`, `get_inputurl`, `get_inputfile`, `get_inputgroup`, `get_textarea`, `get_select`, `get_checkbox` and `get_radio`
  - the layout and typography tools: `get_grid`, `get_descriptionlist`, `get_divider`, `get_fieldset`, `get_kopfzeile`, `get_body`, `get_heading`, `get_label`, `get_link`, `get_lists`, `get_preline`, `get_subline` and `get_title`
  - the tools that return KERN's example HTML (`get_details`, `get_layers`, `get_pattern`, `get_search`), and `get_utility_reference`, `get_tokens` and `list_icons`
  - the interactive tools: `get_accordion`, `get_alert`, `get_badge`, `get_button`, `get_card`, `get_dialog`, `get_dropdown`, `get_icon`, `get_loader`, `get_progress`, `get_summary`, `get_table` and `get_tasklist`
  - the composition tools: `get_section`, `get_card_group`, `get_disclosure`, `render_composition` and `render_page`, and the block schema they share
  - `get_component_docs`, `list_components_by_category` and `validate_html`. `validate_html`'s `locale` is described as what it is: ignored, because the messages come in both languages.
  - the parameters every tool shares: `locale`, `strict`, heading levels, grid columns, sizes and icons

  Names, types and defaults are unchanged. The tool descriptions no longer say "(Komposition)"; `get_section` says it's a composition helper of this repo, and `get_disclosure` points at `get_accordion` with mode `group` for several items.
- These tools' input schemas no longer have a top-level `description`; it repeated the tool description. Their advice on when to use a component (a select or radios, a textarea or a text input) is gone too. It will come from the KERN knowledge bundle.
- The tool descriptions say what each tool renders and what it leaves out, for example that `get_heading` uses `kern-heading-medium` at every level. They no longer carry a category such as "(Foundational/Layout)".
- `get_pattern` points at `render_page` for a page with header and footer.
- Descriptions no longer carry example payloads (`get_button`, `get_card_group`, `get_dialog`, `get_disclosure`, `get_heading`, `get_icon`, `get_section`, `get_select`, `get_tasklist`, `render_page`). The invalid-input hints keep their known-good payloads, and `render_page`'s hint now has one too.
- The block schema's error messages are in English: "Blocks nest at most 4 levels deep.", "At most 60 blocks in all.", "Set contentBlocks or paragraphs." (`get_section`), "Set contentBlocks or content." (`get_disclosure`) and "Add at least one block." (`render_composition`). A client that matched the German messages needs updating.
- `render_composition`'s cheat sheet states the limits (4 levels, 60 blocks).
- `get_accordion` renders a group when it gets `items` without `content`, whatever `mode` says. Why: in the R5 evals the most frequent error was `items` sent with `mode: "single"` or no mode, which failed on the missing `title` and `content`.
- `get_select` options accept `label` as well as `text`, and the options of a `field` block accept `text` as well as `label`. Why: the R5 baseline's only errors were `field` options written in `get_select`'s shape.
- An unknown icon name now fails with "Unknown icon name. Did you mean arrow-forward?" when a close name exists (`arrow_forward`, or `trash` for `delete`). It used to say "Invalid icon name. Use list_icons for allowed names."
- A `disclosure` block takes `content` (and `contentIsHtml`) like `get_disclosure`, as one text or html block. Why: in the R5 baseline a `disclosure` block sent with `content` failed, because only the tool accepted it.
- The model-facing listing shrinks from 143K to 116K characters.

## Tools and block content (next alpha)

**New**
- `render_page` renders a whole page in one call: a skip link, an optional Kopfzeile, a header with navigation, `<main>` with an `h1` and content blocks, and a footer with up to four link columns. `document: true` returns a complete HTML5 document that loads the KERN CSS from jsDelivr, pinned to the KERN version the registry describes.
- Three block kinds for `render_composition`, `render_page` and the other block tools:
  - `field`: any form field (text, email, tel, url, number, date, password, textarea, select, radio, checkbox)
  - `fieldset`: a legend, hint and group error around fields
  - `form`: `<form novalidate>` with an **error summary collected** from the fields' `error` messages, and an actions row
- `formFlow` has `renderAllSteps`, which renders every step and hides the inactive ones, for a script to switch between them.
- Checkbox group items accept a `value`. They used to submit "on".

**Changed**
- `get_fieldset`, `get_kopfzeile`, buttons and `formFlow`, as in the table above. `formFlow` steps render inside a `<form>`, and their buttons use KERN's `kern-btn` classes. In 1.x they used `kern-button`, which KERN doesn't have. Without `renderAllSteps`, "next" submits the step.
- **Nesting rules.** The block schema rejects what used to render wrongly or fail later:
  - a `form` or `formFlow` inside a `form` or `formFlow`
  - a `card` directly inside a `card`
  - a `section` with neither `contentBlocks` nor `paragraphs`, and a `disclosure` with neither `contentBlocks` nor `content`

  The error reports the exact path. A tool's own container counts too: `get_card` rejects a card among its blocks. A section without content gets a hint: put the blocks that belong under its heading into its `contentBlocks`, not after the section.
- **Depth.** A tool's own blocks are depth 1, and the limit (4) means the same in the schema and the renderer. In 1.x, blocks past the limit could still render.

## Rendered markup (next alpha)

- Buttons (`get_button` and button blocks) take KERN 2.8's five sizes: `x-small`, `small`, `default`, `large` and `x-large`. KERN 2.8.0 added `small`, `large` and `x-large`. Until now `small` was an alias that rendered `kern-btn--x-small`; it now renders `kern-btn--small`.
- A button label hidden with `labelVisibility: "sr-only"` or `"sr-only-mobile"` keeps `kern-label`: `<span class="kern-label kern-sr-only">`, as in KERN's markup. It used to render `kern-sr-only` alone.
- Every nesting the schema accepts renders. In 1.x some were dropped with a warning: standalone `get_grid` dropped sections and disclosures, a grid inside a grid lost its sections, and a card inside a card lost its grids.
- Model-supplied text is HTML-escaped in the text-like input (text, email, date, number, tel, url, password), select, radio, file, input-group and tasklist templates. In 1.x a `&` or `<` in a label broke the markup there. Checkbox and textarea already escaped.
- The same now holds for `get_body`, `get_heading`, `get_label`, `get_link` (text and `href`), `get_lists`, `get_preline`, `get_subline`, `get_title`, `get_descriptionlist`, `get_badge` and badge blocks, `get_loader`'s `srText` and a grid's `headingText`. Their text is plain text: markup in it now shows as text. Use an `html` block or `get_table`'s `isHtml` where markup is meant.
- A grid inside a container (`render_page`'s `<main>`, a grid column) renders without a second `kern-container`. `containerFluid` is ignored there, with a warning.
- Forms and `formFlow` steps stack their content with `kern-flex kern-flex-col kern-gap-lg`.
- So do `render_page`'s `<main>` (its `h1` and blocks) and `render_composition` with more than one top-level block, which wraps them in a `<div>` with those classes. A single block renders as before. In 1.x the blocks sat on each other with no space between.
- Where blocks stack, a `button` or `badge` block sits in a plain `<div>`, so the flex column doesn't stretch it to full width. This fixes forms and `formFlow` steps too.
- A form's error summary lists a fieldset's group error too, before the errors of its fields, linked to the group's first input (a radio group's first option).
- No default format hints. `get_inputtext`, `get_inputnumber`, `get_inputemail`, `get_inputtel`, `get_inputurl`, `get_inputdate`, `get_inputpassword` and `get_inputfile` render a hint only when one is given, like `field` blocks. The defaults were generic ("Pflichtformat: vollstaendigen Namen angeben"), and the file input's named a 10 MB limit nobody had set.
- Grids no longer warn "KERN UX has two layout systems…" on every call.
- **No invented `kern-*` classes.**
  - `get_disclosure` and disclosure blocks render KERN's accordion markup, as `get_accordion` does for one item: `details.kern-accordion`, `summary.kern-accordion__header` around a `kern-title`, and `section.kern-accordion__body`. They used an undefined `kern-accordion__item` class and a chevron icon.
  - `formFlow` marks its parts with data attributes instead of classes KERN doesn't define: the wrapper with `data-form-flow`, each step with `data-step`, the step navigation with `data-step-navigation`.

## Validation (next alpha)

- `form.error_id` and `form.error_describedby` check `.kern-error`, the class KERN and the templates use. In 1.x they looked for classes that don't exist and never fired. HTML that passed before can now get these warnings. They are warnings, so strict mode isn't affected.
- A new warning, `class.unknown`, lists the `kern-*` classes KERN doesn't know, such as typos and invented classes like `kern-bg-subtle` or `kern-tabs`. "Known" means defined in kern-ux-plain's SCSS or used in KERN's own examples, from the knowledge bundle. It's one warning per document, and strict mode isn't affected.
- Two new warnings catch the `kern-grid` pitfalls in hand-written markup (see [Layout on CSS Grid](#layout-on-css-grid-next-alpha)). Each comes once per document, and strict mode isn't affected:
  - `layout.grid_in_container`: a `kern-grid` directly inside `kern-container` or `kern-container-fluid`, which removes the container's padding
  - `layout.grid_columns_small`: a `kern-grid` whose column counts all have a breakpoint suffix (`kern-grid-cols-3-md`), so small screens get 12 columns

## KERN knowledge from the knowledge bundle (next alpha)

KERN's facts and text now come from a knowledge bundle built from KERN's three sources (`kern-ux-plain`, the kern-ux.de docs and the React kit), not from the registry this repo generated from `kern-ux-plain` alone.

- **Tool titles follow KERN's names.** Tool names don't change. The titles that do:
  - `get_checkbox`: "KERN Input Checkboxes"
  - `get_radio`: "KERN Input Radios"
  - `get_select`: "KERN Input Select"
  - `get_textarea`: "KERN Input Textarea"
  - `get_inputemail`: "KERN Input E-Mail"
  - `get_tasklist`: "KERN Task List"
  - `get_lists`: "KERN List"
  - `get_grid`: "KERN CSS Grid" (see [Layout on CSS Grid](#layout-on-css-grid-next-alpha))
- **Statuses follow KERN.**
  - KERN deprecates the container grid. `get_grid` renders its replacement, so it has no deprecation banner.
  - KERN marks lists experimental, so `get_lists`'s HTML starts with the experimental banner.
- **`get_component_docs` returns KERN's guidance**, from the bundle, for every component. Its output is new:
  - **Identity:** `componentId`, `kernId` and `title`; `status`, which can be `docs-only`; and `tool`, the tool that renders the component.
  - **Guidance:**
    - `summary`, `whenToUse`, `whenNotToUse` (each with the component and tool to use instead), `dos`, `donts`, `contentGuidelines`
    - `similar`, with each component's tool, or the `name` of one KERN doesn't have
  - **`accessibility`:** only the WCAG criteria KERN's docs leave to the implementation. Those are what the author has to take care of.
  - **`docs`:** the kern-ux.de page, with its URL, summary and sections. Each section has its German heading, a link and an English summary.
  - **Docs-only components** (Tabs, Nav, Header, Notification Banner, Bildwortmarke) get a `note` that KERN doesn't implement them, so there's no tool and no `kern-*` markup.
  - **Kept:** `reviewedGuidance` (the notes about our tools) and `relatedTools`. `relatedTools` now names the tools of similar components, not `get_grid` and `validate_html` for every interactive component.
  - **Gone:**
    - `excerpt`, a German excerpt from `COMPONENTS.MD` for 15 of 44 components
    - `sections`, replaced by `docs.sections`
    - `files`
  - **`canonicalHtml`** is returned only where the component's tool returns it: `details`, `search`, `layers` and `pattern`. For the others, call `tool`.
  - **IDs:** `componentId` takes our IDs (`inputtext`), KERN's (`input-text`, `checkboxes`) and other spellings of either (`InputText`). An unknown ID's error says which IDs it takes.
- **Eighteen tool descriptions end with one line of KERN's guidance.** It's there only where the line changes which tool fits:
  - names that don't say what the component is: preline, subline, details, layers
  - look-alikes: button and link; checkbox, radio and select; heading and title; text field and textarea; number field; loader and progress; accordion; description list

  For example, `get_button` adds "For actions; to navigate to another page, use get_link." The listing grows by about 1.3K characters.
- **Icons come from the bundle.** `list_icons` returns all 42 of KERN's icon names, adding `account-circle`, `dehaze` and `language`. Icon inputs accept the same 42.
- **Fallback tools:** `get_details`, `get_search`, `get_layers` and `get_pattern` return KERN's example markup from the bundle.
  - It's on one line.
  - `get_pattern` no longer includes the story's inline toggle script.

## Layout on CSS Grid (next alpha)

KERN deprecates its container grid (`kern-row`, `kern-col-*`). Its CSS Grid utilities (`kern-grid`) replace it, and our layouts move to them.

- **`get_grid`, grid blocks, `get_card_group` and `render_page`'s footer render `kern-grid`.** No markup of ours uses `kern-row` or `kern-col-*` any more. A grid:

  ```html
  <div class="kern-container">
    <div>
      <div class="kern-grid kern-grid-cols-1 kern-grid-cols-3-md kern-gap-lg">
        <div>…</div>
        <div>…</div>
        <div>…</div>
      </div>
    </div>
  </div>
  ```

  - One column on small screens, `columns` from the md breakpoint (768 px) up, with a 24 px gap (`kern-gap-lg`). A plain `kern-grid` has 12 columns and no gap, so both are set.
  - The grid sits in a `div` of its own. KERN removes a `kern-container`'s padding when a `kern-grid` is its direct child, which would put the content against the screen edge. With a heading, that `div` stacks the heading and the grid (`kern-flex kern-flex-col kern-gap-lg`).
  - Columns are plain `div`s. They were `kern-col-md-{12 / columns} kern-col-sm-12` in a `kern-row`.
  - **Card groups** use the same classes, with the cards as the grid's items: the cards in a row are as tall as the tallest. With a heading, the heading and the grid stack as in a grid. Five cards can now sit in five columns (`columns: 5`); the count is still capped at the number of cards.
  - **An `html` block with a `kern-grid` among its top-level elements** sits in a `div` of its own, so a grid written by hand doesn't take the padding of `render_page`'s `<main>` away.
  - **`render_page`'s footer** puts its link columns on the same classes. The divider, the columns and the note stack with `kern-flex kern-flex-col kern-gap-lg`.
- **`columns` takes any count from 1 to 12**, for grids and card groups. It was 1, 2, 3, 4, 6 or 12.
- **Without `columns`, a grid has one column per `columnsContent` list,** or two without either. Three lists without `columns` used to render two columns and drop the third.
- **`get_grid` is "KERN CSS Grid", without the deprecation banner.** `get_component_docs` for `grid` returns the CSS Grid sections of KERN's utilities page, not the container grid's page.
- **`get_utility_reference` lists `kern-col-{n}`** for an item that spans columns. It listed `kern-col-span-{n}`, which KERN's CSS doesn't define.

## Resources (next alpha)

The server now offers MCP resources: Markdown that a client can attach to a conversation. Nothing changes for clients that don't use them.

- **Capabilities:** `resources`, without list-changed notifications, and `completions`.
- **`kern://components/{id}`:** a card for each registry component, 48 in all. From KERN's docs: title, status, synonyms, summary, when to use it and when not, do's and don'ts, similar components with their tools, the WCAG criteria left to the implementation, and links. From our code: the tool's description, its fields as tables, a rendered example, the validation rules that apply, and our notes on the tool. A docs-only component's card says that KERN doesn't implement it.
- **`kern://guides/{name}`:** `forms`, `layout` and `accessibility`. Each puts what our tools do, with an example, next to KERN's guidance on the topic, quoted section by section. The accessibility guide lists every `validate_html` rule and, per component, the WCAG criteria KERN's docs leave to the implementation.
- **Listing:** `resources/list` has every card and guide, with its title, description and size. `resources/templates/list` has the two templates, and `completion/complete` completes `{id}` and `{name}`.
- **Caching:** on protocol `2026-07-28`, reads carry `ttlMs` of an hour and `cacheScope: "public"`, like the lists.
- **An unknown URI** fails with JSON-RPC `-32602` and `data.uri`, on every protocol version.
- **`get_component_docs`** returns the card's URI in a new `card` field and sends a `resource_link` to it after the JSON text.

## Prompts (next alpha)

The server now offers MCP prompts: workflows over the tools that a user picks in the client, such as a slash command. Nothing changes for clients that don't use them.

- **Capability:** `prompts`, without list-changed notifications. On protocol `2026-07-28`, `prompts/list` can be cached for an hour, like the other lists. `prompts/get` has no cache hint, since its result depends on the arguments.
- **`create_input_form`** (`purpose`, `fields`, `steps`, `locale`): builds a form from a list of fields with `field`, `fieldset` and `form` blocks, rendered by `render_composition` with `strict: true`. Given `steps` (separated by semicolons), it builds a multi-step form with a `formFlow` block instead: the step list, progress, back, next and submit buttons, and a review step with a `get_summary` group before the answers are sent.
- **What a prompt returns:** user messages, one content block each. First the guide it relies on, embedded as a `resource` with the same text as `resources/read`. Then `resource_link`s to the component cards it uses. Last the workflow as text, which asks for the final HTML verbatim in an `html` code block.
- **Arguments** are strings. `locale` is `de` (the default) or `en`, and `completion/complete` completes it. A blank optional argument counts as none.
- **Errors:** an unknown prompt, a missing argument and an invalid `locale` fail with JSON-RPC `-32602`.

## Planned before 2.0.0 (may still change)

These are on the roadmap and not released. Entries move up when they land.
- **More prompts** (R7): `create_page_layout` and `review_kern_html`.
