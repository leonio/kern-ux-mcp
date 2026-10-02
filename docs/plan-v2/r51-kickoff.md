# Kickoff: roadmap step R5.1 (output polish)

## Your task

Do **R5.1** from [roadmap.md](roadmap.md#r51-output-polish-after-r5): the four R4 leftovers that change what tools return, plus two findings from R5 that do the same. R5's measurements are done ([r5-kickoff.md](r5-kickoff.md)), so these changes no longer blur a comparison. One commit per item, a pause for review after each group, and the evals after each group.

## Where things stand

- **Branch:** `feat/v2-alpha`, at `4730c88` plus the docs commit that adds this file.
- **Server:** 54 tools, listing 115,556 characters, budget 120,000 (held at the target).
- **Eval reference:** `english-4` (30/30, 95/96 checks, 0 errors) and `nested-english-4` (12/12, 105/105, 1 error), both at `f380392`.

## Plan

### A. The roadmap's four boxes

1. **The grid warning.** `grid.ts` warns "KERN UX has two layout systems…" on every grid. A warning for columns that don't divide 12 already exists, so the unconditional one goes.
2. **No default format hint.** `get_inputtext` and the other text-like tools add a hint when none is given: "Pflichtformat: vollstaendigen Namen angeben (zum Beispiel Max Mustermann)" for text, and similar ones for number, email, tel, url, date and password. The `field` block already passes `defaultHint: false`. All of the defaults go, so the tools and the blocks render the same field (open question 1).
3. **Spacing between blocks.** A form already stacks its content with `kern-flex kern-flex-col kern-gap-lg`. `<main>` and `render_composition` with more than one top-level block get the same stack. Check against KERN's own page examples before choosing between classes on `<main>` and a wrapper `<div>`.
4. **A fieldset's group error in the error summary.** `withErrorIds` collects field errors only. A fieldset's `error` joins the summary in document order, linked to the group's first input. For a radio or checkbox field, that's its first option's input.

### B. Findings from R5

5. **Escaping.** `get_body`, `get_heading`, `get_label`, `get_link`, `get_lists`, `get_preline`, `get_subline`, `get_title` and `get_descriptionlist` put the model's text into the HTML unescaped, and `get_link` does the same with `href`. Their schemas describe the input as plain text, so the templates escape it, as the text block and the form templates already do.
6. **`get_button` with `sr-only`.** The label's class becomes `kern-sr-only` instead of `kern-label`; KERN's markup keeps both (`<span class="kern-label kern-sr-only">`). Same for `sr-only-mobile`.

Each item adds a migration-notes entry under "Rendered markup".

### C. Evals

After A and after B: `npm run eval` and `--suite nested`, compared with `english-4` and `nested-english-4`. The checks are substring checks, so A2 (hints) and A3 (spacing) should change no check; a change there means a transcript to read.

## Open (for the maintainer)

1. **Which default hints go?** The roadmap names the text field's "full name" hint. The plan drops all of them: they're generic ("sicheres Passwort gemaess Richtlinie"), and the `field` block already renders without them. The alternative is to drop only the text field's.
2. **Long results described instead of pasted.** In the evals Haiku describes the page instead of pasting it in 5 of 30 base answers and 5 of 12 nested ones ([post-alpha-work.md](post-alpha-work.md) section 4, point 4). The HTML is in the tool result either way. Options: leave it to the client, or add a line to the result text ("Give the user this HTML unchanged") and measure it with the evals. Not in the plan until decided.

## Progress

- [ ] A1 The grid warning
- [ ] A2 No default format hint
- [ ] A3 Spacing between blocks
- [ ] A4 Fieldset group error in the error summary
- [ ] Evals after A
- [ ] B5 Escaping in the typography templates and `get_link`
- [ ] B6 `get_button` keeps `kern-label` with `sr-only`
- [ ] Evals after B
