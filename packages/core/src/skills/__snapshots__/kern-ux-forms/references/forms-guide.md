# KERN guide: forms

How our tools build labels, hints, errors and the error summary, and KERN's rules for every input field.

## How our tools do it

- **Tools:** `field` blocks (text, email, tel, url, number, date, password, textarea, select, radio, checkbox) in `fieldset` and `form` blocks, in `render_composition` and `render_page`. `get_inputtext`, `get_select`, `get_checkbox` and the other input tools render one field each.
- **Label:** every field has a `<label class="kern-label" for>` naming the input's generated `id`.
- **Hint:** `hint` adds `<div class="kern-hint" id>` between label and input, and the input lists it in `aria-describedby`.
- **Error:** `error` adds `kern-form-input--error` to the field and a `<p class="kern-error" id role="alert">` with a danger icon after the input. `aria-describedby` lists the hint, then the error.
- **Optional and required:** `optional: true` adds `<span class="kern-label__optional">` to the label. `required: true` adds `aria-required="true"` to the input, as KERN asks below, with no visible marker and no native `required` (text-like fields, textarea, select and file).
- **Groups:** a `fieldset` block puts fields under a `<legend>`. Its `error` marks the fieldset (`kern-fieldset--error`, `aria-describedby`) and follows its fields.
- **Error summary:** a `form` block with `errorSummary` collects the errors inside it into a danger alert at the top, one link to each field. A group's error comes before its fields' errors and links to the group's first input.
- **Checks:** `validate_html` reports labels without a field (`form.label_for`) and error messages without an `id` or an `aria-describedby` that names them (`form.error_id`, `form.error_describedby`).

### Example: `render_composition`

```json
{
  "contentBlocks": [
    {
      "kind": "form",
      "form": {
        "errorSummary": {},
        "contentBlocks": [
          {
            "kind": "field",
            "field": {
              "type": "text",
              "name": "nachname",
              "label": "Nachname",
              "hint": "Wie im Personalausweis",
              "error": "Bitte geben Sie Ihren Nachnamen ein."
            }
          },
          {
            "kind": "field",
            "field": {
              "type": "email",
              "name": "email",
              "label": "E-Mail",
              "optional": true
            }
          }
        ],
        "actions": {
          "submitLabel": "Absenden"
        }
      }
    }
  ]
}
```

```html
<form class="kern-flex kern-flex-col kern-gap-lg" method="post" novalidate>
  <div class="kern-alert kern-alert--danger" role="alert">
    <div class="kern-alert__header">
      <span class="kern-icon kern-icon--danger" aria-hidden="true"></span>
      <span class="kern-title">Bitte korrigieren Sie die folgenden Angaben</span>
    </div>
    <div class="kern-alert__body">
      <ul class="kern-list">
        <li><a class="kern-link" href="#field-1">Nachname: Bitte geben Sie Ihren Nachnamen ein.</a></li>
      </ul>
    </div>
  </div>
  <div class="kern-form-input kern-form-input--error">
  <label class="kern-label" for="field-1">Nachname</label>
  <div class="kern-hint" id="hint-1">Wie im Personalausweis</div>
  <input class="kern-form-input__input kern-form-input__input--error" id="field-1" name="nachname" type="text" aria-describedby="hint-1 error-1">

  <p class="kern-error" id="error-1" role="alert">
    <span class="kern-icon kern-icon--danger" aria-hidden="true"></span>
    <span class="kern-body">Bitte geben Sie Ihren Nachnamen ein.</span>
  </p></div>
      <div class="kern-form-input">
  <label class="kern-label" for="input-1">E-Mail<span class="kern-label__optional">Optional</span></label>
  <input class="kern-form-input__input" id="input-1" name="email" type="email" autocomplete="email">
</div>
  <div class="kern-flex kern-flex-wrap kern-gap-md">
    <button type="submit" class="kern-btn kern-btn--primary">
      <span class="kern-label">Absenden</span>
    </button>
  </div>
</form>
```

## KERN's rules for every input field

- **States:** Inputs can take the states default (normal entry), hover, focus, readonly (display stored values that cannot be changed), disabled, and error in combination with default, focus or hover. Not every field uses every state; each input type lists the states it supports.
- **Label und Legende:** The label or legend of an input should always describe the required entry as briefly and precisely as possible.
- **Required-Auszeichnung:** Mark required fields with aria-required=true rather than the native required attribute, which triggers inconsistent browser validation. aria-required=true is recognised by assistive technology while validation stays under JavaScript and CSS control. Forms should be mostly required fields.
- **Optional-Label:** Mark optional inputs clearly and consider carefully whether the information is really needed, so the form does not become overloaded. Ideally a form is mostly required fields with only a few optional ones.
- **Hint:** A hint gives supporting information and extra context, for example the expected data format. It should not carry long explanations, lists or paragraphs, and should only repeat information that helps many users and is not already stated elsewhere in the form.
- **Fehlermeldungen:** Write a specific message for every recognisable error state and keep it constructive without blaming the user, understandable and free of jargon, concise with a single cause and active language, and friendly and supportive rather than discouraging. Based on the German UPA guide.
- **Breite und Höhe der Eingabefelder:** Applies to text and number inputs, not to checkboxes or radios. Height stays fixed however much text is entered; width is flexible but should not be too wide and should hint at the length of the expected value. Use a consistent width for similar information and test on different screen sizes.
- **Eingabefelder außerhalb von Formularen:** A text or number input may exceptionally sit on a light grey background (layout/background/hued) outside classic forms, for example in a short input mask that should stand apart from the rest of the page. The field background must then be light (layout/background-inverted).
- **Weitere Hinweise:** Allow copying and pasting content and the use of autocomplete in input fields. A guide to good error messages is available from the German UPA.
- **disabled Attribut:** disabled prevents interaction and makes an input unreachable for keyboard users: it cannot be focused with the tab key or read by screen readers. Prefer hiding the input and showing it later. If deactivation is unavoidable, prefer aria-disabled=true and disable interaction in JavaScript.

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

Source: [Form inputs](https://www.kern-ux.de/komponenten/form-inputs/index) on kern-ux.de
