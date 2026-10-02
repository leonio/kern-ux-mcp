# Kickoff: roadmap step R5.1 (output polish)

## Your task

Do **R5.1** from [roadmap.md](roadmap.md#r51-output-polish-after-r5): the four R4 leftovers that change what tools return, plus two findings from R5 that do the same. R5's measurements are done ([r5-kickoff.md](r5-kickoff.md)), so these changes no longer blur a comparison. One commit per item, a pause for review after each group, and the evals after each group.

## Where things stand

- **Branch:** `feat/v2-alpha`, at `4730c88` plus the docs commit that adds this file.
- **Server:** 54 tools, listing 115,556 characters, budget 120,000 (held at the target).
- **Eval reference:** `english-4` (30/30, 95/96 checks, 0 errors) and `nested-english-4` (12/12, 105/105, 1 error), both at `f380392`.

## Plan

### A. The roadmap's four boxes

1. **The grid warning.** `grid.ts` warns "KERN UX has two layout systems…" on every grid. The unconditional one goes. (The plan said a warning for columns that don't divide 12 already existed. It did, but it was unreachable; see A1 below.)
2. **No default format hint.** `get_inputtext` and the other text-like tools add a hint when none is given: "Pflichtformat: vollstaendigen Namen angeben (zum Beispiel Max Mustermann)" for text, and similar ones for number, email, tel, url, date and password. The `field` block already passes `defaultHint: false`. All of the defaults go, so the tools and the blocks render the same field (open question 1).
3. **Spacing between blocks.** A form already stacks its content with `kern-flex kern-flex-col kern-gap-lg`. `<main>` and `render_composition` with more than one top-level block get the same stack. Check against KERN's own page examples before choosing between classes on `<main>` and a wrapper `<div>`.
4. **A fieldset's group error in the error summary.** `withErrorIds` collects field errors only. A fieldset's `error` joins the summary in document order, linked to the group's first input. For a radio or checkbox field, that's its first option's input.

### B. Findings from R5

5. **Escaping.** `get_body`, `get_heading`, `get_label`, `get_link`, `get_lists`, `get_preline`, `get_subline`, `get_title` and `get_descriptionlist` put the model's text into the HTML unescaped, and `get_link` does the same with `href`. So does the grid's `headingText` (found in A1); B5 sweeps every template, not only these. Their schemas describe the input as plain text, so the templates escape it, as the text block and the form templates already do.
6. **`get_button` with `sr-only`.** The label's class becomes `kern-sr-only` instead of `kern-label`; KERN's markup keeps both (`<span class="kern-label kern-sr-only">`). Same for `sr-only-mobile`.

Each item adds a migration-notes entry under "Rendered markup".

### C. Evals

After A and after B: `npm run eval` and `--suite nested`, compared with `english-4` and `nested-english-4`. The checks are substring checks, so A2 (hints) and A3 (spacing) should change no check; a change there means a transcript to read.

## Open (for the maintainer)

1. ~~**Which default hints go?**~~ **Decided 2026-10-02:** all of them, so the tools and the `field` block render the same field.
2. ~~**Long results described instead of pasted.**~~ **Decided 2026-10-02:** left as it is for now. The HTML is in the tool result either way; revisit with the prompts (R7). In the evals Haiku describes the page instead of pasting it in 4–5 of 30 base answers and 5–6 of 12 nested ones.

## Progress

- [x] A1 `6548a39`: the grid warning goes. Columns that don't divide 12 fail validation, and that hint names `kern-grid kern-grid-cols-5`. The "can't be represented evenly" warning and the column count inferred from `columnsContent` were unreachable, because `columns` defaults to 2; both went too.
- [x] A2 `befa244`: no default format hints on the eight input tools, `get_inputfile` included: its default named a 10 MB limit nobody had set. `get_inputtext`'s description stops promising the generic hint.
- [x] A3 `948276a`: `<main>` gets `kern-flex kern-flex-col kern-gap-lg`, and `render_composition` wraps several top-level blocks in a `<div>` with those classes. In a stack, `button` and `badge` blocks sit in a plain `<div>`.
- [x] A4 `46076fd`: a fieldset's group error is in the error summary, before its fields' errors, linked to the first field at any depth (a radio group's first option). `withErrorIds`'s walk became `mapBlocks`.
- [x] Evals after A: [r5-eval/r51-a.json](r5-eval/r51-a.json), [r5-eval/nested-r51-a.json](r5-eval/nested-r51-a.json)

| | english-4 (`f380392`) | r51-a (`46076fd`) | nested-english-4 (`f380392`) | nested-r51-a (`46076fd`) |
|---|---|---|---|---|
| Completed | 30/30 | 30/30 | 12/12 | 12/12 |
| Checks | 95/96 | 96/96 | 105/105 | 105/105 |
| Error results | 0 | 2 | 1 | 1 |
| Strict-valid answers | 30/30 | 30/30 | 12/12 | 12/12 |
| Answers: verbatim / edited / described | 21 / 4 / 5 | 18 / 8 / 4 | 5 / 2 / 5 | 4 / 2 / 6 |

None of the errors comes from group A:
- `outage-status`: input that wasn't JSON. Haiku put about 2.6K of hand-escaped alert HTML into a `render_composition` call, then switched to `get_section`.
- `icon-toolbar`: the icon name `arrow-download`; the hint pointed at `list_icons`, and the retry used `download`.
- Nested `service-page`: again a section as a bare heading, with its content as siblings (also in nested-english-4). The retry put the content inside.

Learned in A:
- **Check that a warning can fire.** The plan relied on a grid warning that the schema's default made unreachable. A test that renders the case would have shown it.
- **A flex column stretches inline elements.** `kern-btn` and `kern-badge` are `inline-flex` without a width, so in any stack they became full-width. The forms had this since R4; no test looked at a button block in a form.
- **KERN has no page-level spacing to copy.** Its showcase page spaces sections with `<br>`. The repo's form stack is the convention now.
- **A recurring error to fix:** "A section needs contentBlocks or paragraphs." In two nested evals in a row Haiku used a section as a heading and put its content after it. The message could say to put the blocks that follow into the section's `contentBlocks`.
- [x] `b9162b6`: refactor first. Sixteen templates had their own copy of `escapeHtml`, identical to `escape.ts`'s; they import it now. No output change.
- [x] B5 `f93f3bc`: the nine typography tools and `get_link`'s `href` escape the model's text. The sweep of every template found three more: badge text (`get_badge` and badge blocks), `get_loader`'s `srText` and the grid's `headingText`. One test gives all twelve fields the same markup.
- [x] B6 `7f1ca2a`: a hidden button label renders `kern-label kern-sr-only` (or `kern-sr-only-mobile`), as KERN's button markup does: 59 and 45 uses in KERN 2.8.2, against 7 bare ones elsewhere. The dialog's close button keeps `kern-sr-only` alone, as KERN's dialog does.
- [x] Evals after B: [r5-eval/r51-b.json](r5-eval/r51-b.json), [r5-eval/nested-r51-b.json](r5-eval/nested-r51-b.json)

| | r51-a (`46076fd`) | r51-b (`7f1ca2a`) | nested-r51-a (`46076fd`) | nested-r51-b (`7f1ca2a`) |
|---|---|---|---|---|
| Completed | 30/30 | 30/30 | 12/12 | 12/12 |
| Checks | 96/96 | 96/96 | 105/105 | 103/105 |
| Error results | 2 | 1 | 1 | 3 |
| Strict-valid answers | 30/30 | 30/30 | 12/12 | 12/12 |
| Answers: verbatim / edited / described | 18 / 8 / 4 | 25 / 3 / 2 | 4 / 2 / 6 | 5 / 2 / 5 |

None of it comes from group B, which doesn't change whether anything renders:
- Three of the four errors are input that wasn't JSON (a `render_page` and twice the same `render_composition`), rejected by the client before the server.
- The fourth is the section used as a bare heading, the third nested eval in a row.
- The two failed checks are both `fix-page`: one run didn't call `validate_html` (the nested baseline's failure too), and one rebuilt the broken page's `kern-button` link as a plain link, so one `.kern-btn` instead of two.

Learned in B:
- **Sweep, don't list.** The findings named nine templates; a grep over every interpolation found three more. A test that feeds the same markup to every text field is cheap and catches the next one.
- **Check KERN before "fixing" towards it.** The button and the dialog render hidden labels differently in KERN itself; counting KERN's own uses settled which one each follows.
- **Unparsable input is now the most common error.** Five of the nine errors in R5.1's four evals were input the client couldn't parse, all in long calls with nested HTML in strings. It's Haiku's JSON, not our schema, but large `html` blocks make it likelier.

## Where R5.1 ended

All six boxes are done. Open for later:
- **The section error message** (recurring): "A section needs contentBlocks or paragraphs." could say to put the blocks that follow into the section's `contentBlocks`.
- **Grid column inference:** `columns` defaults to 2, so three column arrays without `columns` render two columns and drop the third, with a warning. No eval run hit it.
