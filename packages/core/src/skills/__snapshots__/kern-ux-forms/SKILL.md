---
name: "kern-ux-forms"
description: "Builds accessible forms in the KERN UX design system for German public-sector services with the kern-ux MCP server's tools (render_composition, render_page, validate_html): contact forms, applications (Anträge), registrations and multi-step forms with a step list, progress and a step for checking the answers. Use it when asked for a form, input fields, a Formular or an Antrag in KERN, or to fix a KERN form's labels, hints, error messages or required fields."
license: "EUPL-1.2"
---

# Build a KERN form

Build the form with the kern-ux tools instead of writing its HTML: they tie each label to its input, list hints and errors in `aria-describedby`, mark required fields with `aria-required`, build the error summary, and use KERN's classes. The tools can't check the text of a form, so follow KERN's rules for it below.

## Before you build

- **The fields:** take them from the request. Pick each field's type with [references/inputs.md](references/inputs.md), which has KERN's guidance for each input.
- **One page or several steps:** one page, unless the form is too long for one or is a process in a fixed order, such as an application. If the request doesn't name the steps, group the fields into a few steps, each named for what it asks, and end with a step for checking the answers. KERN's guidance for steps, with its limits on their number, is in [references/steps.md](references/steps.md).
- **The language:** German, `locale: "de"`, unless the request is in English or asks for English, `locale: "en"`. Labels, hints, error messages and buttons are in that language.

## Workflow

1. **Fields:** one `field` block per field. Pick its `type`: text, email, tel, url, number, date, password, textarea, select, radio or checkbox. select and radio need `options`; a checkbox with `options` is a group. A file upload has no field type: render it with `get_inputfile` and add its HTML as an `html` block.
2. **Labels:** a short `label` in the page's language without a trailing colon, a `name`, and an `autocomplete` token where one fits (given-name, family-name, email, tel, bday, street-address, postal-code). A `hint` only where it helps, such as for an expected format.
3. **Required and optional:** `required: true` on the fields the form needs, `optional: true` on the few it doesn't. Radio and checkbox fields ignore `required`.
4. **Groups:** related fields go in a `fieldset` block with a `legend`, with `legendSize: "large"` for a main part of the form such as an address. Everything goes in one `form` block with `actions: { submitLabel }`. To show the form after a failed submit, give each field in error its `error` message and the form `errorSummary: {}`.
5. **Render:** call `render_composition` with `strict: true` and `locale` set to the page's language, `"de"` or `"en"`. When the form is a page of its own, with a header and footer, call `render_page` with the same blocks. A strict call fails with the issues: fix the blocks and call again.
6. **Use the HTML:** put the HTML from the tool, verbatim and whole, in your answer or in the file you're editing. To change it, change the blocks and render again. Check any markup you change by hand with `validate_html`.

## Several steps

For a multi-step form, do these instead of step 4:

- **Steps:** one `formFlow` block with exactly the steps given, in order, each `label` as given. Spread the fields over the steps in the order given, each step's fields in a `fieldset` whose `legend` names the step, with `legendSize: "large"`. `navigation: { backLabel, nextLabel, submitLabel }` (such as Zurück, Weiter and Absenden) gives every step but the first a back button, and only the last one a submit button. The step list and the progress bar come with the block.
- **Review:** KERN asks for a summary where people check their answers before sending them. If a step is for that, such as "Prüfen und Absenden", start its `contentBlocks` with a summary block, `{ kind: "summary", summary: { summaries: [{ title, items: [{ key, value }], editHref }] } }`: one summary per earlier step, titled and ordered like the steps, with example answers and a link back to the step. The fields for sending the form, such as a checkbox to confirm the answers, follow the summary in this step.
- **The step shown:** `currentStep` is the step to show. Without `renderAllSteps`, each step is a page of its own; with `renderAllSteps: true`, every step is in the page and the inactive ones are hidden, so a script can switch between them. To show a step after a failed submit, give each field in error its `error` message and the `formFlow` block `errorSummary: {}`.

## KERN's rules for the text

Do:

- Prefer aria-required=true over the native required attribute to keep validation, styling and error messages under control.
- Keep label text short and on one line, with no trailing colon.
- Place at most two closely related text fields side by side and prefer stacking fields.
- Write error messages concisely, name a single cause and always give an action, without blaming the user.
- Write hint texts as a complete sentence with a full stop.

Don't:

- Do not put links in hint text; screen readers do not detect them as links.
- Do not label the many required fields; label the few optional ones instead.
- Do not use the disabled attribute; hide the input or use aria-disabled=true with JavaScript instead.

## References

- [references/inputs.md](references/inputs.md): which field type to use for which data, with KERN's guidance for each input and our notes where a tool differs from KERN.
- [references/steps.md](references/steps.md): KERN's guidance for the step list, the progress bar and the summary of a multi-step form.
- [references/forms-guide.md](references/forms-guide.md): how the tools build labels, hints, errors and the error summary, with an example, and KERN's rules for every input field. The `kern://guides/forms` resource has the same text.
