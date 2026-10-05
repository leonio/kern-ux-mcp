# Kickoff: roadmap step R7 (prompts)

## Your task

Do **R7** from [roadmap.md](roadmap.md#r7-prompts), the last step before the 2.0.0 release ([roadmap.md](roadmap.md#closing-out-the-alpha)). Three prompts, each a workflow over our tools with the guides embedded and the cards linked ([roadmap.md](roadmap.md#r7-prompts-packagescoresrcprompts)):

- `create_input_form`, which builds a wizard when given `steps`
- `create_page_layout`
- `review_kern_html`

Three groups: the plumbing with the form prompt and the eval's prompt support (A), the other two prompts (B), then the checks, docs and the full eval (C). One commit per box, and a pause for review after each group.

## Decisions (confirmed 2026-10-05)

1. **Where:** `packages/core/src/prompts`, like `resources/`: a definition type, `registerKernPrompts(server, prompts)`, and the definitions in the catalog, built once.
   - Capability `prompts: { listChanged: false }`. `prompts/list` already has the release cache hint (`create-server.ts`). `prompts/get` isn't cacheable on 2026-07-28, so it has none.
2. **What a prompt returns**, all as user messages, one content block each:
   - **The workflow** (text): which tools, in what order, which rules, built from the arguments. It ends with "return the final HTML verbatim, not a description of it", which settles R5.1's open question on long results.
   - **The guide** (an embedded `resource`, the same text as `resources/read`): forms for `create_input_form`, layout for `create_page_layout`, accessibility for `review_kern_html`. They're 7.6K, 6.9K and 12.1K characters.
   - **The cards** (`resource_link`s), a fixed set per prompt, since `fields` and `sections` are free text:
     - `create_input_form`: `inputtext`, `textarea`, `select`, `checkbox`, `radio`, `fieldset`; with `steps` also `tasklist`, `progress`, `summary`.
     - `create_page_layout`: `kopfzeile`, `heading`, `grid`, `card`, `link`.
     - `review_kern_html`: none; the guide lists every rule.
   - **`strict` is the render tools' argument**, not `validate_html`'s (it has none): `strict: true` makes a validation error fail the render call with the issues. The workflows render with `strict: true` and call `validate_html` on HTML that changed after rendering, and on the HTML `review_kern_html` is given.
3. **Arguments** are strings, as MCP requires. `locale` is `de` or `en`, default `de`. It decides the language of the UI text and is passed to every tool call. The prompt text itself is English, our base language.
   - **Completion:** `completable(z.enum(["de", "en"])).optional()`. The SDK only unwraps `.optional()` to find the completer, not `.default()`, so the default is applied in code. `completable()` marks the schema it's given, so the locale schema is built once and shared.
   - `create_input_form`: `purpose`, `fields` (e.g. "Vorname, Nachname, E-Mail, Geburtsdatum"), `steps?` (e.g. "Persönliche Daten; Fahrzeug; Prüfen und Absenden"), `locale?`
   - `create_page_layout`: `purpose`, `sections?`, `locale?`
   - `review_kern_html`: `html`, `locale?`. `html` reuses `VALIDATE_HTML_MAX_LENGTH` (500,000): the prompt passes it to `validate_html`, so a looser limit would accept HTML its first tool call rejects.
4. **The eval sends the prompt's text, not a slash command.** The harness gets the prompt with `prompts/get` from the built server, joins the messages (the guide inline, each link as a line) and sends that as the `-p` prompt.
   - **Why not Claude Code's own `/mcp__kern__create_input_form`:** the harness runs with `--disable-slash-commands`, and the free-text arguments have spaces. Whether headless mode runs MCP prompts, and how it splits the arguments, is unknown.
   - **The real client path** is in the release's client check, which already lists "tools, resources and prompts appear and work" in VS Code Copilot, Claude Code and Claude Desktop.
5. **Eval scenarios reuse today's tasks**, so their checks carry over: `create_input_form` with `contact-form` (base) and, with `steps`, `application-flow` (nested); `create_page_layout` with `service-page` (nested); `review_kern_html` with `fix-page` (nested).
   - **The comparison is the same task with and without its prompt, on the same commit.** `r6-d` and `nested-r6-d` ran before the two R6 fixes, which changed form output, so they stay as history only.
   - **Without `--resources`,** like the baselines: the guide is inline, and the card links are lines of text. One extra `--resources` run shows whether the model follows them.
6. **Timing:** the harness change is its own box at the end of group A (A3), so group A is measured before B copies its shape. C9 keeps the full `prompts` suite and the runs.
7. **Three `validate_html` rules go into 2.0** (decided 2026-10-05, after B). `review_kern_html` asks for what the check can't see; three of those things are machine-checkable, and adding error rules after 2.0 could fail HTML that passes `strict: true` today. Box C7.

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

### A. Plumbing, `create_input_form` and the eval

1. **The prompt definition, registration and `create_input_form` without steps.**
   - A definition type: name, title, description, the Zod `argsSchema`, and `messages(args)`.
   - `registerKernPrompts`, the catalog entry and the capability.
   - **`create_input_form`:** map each field to an input type (`field` blocks), group them in `fieldset`s, wrap them in a `form` block with `errorSummary` when it shows errors, set `required` and `optional`, render with `render_composition` and `strict: true`. The forms guide embedded, the field cards linked.
   - Tests on both protocol eras: the list (names, titles, arguments), the messages of a get, an unknown prompt (`-32602`), a missing required argument, `locale` completion. A file snapshot of each prompt's rendered messages.
   - "Prompts" in the migration notes.
2. **`steps`: the wizard.**
   - The workflow becomes a `formFlow` block: the step list (tasklist) and progress, the active step's fields, back and forward buttons, a review step through `get_summary` before the last, and submit on the last step only. `renderAllSteps` when a script should switch steps in the browser.
   - The `tasklist`, `progress` and `summary` cards are added to the links.
3. **The eval renders a prompt.**
   - A scenario can carry `mcpPrompt: { name, arguments }`. The harness renders it with `prompts/get` against the server it tests and sends the joined text (decision 4).
   - A `prompts` suite with `contact-form` and `application-flow`, with their IDs and checks. `--without-prompts` runs the same suite with the tasks' own text: that's the comparison.

### B. The other two prompts

4. **`create_page_layout`:** `render_page` with the header pattern, the sections as `section` blocks with grids and cards, the footer, with `strict: true`. The layout guide embedded, its cards linked.
5. **`review_kern_html`:** `validate_html` on the given HTML, a fix list by rule (the accessibility guide embedded), the content rebuilt with our tools with `strict: true` rather than patched by hand, and the corrected HTML returned verbatim.

### C. Checks, docs and eval

6. **Every name resolves:** each tool name and `kern://` URI in prompts, guides and tool descriptions is one the server serves. A test, with the list of names it found in its snapshot.
7. **Three new `validate_html` rules** (decision 7). Proposed, to confirm before the box:
   - **A field without a label** (error, WCAG 3.3.2 and 4.1.2, level A): an `input` (not `hidden`, `submit`, `button`, `reset` or `image`), `select` or `textarea` has a `<label for>`, a wrapping `<label>`, `aria-label` or `aria-labelledby`. A placeholder doesn't count. `form.label_for` only checks the labels that exist.
   - **A table without header cells** (error, 1.3.1, level A): a `table` has at least one `th`, unless it has `role="presentation"` or `role="none"`. `table.th_scope` only checks the `th` cells that exist.
   - **A skipped heading level** (warning, 1.3.1 and 2.4.6): a heading is at most one level deeper than the one before it. The first heading can be any level, since a part of a page may start at `h2`. Not an error: WCAG doesn't require the order.
   - The rule table feeds the accessibility guide and the cards, so they list the new rules too. Every tool's own output must still pass strict validation; the golden tests show it.
   - `review_kern_html` then cites the rule IDs instead of the WCAG criteria for these three.
   - Migration notes: new rules and IDs; HTML that passed `strict: true` before can fail on the two errors.
8. **Docs:** "Prompts" in the README's feature list, the migration notes complete, `codebase-guide.md`.
9. **The full eval:** the `prompts` suite (all four tasks; `service-page` and `fix-page` joined it in B4 and B5) with and without the prompts on the same commit, plus `base` and `nested`. First the delivery check's fix (findings from group A).

## Evals

- **After A:** `npm run eval -- --label r7-a --suite prompts` and `--label r7-a-plain --suite prompts --without-prompts` on the same commit, then `npm run eval:compare -- r7-a-plain r7-a`.
- **After C:** the full `prompts` suite with and without the prompts, plus `base` and `nested` on the same commit, to confirm the new capability changes nothing without a prompt.

## Progress

- [x] Decisions confirmed `4f7f7c4`.
- [x] A1 `392666b`: `prompts/` (definition, `registerKernPrompts`), the catalog entry, the `prompts` capability and `create_input_form` without steps. 28 tests on both eras plus two file snapshots; the migration notes have "Prompts".
- [x] A2 `6d3b8a8`: `steps` builds a `formFlow` block; the `tasklist`, `progress` and `summary` cards join the links.
- [x] A3 `7505e57`: the eval renders a scenario's `mcpPrompt` over stdio (`prompt-text.ts`); the `prompts` suite; `--without-prompts`.
- [x] From the eval: `eb08cb5` and `83d1b82` fix the wizard's step wording (see below).
- [x] Evals after A: [r7-a](r5-eval/r7-a.json), [r7-a-plain](r5-eval/r7-a-plain.json), [r7-a-fix](r5-eval/r7-a-fix.json), [r7-a-fix2](r5-eval/r7-a-fix2.json).
- **Message order:** the guide, then the card links, then the workflow, not the order decision 2 lists. The workflow ends with "Answer with the final HTML … verbatim", so that's the last thing the model reads.
- **Blank optional arguments count as none** (`locale`, `steps`): a client may send `""` for an optional argument left empty. `locale` is a union with `""`, so the SDK still finds its completer under `.optional()`.
- **Checked by hand before writing the text:** a file upload as `get_inputfile` HTML in an `html` block, and a `get_summary` group in the last step of a `renderAllSteps` `formFlow`, both pass strict validation. `get_summary`'s group mode needs `groupTitle`, so the text names it.
- **Tests:** 2,210 pass (2026-10-05).
- **The eval after A** (`r7-a` against `r7-a-plain`: the same suite and server, 3 runs per task; the server shows `+dirty` only for this file):
  - **Both 39/39 and 6/6 strict-valid.** The four checks of `contact-form` and nine of `application-flow` pass either way, so the difference is in the markup and the answers.
  - **Answers:** 6 verbatim with the prompt; 4 verbatim and 2 described without. Without it, two `application-flow` runs used `render_page` and summarised the form in prose, as `nested-r6-d` did.
  - **Markup:** with the prompt every `application-flow` run used `formFlow` with a `get_summary` review, three `autocomplete` tokens and fieldsets; without it one run in three did, with no `autocomplete` and no summary. `contact-form` set `aria-required` on all three required fields in every prompted run, against 1 to 3 without.
  - **Cost:** $0.57 against $0.21, with 11 tool calls against 6 (the `get_summary` call and one retry). About $0.16 of it is the first two runs writing a cold prompt cache (40K tokens each), which the plain runs, started later, read. The prompt adds 2,850 tokens to the first request.
  - **One error:** Claude Code couldn't parse a 4 KB `render_composition` input as JSON; the retry passed. Copying `get_summary`'s HTML into an `html` block makes the input large and escape-heavy.
- **The wizard's steps** (three re-runs of `application-flow`):
  - In `r7-a`, one run added an empty fourth step "Absenden" after "Prüfen und Absenden". A2 said "if the last step isn't for that, add one".
  - `eb08cb5` said "never add a step for the submit button alone": all three `r7-a-fix` runs reached for a fourth step (empty, text-only, `null`). Naming the thing invites it.
  - `83d1b82` says "exactly the steps given" and drops adding a review step: in `r7-a-fix2` two runs rendered three steps, one rendered four and then three on its own. 27/27, 3/3 strict-valid.

### Findings from group A

- **The delivery check takes the largest tool HTML.** A run that renders twice and answers with the second render counts as "edited" (`r7-a-fix2` run 1, `r7-b-fix` runs 1 and 2). Comparing against the last render would fix it; C9 changes it before the full eval.
- **Cold cache:** the first runs of an eval session pay the cache write. Compare cost on runs started in the same order, or run the plain suite first.
- **A `summary` block kind** in `render_composition` would save copying `get_summary` HTML into an `html` block, and the large inputs that come with it. That's a tool change, after 2.0.
- **Small misses:** one `r7-a-fix2` run left out the confirmation checkbox in the review step (no check covers it); one called `get_summary` without `mode` and retried.
- **`r7-b` `fix-page` run 3 edited the rendered HTML** before answering (the answer contains neither render), though it stayed strict-valid.

- [x] B4 `8260a11`: `create_page_layout`. The strict render step, the answer line, numbering and blank arguments moved to `definition.ts`; `create_input_form`'s text didn't change. `service-page` joined the `prompts` suite.
- [x] B5 `1e5ad47`: `review_kern_html`, with `html` up to `VALIDATE_HTML_MAX_LENGTH`. `fix-page` joined the `prompts` suite. The migration notes have all three prompts.
- [x] Evals after B: [r7-b](r5-eval/r7-b.json), [r7-b-plain](r5-eval/r7-b-plain.json).
- **Checked by hand before writing the text:** a `render_page` call with a grid of cards in a section, a form, `get_table` as an `html` block and three disclosures passes strict validation. Card titles default to `h2`, so the page prompt asks for `titleLevel: 3` inside a section.
- **The fix list cites the guide's WCAG criteria,** not rules it doesn't state: the guide has no rule on heading levels or placeholders, but it lists 1.3.1 and 3.3.2 per component.
- **Tests:** 2,237 pass (2026-10-05); the build and e2e pass.
- **The eval after B** (`r7-b` against `r7-b-plain`: `service-page` and `fix-page`, the same server `1e5ad47`, 3 runs each; the plain suite ran first, so it paid the cold cache):
  - **Checks 57/57 with the prompts, 55/57 without.** Without, one `fix-page` run never called `validate_html` and one left the image without `alt`.
  - **Answers:** 5 verbatim and 1 edited with the prompts; 2 verbatim, 1 edited and 3 described without. All six strict-valid either way.
  - **Calls:** 18 against 21; `fix-page` 11 against 14. Cost $0.49 against $0.44; the first request is 4,480 tokens larger (the 12K accessibility guide).
  - **The fix list:** all three `fix-page` runs wrote one in German by rule, including what the check can't see (a skipped heading level, the card in a card). Two wrote it between tool calls and ended with the HTML alone; a client shows both, the eval's final answer only the HTML.
  - **One invalid input each way,** both on `render_page`'s blocks and retried: with the prompt, three `section` blocks without their `section` object.
- [x] After B: `db9d5f9` asks for the fix list once, after the rebuild. Eval: [r7-b-fix](r5-eval/r7-b-fix.json).
  - **Why:** step 2 asked for the list and the answer line asked again. In `r7-b`, two runs wrote it right after `validate_html`, as a plan ("muss hinzugefügt werden"), and answered with the HTML alone.
  - **Now:** step 2 only collects the problems. The answer asks for the list once: per problem its rule, how the rebuild fixed it, and what a person still has to check, such as an `alt` text written without seeing the image.
  - **`r7-b-fix`** (`fix-page`, 3 runs): 33/33, 3/3 strict-valid. All three put the list in the final answer, after the rebuild, and all three flag the invented `alt` text. Two count as "edited", but both answers are their second render verbatim: the delivery check's known artifact.
- [x] C6 `a2a8dc6`: `names.test.ts` scans the wire tool listing, each prompt down each branch, both guides and all 48 cards. Every tool name and `kern://` URI resolves; the snapshot lists 52 tools (all but `get_tokens` and `get_section`) and 18 URIs, without self-mentions.
- [x] C7 `881011a`: `form.field_label` and `table.headers` (errors), `heading.level_skip` (a warning). A label counts only with text; a select's options don't. The new rule caught `get_inputgroup`: no label at all, and no field for one. It now takes a required `label` and renders KERN's `group-with-label` story. The listing is 119,101 of 120,000 characters (+160). `review_kern_html`'s examples of what the check can't see moved to a link made to look like a button (4.1.2) and a vague heading (2.4.6).
- [x] C8 `271599a`: the README's Prompts section (with the VS Code and Claude Code commands, to confirm in the client check), the codebase guide (`prompts/`, `names.test.ts`, `tools/eval`) and the migration notes.
- [x] C9 `214203d`: the eval counts an answer that holds the last render as verbatim; rescored, `r7-a-fix2` and `r7-b-fix` are 3 of 3 verbatim. Then the full eval: [prompts-r7-c](r5-eval/prompts-r7-c.json), [prompts-r7-c-plain](r5-eval/prompts-r7-c-plain.json), [r7-c](r5-eval/r7-c.json), [nested-r7-c](r5-eval/nested-r7-c.json).
- [x] From the eval: `9e80993` quotes the section, grid and card shapes in `create_page_layout`. Eval: [prompts-r7-c-fix](r5-eval/prompts-r7-c-fix.json).
- **Tests:** 2,270 pass (2026-10-05); the build and e2e pass.
- **The full eval** (all on `214203d`, 3 runs per task; the plain suite ran first):
  - **`prompts`, with against without:** 96/96 against 95/96 (without, one `fix-page` run never called `validate_html`). Answers 12 verbatim against 3 verbatim, 3 edited and 6 described. All strict-valid either way. Cost $0.93 against $0.78.
  - **But 6 invalid inputs with the prompts, none without,** all retried:
    - `service-page`, 3 of 3: `section` blocks without their `section` object. Fixed in `9e80993`: in `prompts-r7-c-fix` all three runs passed 8/8 with no error, in 2 calls each.
    - `application-flow`, 2 of 3: an empty fourth step (`null`, or an empty label and no content) after the review step, dropped on the retry. And one `get_summary` call with the single-summary fields. See the findings.
  - **`base` (`r7-c`): 96/96,** 30/30 completed and strict-valid, no errors, as in `r6-d`. The prompts capability and the new rules change nothing there.
  - **`nested` (`nested-r7-c`): 104/105,** 12/12 strict-valid. The miss is a `service-page` run without a select; two `application-flow` answers described the form in prose, as before.
  - **Strict-valid counts** from here on include the three new rules, so they aren't comparable with reports before `881011a`.

### Findings from group C

- **The wizard's empty trailing step** is still there. Since `83d1b82` it's always empty (`null`, or an empty label and no content) and comes right after the step that holds the pasted `get_summary` HTML: 1 of 3 runs in `r7-a-fix2`, 2 of 3 in `prompts-r7-c`. Two rewordings didn't stop it, and every run recovers on the retry. Wording seems the wrong lever; two tool-side options:
  - `formFlow` drops empty trailing steps with a warning instead of rejecting the call (input normalization, as `invoke.ts` does elsewhere)
  - a `summary` block kind in `render_composition`, so the review step doesn't paste HTML (also the JSON-escaping finding from group A)
- **The client commands in the README** (`/mcp.kern-ux.create_input_form`, `/mcp__kern-ux__create_input_form`) follow the clients' documented naming; the release's client check confirms them.
