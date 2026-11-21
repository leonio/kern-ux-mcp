---
name: kern-forms
description: Load this skill first, before you call any KERN tool, whenever a task asks for a KERN form, form fields or a multi-step form or application. It says how to build it with the KERN UX MCP server's tools, with the right field types, labels, hints, required and optional fields, error messages and the error summary, and for several steps the step list, progress and a review step. When the form is part of a complete page with a header and a footer, load kern-page-layout first and this skill with it.
license: EUPL-1.2
compatibility: Needs the KERN UX MCP server (@leonio/kern-ux-mcp).
---

# KERN forms

Build the form from blocks with the KERN UX MCP server's tools, and render it strictly. The tools are named here without the prefix your client adds: `render_composition` may show as `mcp__kern-ux__render_composition`.

The form's labels, hints and messages are in the language the person writes in, German when it's unclear, and the render call gets the same `locale`: `"de"` or `"en"`.

[references/forms.md](references/forms.md) has KERN's rules for labels, hints, errors and required fields. For one input in detail, such as a select or the summary, call `get_component_docs`.

## Work in this order

1. **Fields:** one `field` block per field. Pick its `type`: text, email, tel, url, number, date, password, textarea, select, radio or checkbox. select and radio need `options`; a checkbox with `options` is a group. A file upload has no field type: render it with `get_inputfile` and add its HTML as an `html` block.
2. **Labels:** a short `label` in the form's language without a trailing colon, a `name`, and an `autocomplete` token where one fits (given-name, family-name, email, tel, bday, street-address, postal-code). A `hint` only where it helps, such as for an expected format.
3. **Required and optional:** `required: true` on the fields the form needs, `optional: true` on the few it doesn't. Radio and checkbox fields ignore `required`.
4. **One page or steps.** For a form on one page:
   - **Groups:** related fields go in a `fieldset` block with a `legend`, with `legendSize: "large"` for a main part of the form such as an address. Everything goes in one `form` block with `actions: { submitLabel }`. To show the form after a failed submit, give each field in error its `error` message and the form `errorSummary: {}`.

   For a form in steps:
   - **Steps:** one `formFlow` block with exactly the steps asked for, in order, each `label` as asked. Spread the fields over the steps in the order asked, each step's fields in a `fieldset` whose `legend` names the step, with `legendSize: "large"`. `navigation: { backLabel, nextLabel, submitLabel }` (such as Zurück, Weiter and Absenden) gives every step but the first a back button, and only the last one a submit button. The step list and the progress bar come with the block.
   - **Review:** KERN asks for a summary where people check their answers before sending them. If a step is for that, such as "Prüfen und Absenden", start its `contentBlocks` with a summary block, `{ kind: "summary", summary: { summaries: [{ title, items: [{ key, value }], editHref }] } }`: one summary per earlier step, titled and ordered like the steps, with example answers and a link back to the step. The fields for sending the form, such as a checkbox to confirm the answers, follow the summary in this step.
   - **The step shown:** `currentStep` is the step to show. Without `renderAllSteps`, each step is a page of its own; with `renderAllSteps: true`, every step is in the page and the inactive ones are hidden, so a script can switch between them. To show a step after a failed submit, give each field in error its `error` message and the `formFlow` block `errorSummary: {}`.
5. **Render:** call `render_composition` with the `locale` and `strict: true`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with `validate_html`. When the form is part of a whole page, build the page with kern-page-layout and put the `form` or `formFlow` block in its `contentBlocks`.

Answer with the final HTML from the tool, verbatim, in one ```html block, not a description of it.
