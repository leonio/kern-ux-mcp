# Kickoff: roadmap step R7 (prompts)

## Your task

Do **R7** from [roadmap.md](roadmap.md#r7-prompts), the last step before the 2.0.0 release ([roadmap.md](roadmap.md#closing-out-the-alpha)). Three prompts, each a workflow over our tools with the guides embedded and the cards linked ([roadmap.md](roadmap.md#r7-prompts-packagescoresrcprompts)):

- `create_input_form`, which builds a wizard when given `steps`
- `create_page_layout`
- `review_kern_html`

Three groups: the plumbing with the form prompt (A), the other two prompts (B), then the checks, docs and eval (C). One commit per box, and a pause for review after each group.

## Decisions (proposed 2026-10-05, to confirm)

1. **Where:** `packages/core/src/prompts`, like `resources/`: a definition type, `registerKernPrompts(server, prompts)`, and the definitions in the catalog, built once.
   - Capability `prompts: { listChanged: false }`. `prompts/list` already has the release cache hint (`create-server.ts`). `prompts/get` isn't cacheable on 2026-07-28, so it has none.
2. **What a prompt returns**, all as user messages, one content block each:
   - **The workflow** (text): which tools, in what order, which rules, built from the arguments. It ends with "return the final HTML verbatim, not a description of it", which settles R5.1's open question on long results.
   - **The guide** (an embedded `resource`, the same text as `resources/read`): forms for `create_input_form`, layout for `create_page_layout`, accessibility for `review_kern_html`. They're 7.6K, 6.9K and 12.1K characters.
   - **The cards** (`resource_link`s), a fixed set per prompt, since `fields` and `sections` are free text:
     - `create_input_form`: `inputtext`, `textarea`, `select`, `checkbox`, `radio`, `fieldset`; with `steps` also `tasklist`, `progress`, `summary`.
     - `create_page_layout`: `kopfzeile`, `heading`, `grid`, `card`, `link`.
     - `review_kern_html`: none; the guide lists every rule.
3. **Arguments** are strings, as MCP requires. `locale` is `de` or `en`, completed with `completable()`, default `de`. It decides the language of the UI text and is passed to every tool call. The prompt text itself is English, our base language.
   - `create_input_form`: `purpose`, `fields` (e.g. "Vorname, Nachname, E-Mail, Geburtsdatum"), `steps?` (e.g. "Persönliche Daten; Fahrzeug; Prüfen und Absenden"), `locale?`
   - `create_page_layout`: `purpose`, `sections?`, `locale?`
   - `review_kern_html`: `html`, `locale?`. `html` gets a `maxLength`, as the tools' large strings do (the HTTP host's exposure guard).
4. **The eval sends the prompt's text, not a slash command.** The harness gets the prompt with `prompts/get` from the built server, joins the messages (the guide inline, each link as a line) and sends that as the `-p` prompt.
   - **Why not Claude Code's own `/mcp__kern__create_input_form`:** the harness runs headless with slash commands off, and the free-text arguments have spaces. Whether headless mode runs MCP prompts, and how it splits the arguments, is unknown.
   - **The real client path** is in the release's client check, which already lists "tools, resources and prompts appear and work" in VS Code Copilot, Claude Code and Claude Desktop.
5. **Eval scenarios reuse today's tasks**, so their checks and baselines carry over: `create_input_form` with `contact-form` (base) and, with `steps`, `application-flow` (nested); `create_page_layout` with `service-page` (nested); `review_kern_html` with `fix-page` (nested). The comparison is the same task with and without its prompt, against `r6-d` and `nested-r6-d`.

## Where things stand

- **Branch:** `feat/v2-alpha`, R6 done and its two follow-up fixes tested ([r6-handover.md](r6-handover.md)). Nothing is pushed since `d784040`.
  - 54 tools; the listing is 118,941 characters against a 120K budget. Prompts don't count against it: they're in `prompts/list`, not `tools/list`.
  - 2,173 tests pass (2026-10-05).
- **SDK v2.1** has what the prompts need:
  - `registerPrompt` with a Standard Schema `argsSchema`
  - `completable()` for argument completion
  - `GetPromptResult` messages with `resource` and `resource_link` content
- **Resources:** `getCatalog()` builds the card and guide definitions once; a prompt reads a guide through the same `read(name)` as `resources/read`.
- **Tool names in text aren't checked yet.** The roadmap's verification asks that every tool name in descriptions, guides and prompts exists; no test does that today.

## Plan

### A. Plumbing and `create_input_form`

1. **The prompt definition, registration and `create_input_form` without steps.**
   - A definition type: name, title, description, the Zod `argsSchema`, and `messages(args)`.
   - `registerKernPrompts`, the catalog entry and the capability.
   - **`create_input_form`:** map each field to an input type and its tool (`field` blocks), group them in `fieldset`s, wrap them in a `form` block with `errorSummary` when it shows errors, set `required` and `optional`, then `validate_html` with `strict: true`. The forms guide embedded, the field cards linked.
   - Tests on both protocol eras: the list (names, titles, arguments), the messages of a get, an unknown prompt (`-32602`), a missing required argument, `locale` completion. A file snapshot of each prompt's rendered messages.
   - "Prompts" in the migration notes.
2. **`steps`: the wizard.**
   - The workflow becomes a `formFlow` block: the step list (tasklist) and progress, the active step's fields, back and forward buttons, a review step through `get_summary` before the last, and submit on the last step only. `renderAllSteps` when a script should switch steps in the browser.
   - The `tasklist`, `progress` and `summary` cards are added to the links.

### B. The other two prompts

3. **`create_page_layout`:** `render_page` with the header pattern, the sections as `section` blocks with grids and cards, the footer, then `validate_html`. The layout guide embedded, its cards linked.
4. **`review_kern_html`:** `validate_html` with `strict: true` on the given HTML, a fix list by rule (the accessibility guide embedded), the content rebuilt with our tools rather than patched by hand, `validate_html` again, and the corrected HTML returned verbatim.

### C. Checks, docs and eval

5. **Every name resolves:** each tool name and `kern://` URI in prompts, guides and tool descriptions is one the server serves. A test, with the list of names it found in its snapshot.
6. **Docs:** "Prompts" in the README's feature list, the migration notes complete, `codebase-guide.md`.
7. **The eval with prompts:**
   - The harness takes a scenario's `prompt: { name, arguments }` and renders it with `prompts/get` (decision 4).
   - A `prompts` suite: the four tasks of decision 5, with their checks.
   - Run it, and compare each task with its run in `r6-d` or `nested-r6-d`.

## Evals

- **After A:** `npm run eval -- --label r7-a --suite prompts --only contact-form,application-flow` once the harness can render a prompt. That needs box 7's harness change early: it moves into box 1 if you prefer measuring A on its own.
- **After C:** the full `prompts` suite, plus `base` and `nested` to confirm the new capability changes nothing without a prompt.

## Progress

- [ ] A1: the prompt definition, registration and `create_input_form` without steps
- [ ] A2: `steps`, the wizard
- [ ] B3: `create_page_layout`
- [ ] B4: `review_kern_html`
- [ ] C5: every tool name and `kern://` URI in text resolves
- [ ] C6: docs
- [ ] C7: the eval with prompts
