<!-- message 1: resource kern://guides/forms (text/markdown, 7572 bytes) -->

<!-- message 2: resource_link kern://components/inputtext "KERN Input Text" -->

<!-- message 3: resource_link kern://components/textarea "KERN Input Textarea" -->

<!-- message 4: resource_link kern://components/select "KERN Input Select" -->

<!-- message 5: resource_link kern://components/checkbox "KERN Input Checkboxes" -->

<!-- message 6: resource_link kern://components/radio "KERN Input Radios" -->

<!-- message 7: resource_link kern://components/fieldset "KERN Fieldset" -->

<!-- message 8: resource_link kern://components/tasklist "KERN Task List" -->

<!-- message 9: resource_link kern://components/progress "KERN Progress" -->

<!-- message 10: resource_link kern://components/summary "KERN Summary" -->

<!-- message 11: text -->
Build a multi-step form with the kern tools: Antrag auf einen Bewohnerparkausweis

Steps: Persönliche Daten; Fahrzeug; Prüfen und Absenden

Fields: Vorname, Nachname, Geburtsdatum, Kennzeichen, Fahrzeugart (PKW, Motorrad, Wohnmobil), Bestätigung der Angaben

The forms guide above has KERN's rules for labels, hints, errors and required fields, and the cards linked above describe each input, the step list, the progress bar and the summary. Work in this order:

1. **Fields:** one `field` block per field. Pick its `type`: text, email, tel, url, number, date, password, textarea, select, radio or checkbox. select and radio need `options`; a checkbox with `options` is a group. A file upload has no field type: render it with `get_inputfile` and add its HTML as an `html` block.
2. **Labels:** a short `label` in German without a trailing colon, a `name`, and an `autocomplete` token where one fits (given-name, family-name, email, tel, bday, street-address, postal-code). A `hint` only where it helps, such as for an expected format.
3. **Required and optional:** `required: true` on the fields the form needs, `optional: true` on the few it doesn't. Radio and checkbox fields ignore `required`.
4. **Steps:** one `formFlow` block with exactly the steps given, in order, each `label` as given. Spread the fields over the steps in the order given, each step's fields in a `fieldset` whose `legend` names the step, with `legendSize: "large"`. `navigation: { backLabel, nextLabel, submitLabel }` (such as Zurück, Weiter and Absenden) gives every step but the first a back button, and only the last one a submit button. The step list and the progress bar come with the block.
5. **Review:** KERN asks for a summary where people check their answers before sending them. If a step is for that, such as "Prüfen und Absenden", start its `contentBlocks` with a summary block, `{ kind: "summary", summary: { summaries: [{ title, items: [{ key, value }], editHref }] } }`: one summary per earlier step, titled and ordered like the steps, with example answers and a link back to the step.
6. **The step shown:** `currentStep` is the step to show. Without `renderAllSteps`, each step is a page of its own; with `renderAllSteps: true`, every step is in the page and the inactive ones are hidden, so a script can switch between them. To show a step after a failed submit, give each field in error its `error` message and the `formFlow` block `errorSummary: {}`.
7. **Render:** call `render_composition` with `locale: "de"` and `strict: true`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with `validate_html`.

Answer with the final HTML from the tool, verbatim, in one ```html block, not a description of it.
