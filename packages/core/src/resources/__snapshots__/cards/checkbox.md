# KERN Input Checkboxes

`kern://components/checkbox` · status: stable · KERN ID: `checkboxes` · tool: `get_checkbox`

Also called: Kontrollkästchen, Kontrollfeld, Auswahlkästchen.

Lets users select one or more independent options; use Radios when only one option may be chosen.

## When to use

- For binary decisions such as accepting terms, or for lists in which several options may be selected independently.

## Do

- Write the checkbox label as a statement rather than a question.
- Prefer positive wording and avoid negations in labels.
- Keep the label short enough to fit on one line.

## Don't

- Do not use so many checkboxes that the interface becomes cluttered and unclear.
- Do not use checkboxes when only one option may be chosen; use Radios instead.

## Similar components

- Input Radios (`get_radio`)

## Accessibility

The WCAG criteria KERN's docs leave to the implementation:

- 1.4.1 use-of-color (A): implementation-dependent
- 2.4.13 focus-appearance (AAA): implementation-dependent
- 3.3.2 labels-or-instructions (A): implementation-dependent
- 4.1.3 status-messages (AA): implementation-dependent

## Links

- Documentation: https://www.kern-ux.de/komponenten/form-inputs/checkboxes
- Source: https://gitlab.opencode.de/kern-ux/kern-ux-plain/-/tree/v2.8.2/src/scss/core/components/_check.scss
- Figma: https://www.figma.com/community/file/1624024563231427311

## The tool: `get_checkbox`

KERN UX: HTML for checkboxes. mode 'single' (default): one checkbox, e.g. a consent. mode 'list': a fieldset of independent options under a legend. Several independent choices; for exactly one, use get_radio.

### Fields

With `mode: "single"`:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `mode` | "single" |  | "single" |  |
| `id` | string |  |  | Element id; generated when omitted. |
| `name` | string | yes |  | Name submitted with the form. |
| `label` | string | yes |  | Visible label, phrased as a statement to confirm, e.g. 'I accept the terms'. |
| `checked` | boolean |  | false | Checked initially. |
| `disabled` | boolean |  | false | Not focusable and can't be changed. |
| `error` | object |  |  | Puts the checkbox in its error state. |
| `error.message` | string | yes |  | Error message. An empty string shows the error style without text. |
| `error.id` | string |  |  | Id of the message, for aria-describedby; generated when omitted. |

With `mode: "list"`:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `mode` | "list" | yes |  |  |
| `legend` | string | yes |  | Fieldset legend: the question or topic the options share. |
| `optional` | boolean |  | false | Shows the optional marker on the legend. |
| `hint` | object |  |  | Help text for the whole group. |
| `hint.text` | string | yes |  | Help text for the group, e.g. how many to choose. |
| `hint.id` | string |  |  | Id of the hint, for aria-describedby; generated when omitted. |
| `groupName` | string | yes |  | Name shared by every checkbox in the group; items have no name of their own. |
| `items` | array of object | yes |  | The checkboxes. Any number can be checked at once. |
| `items[].id` | string |  |  | Element id; generated when omitted. |
| `items[].value` | string |  |  | Value submitted when this box is checked. Without one the browser sends 'on'. |
| `items[].label` | string | yes |  | Visible option text. |
| `items[].checked` | boolean |  | false | Checked initially. |
| `items[].disabled` | boolean |  | false | Can't be changed. |
| `error` | object |  |  | Puts the whole group in its error state. |
| `error.message` | string | yes |  | Error message. An empty string shows the error style without text. |
| `error.id` | string |  |  | Id of the message, for aria-describedby; generated when omitted. |

Every tool also takes `locale` (`de` or `en`; `de` by default) and `strict` (fail on validation errors).

### Example

```json
{
  "mode": "list",
  "legend": "Benachrichtigungen",
  "groupName": "kanal",
  "items": [
    {
      "value": "email",
      "label": "Per E-Mail",
      "checked": true
    },
    {
      "value": "post",
      "label": "Per Post"
    }
  ]
}
```

```html
<fieldset class="kern-fieldset">
    <legend class="kern-label">
        Benachrichtigungen
        
    </legend>
    <div class="kern-fieldset__body">
        <div class="kern-form-check">
            <input class="kern-form-check__checkbox" id="checkbox-1" name="kanal" type="checkbox" value="email" checked>
            <label class="kern-label" for="checkbox-1">Per E-Mail</label>
        </div>
        <div class="kern-form-check">
            <input class="kern-form-check__checkbox" id="checkbox-2" name="kanal" type="checkbox" value="post">
            <label class="kern-label" for="checkbox-2">Per Post</label>
        </div>
    </div>
</fieldset>
```

### Validation rules

`validate_html` checks this markup for:

- `form.label_for` (error): A label's for attribute names the id of an existing field.
- `form.field_label` (error): A field has a label with text: a label element that names it with for or wraps it, aria-label or aria-labelledby. A placeholder is no label.
- `form.error_id` (warning): An error message (.kern-error) has an id.
- `form.error_describedby` (warning): A field with an error message references it through aria-describedby.
