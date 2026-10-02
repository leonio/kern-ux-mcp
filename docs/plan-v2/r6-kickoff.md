# Kickoff: roadmap step R6 (resources)

## Your task

Do **R6** from [roadmap.md](roadmap.md#r6-resources-packagescoresrcresources): MCP resources for component cards, guides and KERN's reference data, served next to the tools. The spec points that shape the work are in the roadmap's R6 section ("Protocol 2026-07-28"). One commit per roadmap box, a pause for review after each group.

## Where things stand

- **Branch:** `feat/v2-alpha`, R5 and R5.1 done. 54 tools, listing 115,556 characters, budget 120,000. Resources don't add to the listing.
- **Clients:** VS Code Copilot and Claude only. In both the user attaches resources (VS Code's context picker, Claude's `@`-mentions); Claude Code also gives the model built-in tools to list and read them.
- **SDK v2.1** has everything R6 needs:
  - `registerResource(name, uri | ResourceTemplate, { title, description, mimeType, annotations, cacheHint }, read)`
  - `ResourceTemplate` with a `list` callback (which puts the template's resources into `resources/list`) and `complete` per variable
  - `ResourceNotFoundError`: `-32602` with `data: { uri }` on every protocol revision, so the not-found code is settled
  - `cacheHints` for the list operations are already set in `create-server.ts` (an hour, `public`)
- **The data:**
  - `registry.json`: 44 components with title, status, a German excerpt from KERN's `COMPONENTS.MD`, sections, canonical HTML, and token *names* (no values). No summaries yet (0 of 44).
  - Code: the Zod input schemas, `TOOL_EXAMPLES` (13 tools), `tool-notes.ts` (reviewed notes on 3 of our tools), `COMPOSITION_CHEAT_SHEET`, `utility-reference.ts`, `VALID_ICON_NAMES`, the 13 `validate.ts` rules (written inline, with de/en messages), and `buildPage`'s document shell.
  - The knowledge bundle (summaries, when to use, anatomy, accessibility, token values) isn't here yet. Its phases K1, K3 and K4 feed R6.

## Plan

Content is built from code and the registry on first read, then kept for the process. Markdown for prose with HTML in fenced blocks, YAML for tabular data (the `yaml` dependency, as decided). English throughout. Code lives in `packages/core/src/resources/`; `create-server.ts` registers it next to the tools.

### A. The pipeline and the component cards

1. **Registration, cache hints and the test harness** (roadmap box 1).
   - A resource definition type (URI or template, name, title, description, MIME type, annotations, a pure `read`) and a catalog built once, like `getCatalog()`.
   - `registerKernResources(server)`: capability `resources: {}`, a `cacheHint` of an hour and `public` on every resource.
   - Tests on both eras: `resources/list`, `resources/templates/list`, a read, an unknown URI (`-32602` with `data.uri`, never an empty `contents`), and the cache fields on 2026-07-28.
   - Each resource's content as a file snapshot, so a review sees what clients get.
   - A size budget per resource (a test, like the listing budget): what a client attaches lands in the model's context.
   - Every HTML block in a resource passes `validateHtmlStrict`.
   - The first resource proves the pipeline: `kern://icons` (YAML).
2. **`kern://components` and the cards** (box 2).
   - The index (YAML): id, title, status, tool, and a one-line summary (the tool description's first sentence until the bundle has summaries).
   - `kern://components/{id}` (Markdown), completed from the registry IDs and listed, so the pickers show all 44:
     - status, tool, summary
     - a YAML field digest from the tool's Zod schema: name, type, required, enum, default, description
     - examples: the `TOOL_EXAMPLES` input and the HTML it renders, generated, so they stay correct
     - canonical HTML from the registry
     - the reviewed notes from `tool-notes.ts`
     - the validation rules that apply (by rule prefix: `button.`, `dialog.`, `form.`, …)
     - related tools
   - A card builder that takes optional knowledge fields, so the bundle's summary, when to use and anti-use cases drop in later without a rewrite.
   - `/schema` per the open question below.
3. **`resource_link`s from `get_component_docs`** (box 5): its result adds a link to the component's card. Model-facing, small.

### B. Guides and reference data

4. **The guides** (box 3), each generated from the code it describes where it can be:
   - `kern://guides/composition`: block kinds, which kinds each container takes (from the schema's rules and the option-B sets), the limits, the cheat sheet, and rendered examples.
   - `kern://guides/forms`: label, hint and error; ids and `aria-describedby`; optional marking; the error summary, with fieldset group errors (R5.1). Examples rendered by the templates.
   - `kern://guides/accessibility`: the 13 rules with their messages and how to satisfy each. First, a small refactor: the rules move into one table that both `validate.ts` and the guide read, so the guide can't drift from the validator.
   - `kern://guides/layout`: container, row and columns, the 12-column rule, CSS grid utilities, spacing and the stack, heading hierarchy, surfaces. Facts checked against the local KERN 2.8.2 source; breakpoint values only if verified there, otherwise they wait for the bundle's K4.
5. **Reference data** (box 4): `kern://tokens` (names today; values with K4), `kern://utilities` (from `utility-reference.ts`), and `kern://templates/page-shell` (`text/html`, from `buildPage`'s document shell).

### C. Measuring and documenting

6. **The eval.** The harness turns off Claude Code's built-in tools, including its MCP resource tools. Add an option that allows them, and one or two scenarios where a guide helps (a form with an error summary, a layout with a sidebar). Compare a run with resources against one without, on the same commit. The base and nested suites stay as they are, so their numbers remain comparable.
7. **Docs:** a "Resources" section in the migration notes, the README's feature list, and `codebase-guide.md`.

## Open (for the maintainer)

1. **`/schema` resources.** Every tool's input schema already reaches the model in `tools/list`, and the card's field digest covers people. I'd drop `kern://components/{id}/schema`: one resource family less to keep, and no loss for the model. The alternative is to keep it for tooling that wants the raw JSON Schema.
2. **KERN's German excerpt in the cards.** The registry's only component knowledge today is the German excerpt from KERN's `COMPONENTS.MD`. I'd include it in the cards, marked as KERN's German notes, until the bundle's English knowledge replaces it. The alternative is English only, which leaves the cards with our API facts and the canonical HTML.
3. **Measuring with resources.** I'd add the harness option and a separate R6 eval label, as in C6. The alternative is to rely on the tests and a manual check in VS Code and Claude Code.

## Progress

- [ ] A1 Registration, cache hints, test harness, `kern://icons`
- [ ] A2 `kern://components` and the cards
- [ ] A3 `resource_link`s from `get_component_docs`
- [ ] B4 The guides (with the rule table refactor first)
- [ ] B5 Tokens, utilities and the page shell
- [ ] C6 The eval with resources
- [ ] C7 Docs
