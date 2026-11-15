# KERN guide: accessibility

What validate_html checks, KERN's accessibility rules, and the WCAG criteria each component leaves to the page that uses it.

## What validate_html checks

Every tool checks its own output with these rules, and `validate_html` checks any markup. A result's `ok` is false when it has an error, and with `strict: true` a tool fails instead. Warnings never fail.

| Rule | Severity | What it asks for |
|---|---|---|
| `alert.role` | error | An alert has role="alert". |
| `loader.role` | error | A visible loader has role="status". |
| `loader.sr_text` | error | A visible loader has a non-empty .kern-sr-only label. |
| `dialog.aria_labelledby` | error | A dialog has aria-labelledby, pointing to its heading. |
| `dialog.aria_labelledby_target` | error | The id in a dialog's aria-labelledby exists. |
| `icon.aria` | error | An icon is decorative (aria-hidden="true") or has an aria-label. |
| `button.icon_only_sr_label` | error | A button with only an icon has a non-empty sr-only label (.kern-label.kern-sr-only). |
| `form.label_for` | error | A label's for attribute names the id of an existing field. |
| `form.field_label` | error | A field has a label with text: a label element that names it with for or wraps it, aria-label or aria-labelledby. A placeholder is no label. |
| `form.error_id` | warning | An error message (.kern-error) has an id. |
| `form.error_describedby` | warning | A field with an error message references it through aria-describedby. |
| `table.caption` | warning | A table has a caption. |
| `table.th_scope` | warning | A header cell has scope="col" or scope="row". |
| `table.headers` | error | A table has header cells (th), unless role="presentation" or role="none" marks it as layout. |
| `heading.level_skip` | warning | A heading is at most one level below the heading before it: h2 after h1, not h3. The first heading may have any level. |
| `img.alt` | error | An image has an alt attribute: alt="" when it is decorative. |
| `layout.grid_in_container` | warning | A kern-grid sits in a div of its own, not directly in kern-container, which would lose its padding. |
| `layout.grid_columns_small` | warning | A kern-grid that sets its columns from a breakpoint up also sets them for small screens (kern-grid-cols-1). |
| `class.unknown` | warning | Every kern-* class is one KERN defines. |

### Example: `validate_html`

```json
{
  "html": "<img src=\"wappen.png\"><button class=\"kern-btn\"><span class=\"kern-icon kern-icon--edit\" aria-hidden=\"true\"></span></button>"
}
```

```json
{
  "ok": false,
  "issues": [
    {
      "ruleId": "button.icon_only_sr_label",
      "severity": "error",
      "message": {
        "en": "Icon-only buttons must include a non-empty sr-only label.",
        "de": "Icon-only Buttons müssen einen nicht-leeren sr-only Text enthalten."
      },
      "selectorHint": ".kern-btn"
    },
    {
      "ruleId": "img.alt",
      "severity": "error",
      "message": {
        "en": "<img> elements must have an alt attribute (use alt=\"\" for decorative images).",
        "de": "<img>-Elemente müssen ein alt-Attribut haben (alt=\"\" für dekorative Bilder)."
      },
      "selectorHint": "img"
    }
  ]
}
```

## KERN's accessibility rules

- **Welche Standards erfüllt KERN?:** The KERN code base behind the components meets at least level AA of BITV 2.0. A service built with them is not automatically accessible: conformance must be developed and verified in the overall context, and that responsibility lies with the implementing teams, not with KERN.
- **Was das KERN Design-System nicht leistet:** It does not replace an individual accessibility review, does not by itself guarantee full WCAG or BITV conformance for a component in its overall context, and does not cover every specific accessibility requirement, so additional measures are often needed.
- **Wahrnehmbarkeit von Farbkontrasten:** Text above 24px needs a contrast ratio of 3:1; text at 24px or smaller needs 4.5:1. Graphics and graphical controls need 3:1, and at least 3:1 must hold when they receive focus.
- **Alternativtexte:** For linked graphics, state the purpose and target of the link. Describe informative graphics in text, and leave the alt attribute empty for decorative ones. Alternative texts also support SEO.
- **Skalierbarkeit:** Pages must reflow down to 320px in portrait and landscape. Text must be resizable up to 200% without loss of content or functionality, except for captions and images of text. Content that cannot scale, such as tables and images, may scroll horizontally.
- **Tastaturbedienbarkeit:** Make online services operable with a keyboard, including mobile apps. Shortcuts must be switchable off or remappable and no keyboard trap may exist: a trap is when focus can enter a region but cannot leave it again with the usual keys.
- **Bewegte Inhalte:** Moving content distracts. Avoid sliders and other moving elements, limit them to 5 seconds or make them switchable off; the BFIT guidance on animation has more.
- **Robustheit:** Ensure compatibility with assistive technology: HTML semantics must be correct, IDs must not be duplicated (check with the W3C markup validation service), and status indicators such as loading messages must be detectable by screen readers.
- **Videos:** A video with sound needs subtitles or a media alternative, and the tools support captioning including live captions. Information shown visually in a video must also be conveyed another way, as a description of what is seen or as a full text alternative.
- **Erklärung zur Barrierefreiheit:** The accessibility statement required by section 12b of the German disability equality act must be published in an accessible, machine-readable format and be reachable from the home page and every page. For mobile applications publish it where the app is downloaded or on the public body's website.
- **Leichte Sprache und deutsche Gebärdensprache:** Under section 4 BITV 2.0, the information on a website's home page must also be provided in plain-language form and in German Sign Language. The BITV 2.0 ordinance holds the details.

Do:

- Check contrast: 3:1 for text above 24px, 4.5:1 at 24px or smaller, and 3:1 for graphics and controls, including when focused.
- Describe informative graphics in text, give linked graphics an alt text naming purpose and target, and leave alt empty for decorative images.
- Keep services operable by keyboard without traps and let shortcuts be switched off or remapped.
- Limit moving content to 5 seconds or make it switchable off.
- Publish an accessibility statement in an accessible, machine-readable format reachable from the home page and every page.
- Test representative pages that together cover the likely barriers, using self-tests, user testing and expert conformance audits.
- Use valid HTML semantics, avoid duplicate IDs and make status messages detectable by screen readers.
- Subtitle videos that carry sound or offer a media alternative, and convey on-screen information in text as well.

Don't:

- Don't treat KERN components as a guarantee of WCAG or BITV conformance for the assembled service.
- Don't assume accessibility is one person's job: research, design and project management all share it.
- Don't rely on a self-audit as a substitute for an expert conformance test.
- Don't use sliders and other moving elements without limiting or being able to switch off the motion.
- Don't let content or functionality break when text is enlarged to 200% or the page narrows to 320px.

Source: [Accessibility](https://www.kern-ux.de/design-system/barrierefreiheit) on kern-ux.de

## WCAG criteria per component

KERN's docs mark these criteria as implementation-dependent: the component's markup doesn't settle them, the page that uses it does. Each component's card (`kern://components/{id}`) lists them too.

- **Accordion** (`accordion`): 3.3.2 labels-or-instructions (A)
- **Alert** (`alert`): 1.3.1 info-and-relationships (A), 2.1.1 keyboard (A), 2.4.13 focus-appearance (AAA), 3.3.2 labels-or-instructions (A)
- **Badge** (`badge`): 1.3.1 info-and-relationships (A), 1.3.3 sensory-characteristics (A), 3.2.4 consistent-identification (AA), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Bildwortmarke** (`bildwortmarke`): 1.1.1 non-text-content (A)
- **Body** (`body`): 1.4.4 resize-text (AA), 1.4.10 reflow (AA)
- **Button** (`button`): 1.1.1 non-text-content (A), 1.3.1 info-and-relationships (A), 2.4.3 focus-order (A), 3.3.2 labels-or-instructions (A), 4.1.2 name-role-value (A)
- **Card** (`card`): 1.1.1 non-text-content (A), 1.3.2 meaningful-sequence (A), 1.4.11 non-text-contrast (AA), 2.4.6 headings-and-labels (AA)
- **Input Checkboxes** (`checkbox`): 1.4.1 use-of-color (A), 2.4.13 focus-appearance (AAA), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Description List** (`descriptionlist`): 3.3.2 labels-or-instructions (A)
- **Details** (`details`): 1.3.1 info-and-relationships (A), 2.4.3 focus-order (A), 2.4.6 headings-and-labels (AA)
- **Dialog** (`dialog`): 2.4.2 page-titled (A)
- **Fieldset** (`fieldset`): 2.4.3 focus-order (A), 2.4.6 headings-and-labels (AA), 3.3.2 labels-or-instructions (A)
- **Heading** (`heading`): 1.4.4 resize-text (AA), 1.4.10 reflow (AA)
- **Icon** (`icon`): 1.1.1 non-text-content (A), 1.3.1 info-and-relationships (A), 1.4.1 use-of-color (A), 2.1.1 keyboard (A), 2.4.13 focus-appearance (AAA), 2.5.5 target-size-enhanced (AAA), 3.2.4 consistent-identification (AA)
- **Input Date** (`inputdate`): 1.3.5 identify-input-purpose (AA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Input E-Mail** (`inputemail`): 1.3.5 identify-input-purpose (AA), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Input File** (`inputfile`): 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Input Group** (`inputgroup`): 1.3.5 identify-input-purpose (AA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.2 name-role-value (A), 4.1.3 status-messages (AA)
- **Input Number** (`inputnumber`): 1.3.5 identify-input-purpose (AA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Input Password** (`inputpassword`): 1.3.1 info-and-relationships (A), 1.3.5 identify-input-purpose (AA), 2.4.13 focus-appearance (AAA), 3.2.5 change-on-request (AAA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 3.3.5 help (AAA), 4.1.3 status-messages (AA)
- **Input Tel** (`inputtel`): 1.3.5 identify-input-purpose (AA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Input Text** (`inputtext`): 1.3.5 identify-input-purpose (AA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Input Url** (`inputurl`): 1.3.5 identify-input-purpose (AA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Label** (`label`): 1.4.4 resize-text (AA), 1.4.10 reflow (AA)
- **Link** (`link`): 1.1.1 non-text-content (A), 1.3.1 info-and-relationships (A), 3.2.4 consistent-identification (AA), 3.2.5 change-on-request (AAA), 3.3.2 labels-or-instructions (A), 4.1.2 name-role-value (A)
- **List** (`lists`): 3.3.2 labels-or-instructions (A)
- **Loader** (`loader`): 2.2.1 timing-adjustable (A), 2.2.2 pause-stop-hide (A), 2.3.3 animation-from-interactions (AAA), 4.1.3 status-messages (AA), long-loading-updates
- **Preline** (`preline`): 1.4.4 resize-text (AA), 1.4.10 reflow (AA)
- **Progress** (`progress`): 1.1.1 non-text-content (A), 2.2.1 timing-adjustable (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Input Radios** (`radio`): 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Input Select** (`select`): 1.3.5 identify-input-purpose (AA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Subline** (`subline`): 1.4.4 resize-text (AA), 1.4.10 reflow (AA)
- **Summary** (`summary`): 3.3.2 labels-or-instructions (A)
- **Table** (`table`): 1.4.1 use-of-color (A), 1.4.11 non-text-contrast (AA), 2.4.2 page-titled (A), 3.3.2 labels-or-instructions (A), 4.1.2 name-role-value (A)
- **Task List** (`tasklist`): 3.3.2 labels-or-instructions (A)
- **Input Textarea** (`textarea`): 1.3.5 identify-input-purpose (AA), 3.3.1 error-identification (A), 3.3.2 labels-or-instructions (A), 4.1.3 status-messages (AA)
- **Title** (`title`): 1.4.4 resize-text (AA), 1.4.10 reflow (AA)
