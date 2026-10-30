# Choosing the inputs

Which `field` type to use for which data. Each section has KERN's guidance for the component the type renders, our notes where the tool differs from KERN, and the component's card, which also has the tool's fields and a rendered example.

## Input Text: `type: "text"`

Input Text is the basic single-line field for alphanumeric input whose value cannot be predicted.

Use it for:

- Use Input Text for free-form, single-line entries such as a name, a street or a short note.

Do:

- Use Input Text for single-line entries whose value cannot be predicted.
- Show the validation message below the field.

Don't:

- Don't use free text when users choose from a known list; use Checkboxes or Radios.
- Don't use Input Text for longer, multi-line input; use Text Area.
- Don't use disabled, because it restricts accessibility.

Card: `kern://components/inputtext`

## Input E-Mail: `type: "email"`

Input E-Mail accepts one email address, validates its format and reports invalid entries below the field.

Use it for:

- Use Input E-Mail wherever a form needs an email address, for example registration or contact details.

Do:

- Allow autocomplete so an address the user entered before can be completed.
- Explain the expected format in the hint text.

Don't:

- Don't use the field for anything other than email addresses.
- Don't use disabled, because it restricts accessibility.

Card: `kern://components/inputemail`

## Input Tel: `type: "tel"`

Input Tel takes a phone number with type="tel" and allows digits plus characters such as +.

Use it for:

- Use Input Tel for phone numbers, such as a landline or mobile number, including international prefixes.

Do:

- Use type="tel" so mobile users get a numeric keypad.
- Tell users the expected format in the hint text.
- Make the label show that a phone number is expected, for example a mobile number.

Don't:

- Don't use Input Tel for general numbers; Input Number fits better.
- Don't use disabled, because it restricts accessibility.

Card: `kern://components/inputtel`

## Input Url: `type: "url"`

Input Url takes a web address in a type="url" field and validates its format.

Use it for:

- Use Input Url when a form needs an internet address, for example the address of a service.

Do:

- Use the field only for internet addresses.
- Point users to the expected format in the hint text.
- Make the label show that a web address is expected.

Don't:

- Don't use disabled, because it restricts accessibility.
- Don't leave the accepted format unstated; the label or hint must give it.

Card: `kern://components/inputurl`

## Input Number: `type: "number"`

Input Number accepts a number through inputmode="numeric" and reports validation errors below the field.

Use it for:

- Use Input Number for unpredictable numeric values such as a postcode, a house number or an area size.

Do:

- Make the label show that only numbers are expected, for example a house number or a postcode.
- Explain the permitted characters in the hint when the label does not make it obvious.
- Use inputmode="numeric" so users get a numeric keypad.

Don't:

- Don't use Input Number when the answer options are known; use Select, Checkboxes or Radios.
- Don't use it for a phone number or a date; Input Tel and Input Date fit better.
- Don't use disabled, because it restricts accessibility.

Card: `kern://components/inputnumber`

## Input Date: `type: "date"`

Input Date splits a date into day, month and year fields, grouped under one label that states the expected order.

Use it for:

- Use Input Date when a form needs a date, such as a birth date or the expiry date of a document.

Do:

- Give the group a clear shared label and a hint that states the format.
- Use examples such as 14 4 2014 so the day and month order is unambiguous.
- Mirror the source document's format when the date is copied from a passport or a card.
- Keep the three fields at their default size.

Don't:

- Don't use disabled, because it restricts accessibility.
- Don't require leading zeros.
- Don't change the size of the day, month and year fields.

Our tool: The MCP InputDate tool intentionally models only a single browser-native date field rather than the upstream KERN variant with separate day, month, and year inputs.

- **Use it for:** Suitable for simple MCP output where a native date picker is sufficient and the full KERN field group is not required.
- **Not for:** Do not treat it as a full reproduction of the upstream KERN date group with separate inputs, hints, and grouped validation logic.
- **Accessibility:** The simplified native date field must still follow the general form requirements for label, hint, and error wiring, even though the upstream grouped semantics are not modeled here.
- **Always:** Documentation should clearly distinguish between the MCP simplification and the richer upstream KERN date input pattern.
- **Authoring:** If a user explicitly needs the KERN day/month/year structure, the current tool boundary should be stated instead of silently substituting the native field.
- **Migration:** A later extension to separate day, month, and year fields should be planned as an additive capability, not as a silent replacement of the existing native date field.

Card: `kern://components/inputdate`

## Input Password: `type: "password"`

Input Password masks the entry, adds a visibility toggle and keeps browser autofill for passwords off.

Do:

- Use autocomplete="current-password" or autocomplete="new-password".
- Explain the password rules in the help during registration.
- Return a neutral error message on a failed sign-in.

Don't:

- Don't drop autocomplete without good reason; browsers expect it.
- Don't reveal whether the user name or the password was wrong.
- Don't use Input Password for other text input.

Card: `kern://components/inputpassword`

## Input Textarea: `type: "textarea"`

Multi-line text input; use it only for paragraphs, otherwise use Input Text.

Use it for:

- When users must enter multi-line text or paragraphs.

Do:

- Allow the copy and paste function.
- Let users enlarge the field when long text entries are expected.

Don't:

- Avoid the disabled state, because it limits accessibility.

Card: `kern://components/textarea`

## Input Select: `type: "select"`

Single-choice drop-down list; use it for 5 to 15 options and favour radios where possible.

Use it for:

- Forms where users pick exactly one of 5 to 15 predefined options.
- When space is tight or input errors must be avoided.

Do:

- Keep the labels of the values in the list as short as possible.

Don't:

- Avoid the disabled state, because it limits accessibility.
- Do not use a select as a way to trigger actions or as navigation.
- Do not use more than 15 values in the selection list; the right option becomes hard to find.

Card: `kern://components/select`

## Input Radios: `type: "radio"`

Lets users select exactly one option from a mutually exclusive group.

Use it for:

- Forms where users must choose exactly one of several mutually exclusive options.

Do:

- Write each radio label as a statement rather than a question where possible.
- Keep radio labels short so they can be grasped quickly.
- Phrase radio labels positively where possible, avoiding '... not ...' or '... no ...'.
- Preselect an option only for settings; when the choice answers a question, leave all options unselected.

Don't:

- Never allow more than one option of a radio group to be selected.
- Do not use the readonly state; radios accept all other Input states.

Card: `kern://components/radio`

## Input Checkboxes: `type: "checkbox"`

Lets users select one or more independent options; use Radios when only one option may be chosen.

Use it for:

- For binary decisions such as accepting terms, or for lists in which several options may be selected independently.

Do:

- Write the checkbox label as a statement rather than a question.
- Prefer positive wording and avoid negations in labels.
- Keep the label short enough to fit on one line.

Don't:

- Do not use so many checkboxes that the interface becomes cluttered and unclear.
- Do not use checkboxes when only one option may be chosen; use Radios instead.

Card: `kern://components/checkbox`

## Input File: no field type: render it with `get_inputfile` and add its HTML as an `html` block

Input File uploads one or more files by drag and drop or a file picker, and requires allowed formats and a size limit.

Use it for:

- Use Input File when users must provide something only they can, such as their own photo or a receipt.

Do:

- Always state the allowed file types and the maximum size precisely.
- Keep the label short and specific about what should be uploaded.
- Validate uploads automatically and describe errors so users can fix them.
- Allow a range of file formats.

Don't:

- Don't ask for an upload unless the service really needs it.
- Don't request data an API or the user's profile can already supply.
- Don't group unrelated files in one Input File.
- Don't use disabled, because it restricts accessibility.

Card: `kern://components/inputfile`

## Fieldset: a `fieldset` block around related fields

Groups related form fields with a legend and shared hint or error; required for checkbox and radio groups.

Use it for:

- For multi-part entries such as addresses or date fields, and for checkbox or radio groups that relate to one question.

Do:

- Use fieldsets only for elements that belong together in content.
- Use a Fieldset for checkbox lists and radio groups; it is mandatory there.
- Give the legend a clear and concise label and never leave it empty.
- Link group-level error messages inside the fieldset via aria-describedby.

Don't:

- Do not use a Fieldset for a single checkbox, e.g. accepting a privacy policy.
- Do not nest form field groups inside one another.

Card: `kern://components/fieldset`
