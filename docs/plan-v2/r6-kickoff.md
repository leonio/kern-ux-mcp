# Kickoff: roadmap step R6 (resources)

## Your task

Do **R6** from [roadmap.md](roadmap.md#r6-resources-packagescoresrcresources): MCP resources for component cards, guides and KERN's reference data, served next to the tools. The spec points that shape the work are in the roadmap's R6 section ("Protocol 2026-07-28"). First, import the knowledge bundle (K1a), because R6 takes everything it says about KERN from there. One commit per box, a pause for review after each group.

## Decisions (2026-10-02)

- **KERN knowledge comes only from the bundle.** The generator (`kern-ux-scraper`) builds everything, including the kern-ux.de docs' German text translated into English ([knowledge-bundle.md](knowledge-bundle.md#10-decisions-2026-10-02), decision 8). This repo consumes it as static JSON under `knowledge/`. Nothing in R6 reads KERN knowledge from today's `registry.json`.
- **Facts about our own tools come from code:** the fields from the Zod schemas, examples our templates render, the validation rules, the composition rules, our tool notes, the page shell. They describe this server, not KERN.
- **No `/schema` resources.** They served the dropped compact profile; every input schema already reaches the model in `tools/list`.
- **Measured with an eval** that allows Claude Code's resource tools (C10).

## Where things stand

- **Branch:** `feat/v2-alpha`, R5 and R5.1 done. 54 tools, listing 115,556 characters. Resources don't add to the listing.
- **Clients:** VS Code Copilot and Claude. In both the user attaches resources; Claude Code also gives the model built-in tools to list and read them.
- **SDK v2.1** has what R6 needs: `registerResource` with a per-resource `cacheHint`, `ResourceTemplate` with `list` and `complete`, and `ResourceNotFoundError` (`-32602` with `data: { uri }` on every protocol revision). List cache hints are already set in `create-server.ts`.
- **The bundle** (0.2.0, `kern-ux-scraper/kern-knowledge/`): 46 components and three example files.
  - **Has:** identity (English and German titles, status, group), German synonyms, links (docs page, Figma, source), the docs' section headings with deep links, `similar`, `states`, WCAG criteria per component, examples with markup, HTML and React implementations, drift, and `foundations/` icons, classes and utilities.
  - **Arrives with the next generator runs:** the English text (summary, when to use, do's and don'ts, section text), `foundations/tokens.json`, a canonical example per component, pinning to the `v2.8.2` tag. Each re-import fills the matching parts of R6; none blocks it.
  - **Uses KERN's IDs** (`input-text`, `task-list`, `checkboxes`, `list`), not ours (`inputtext`, `tasklist`, `checkbox`, `lists`).

## Plan

### A. Import the bundle (K1a, from R4b)

1. **The consumer contract.** Zod for the fields this repo reads (`index.json`, components, `foundations/`), unknown keys allowed, exported as JSON Schema (decision 6). Plus the code-owned ID map: bundle ID → our component and tool (decision 7 needs it later for K1b anyway).
2. **`npm run knowledge:import -- <path>`.** Validate, print the diff by component and section, copy into `knowledge/`. A test validates the checked-in copy. A loader makes it available in core, bundled like `registry.json`. No projection to `registry.json` yet; that's K1b.

### B. The pipeline and the component cards (R6 boxes 1, 2 and 5)

3. **Registration, cache hints and the test harness.**
   - A resource definition type (URI or template, name, title, description, MIME type, annotations, a pure `read`) and a catalog built once, like `getCatalog()`.
   - `registerKernResources(server)`: capability `resources: {}`, a `cacheHint` of an hour and `public` on every resource.
   - Tests on both eras: `resources/list`, `resources/templates/list`, a read, an unknown URI (`-32602` with `data.uri`), and the cache fields on 2026-07-28.
   - Each resource's content as a file snapshot; a size budget per resource; every HTML block passes `validateHtmlStrict`.
   - The first resource proves the pipeline: `kern://icons`, from the bundle's `foundations/icons.json`.
4. **`kern://components` and the cards.**
   - The index (YAML): ID, title, status, group, tool, and the summary once the bundle has one.
   - `kern://components/{id}` (Markdown), for every bundle component, completed and listed so the pickers show them. From the bundle: titles, status, synonyms, the kern-ux.de link and section links, the knowledge text (when present), the WCAG criteria, similar components, and the canonical example (when marked). From code: the tool, its field digest, our rendered examples, the validation rules that apply, our tool notes, related tools. A component without a tool gets a card without the tool part.
   - Sections whose bundle data is still pending are left out, not shown empty.
5. **`resource_link`s from `get_component_docs`** to the component's card. Model-facing, small.

### C. Guides, reference data, measuring

6. **Guides from code:** `kern://guides/composition` (block kinds, what each container takes, the limits, the cheat sheet, rendered examples) and `kern://guides/forms` (label, hint and error, ids, optional marking, the error summary with group errors).
7. **`kern://guides/accessibility`:** first, the validator's 13 rules move into one table that both `validate.ts` and the guide read. The guide lists each rule with how to satisfy it, next to the WCAG criteria the bundle records per component.
8. **Reference data:** `kern://utilities` from the bundle's `foundations/utilities.json`, `kern://templates/page-shell` from `buildPage`'s document shell, and `kern://tokens` when the bundle has `tokens.json`. `kern://guides/layout` follows the bundle's layout foundations (K4); until then it's left out rather than written from memory.
9. **Docs:** a "Resources" section in the migration notes, the README's feature list, `codebase-guide.md`.
10. **The eval.** An option in the harness that allows Claude Code's MCP resource tools, and one or two scenarios where a card or guide helps (a form with an error summary, a component the model doesn't know well). Compare with and without on the same commit. The base and nested suites stay as they are.

## Progress

- [ ] A1 The consumer contract and the ID map
- [ ] A2 `knowledge:import` and the checked-in `knowledge/`
- [ ] B3 Registration, cache hints, test harness, `kern://icons`
- [ ] B4 `kern://components` and the cards
- [ ] B5 `resource_link`s from `get_component_docs`
- [ ] C6 The composition and forms guides
- [ ] C7 The rule table and the accessibility guide
- [ ] C8 Utilities, the page shell (tokens and layout when the bundle has them)
- [ ] C9 Docs
- [ ] C10 The eval with resources
