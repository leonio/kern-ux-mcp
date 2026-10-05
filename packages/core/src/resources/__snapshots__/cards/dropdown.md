# KERN Dropdown

`kern://components/dropdown` · status: experimental · KERN ID: `dropdown` · tool: `get_dropdown`

Collapsible menu that bundles actions or links for a parent element.

## Links

- Documentation: https://www.kern-ux.de/komponenten/dropdown
- Source: https://gitlab.opencode.de/kern-ux/kern-ux-plain/-/tree/v2.8.2/src/scss/core/components/_dropdown.scss
- Figma: https://www.figma.com/community/file/1624024563231427311

## The tool: `get_dropdown`

KERN UX: HTML for a dropdown (experimental): a <details>/<summary> with radio or checkbox options inside. Not a menu or a select.

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `triggerLabel` | string | yes |  | Text of the <summary> that opens the dropdown. |
| `name` | string | yes |  | Name shared by every option. |
| `options` | array of object | yes |  | The options, rendered as radios or checkboxes (inputType). |
| `options[].value` | string | yes |  | Submitted value. |
| `options[].label` | string | yes |  | Visible option text. |
| `options[].checked` | boolean |  | false | Checked initially. With inputType radio, at most one option. |
| `options[].disabled` | boolean |  | false | Can't be chosen. |
| `inputType` | "radio", "checkbox" |  | "radio" | radio (the default) for one choice, checkbox for several. |
| `open` | boolean |  | false | Open initially (<details open>). |

Every tool also takes `locale` (`de` or `en`; `de` by default) and `strict` (fail on validation errors).

### Example

```json
{
  "triggerLabel": "Sortieren",
  "name": "sortierung",
  "options": [
    {
      "value": "datum",
      "label": "Nach Datum",
      "checked": true
    },
    {
      "value": "name",
      "label": "Nach Name"
    }
  ]
}
```

```html
<!-- WARNING: Experimental Component – API may change. -->
<!-- WARNING: Experimental Component -->
<div class="kern-dropdown">
  <details>
    <summary>Sortieren</summary>
    <ul>
      <li>
        <label>
          <input name="sortierung" type="radio" value="datum" checked>
          Nach Datum
        </label>
      </li>
      <li>
        <label>
          <input name="sortierung" type="radio" value="name">
          Nach Name
        </label>
      </li>
    </ul>
  </details>
</div>
```

### Validation rules

`validate_html` checks this markup for:

- `form.field_label` (error): A field has a label with text: a label element that names it with for or wraps it, aria-label or aria-labelledby. A placeholder is no label.
- `form.error_id` (warning): An error message (.kern-error) has an id.
- `form.error_describedby` (warning): A field with an error message references it through aria-describedby.

## Notes on our tool

The current dropdown tool is explicitly experimental and only models a lightweight details/summary wrapper with embedded selection options, not a full menu or select system.

- **Use it for:** Suitable for documented experimental output where a simple, explicitly declared details-based choice structure is enough.
- **Not for:** Do not use it as a replacement for real select, menu, or complex navigation elements.
- **Accessibility:** The summary trigger should keep meaningful visible text because the interaction is tied to the native details/summary pattern.
- **Always:** The dropdown tool's experimental status should remain visible in guidance and UI until a more stable pattern is introduced.
- **Authoring:** When users ask for full menu or select interactions, point out the current boundary of the experimental dropdown tool.
- **Migration:** If a more stable dropdown or menu pattern is introduced later, this overlay note should reframe the current details/summary variant as a legacy or experimental path.
