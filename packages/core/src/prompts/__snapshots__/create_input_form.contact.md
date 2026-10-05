<!-- message 1: resource kern://guides/forms (text/markdown, 7572 bytes) -->

<!-- message 2: resource_link kern://components/inputtext "KERN Input Text" -->

<!-- message 3: resource_link kern://components/textarea "KERN Input Textarea" -->

<!-- message 4: resource_link kern://components/select "KERN Input Select" -->

<!-- message 5: resource_link kern://components/checkbox "KERN Input Checkboxes" -->

<!-- message 6: resource_link kern://components/radio "KERN Input Radios" -->

<!-- message 7: resource_link kern://components/fieldset "KERN Fieldset" -->

<!-- message 8: text -->
Build a form with the kern tools: Kontaktformular des Bürgerbüros

Fields: Name, E-Mail, Nachricht, Zustimmung zur Datenschutzerklärung (Pflicht)

The forms guide above has KERN's rules for labels, hints, errors and required fields, and the cards linked above describe each input. Work in this order:

1. **Fields:** one `field` block per field. Pick its `type`: text, email, tel, url, number, date, password, textarea, select, radio or checkbox. select and radio need `options`; a checkbox with `options` is a group. A file upload has no field type: render it with `get_inputfile` and add its HTML as an `html` block.
2. **Labels:** a short `label` in German without a trailing colon, a `name`, and an `autocomplete` token where one fits (given-name, family-name, email, tel, bday, street-address, postal-code). A `hint` only where it helps, such as for an expected format.
3. **Required and optional:** `required: true` on the fields the form needs, `optional: true` on the few it doesn't. Radio and checkbox fields ignore `required`.
4. **Groups:** related fields go in a `fieldset` block with a `legend`, with `legendSize: "large"` for a main part of the form such as an address. Everything goes in one `form` block with `actions: { submitLabel }`. To show the form after a failed submit, give each field in error its `error` message and the form `errorSummary: {}`.
5. **Render:** call `render_composition` with `locale: "de"` and `strict: true`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with `validate_html`.

Answer with the final HTML from the tool, verbatim, in one ```html block, not a description of it.
