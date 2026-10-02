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
| Block content rejects nested forms, a card directly in a card, and a section or disclosure without content | next alpha | Restructure; the error names the path |
| `formFlow`: `heading` is the form heading; the step list has its own `tasklistHeading` | next alpha | Set `tasklistHeading` if you relied on `heading` for the step list |
| Text in labels, hints, errors, values and option text is escaped | next alpha | Don't pass markup in these strings |
| `get_index` is gone | next alpha | Nothing: it rendered a placeholder for an internal SCSS file, not a KERN component |

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
- `list_components_by_category` no longer lists `index`. It reports `strategy: "interactive"` for `inputdate`, `inputemail`, `inputfile`, `inputgroup`, `inputnumber`, `inputpassword`, `inputtel`, `inputurl` and `tasklist`, whose tools have full schemas; it said `"fallback"`.

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
  - a `section` with neither `contentBlocks` nor `paragraphs`, and a `disclosure` without `contentBlocks`

  The error reports the exact path. A tool's own container counts too: `get_card` rejects a card among its blocks.
- **Depth.** A tool's own blocks are depth 1, and the limit (4) means the same in the schema and the renderer. In 1.x, blocks past the limit could still render.

## Rendered markup (next alpha)

- Every nesting the schema accepts renders. In 1.x some were dropped with a warning: standalone `get_grid` dropped sections and disclosures, a grid inside a grid lost its sections, and a card inside a card lost its grids.
- Model-supplied text is HTML-escaped in the text-like input (text, email, date, number, tel, url, password), select, radio, file, input-group and tasklist templates. In 1.x a `&` or `<` in a label broke the markup there. Checkbox and textarea already escaped.
- A grid inside a container (`render_page`'s `<main>`, a grid column) renders only its row, without a second `kern-container`. `containerFluid` is ignored there, with a warning.
- Forms and `formFlow` steps stack their content with `kern-flex kern-flex-col kern-gap-lg`.
- `field` blocks get no default format hint. `get_inputtext` still adds one.

## Validation (next alpha)

- `form.error_id` and `form.error_describedby` check `.kern-error`, the class KERN and the templates use. In 1.x they looked for classes that don't exist and never fired. HTML that passed before can now get these warnings. They are warnings, so strict mode isn't affected.

## Planned before 2.0.0 (may still change)

These are on the roadmap and not released. Entries move up when they land.
- **Standalone block tools accept fewer block kinds** (R5). `get_section`, `get_card`, `get_card_group`, `get_grid`, `get_disclosure` and `get_fieldset` get a smaller set suited to each tool, to shrink the tool listing. Deep nesting goes through `render_composition` and `render_page`.
- **English tool and parameter descriptions** (R5). This changes text, not the contract.
- **Resources** (`kern://…`, R6) and **prompts** (R7).
