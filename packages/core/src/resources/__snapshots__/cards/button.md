# KERN Button

`kern://components/button` · status: stable · KERN ID: `button` · tool: `get_button`

Also called: Schaltfläche, Befehlsschaltfläche, Schalter, Push Button.

Triggers an action, named by its label, in primary, secondary or tertiary importance; one primary per page.

## When to use

- When the user triggers an action such as confirming, submitting, changing data or moving to the next step.

## Do

- Use only one primary button per page.
- Use mixed case labels rather than all capitals.
- When buttons of different importance sit together, highlight the more important one.
- Place buttons side by side rather than stacked when space allows.

## Don't

- Avoid two-line or multi-line button labels.
- Do not use buttons inline in texts; use text links instead.
- Avoid inactive buttons where possible; their contrast is poor and they are easily confused with other buttons.

## Similar components

- Link (`get_link`)

## Accessibility

The WCAG criteria KERN's docs leave to the implementation:

- 1.1.1 non-text-content (A): implementation-dependent
- 1.3.1 info-and-relationships (A): implementation-dependent
- 2.4.3 focus-order (A): implementation-dependent
- 3.3.2 labels-or-instructions (A): implementation-dependent
- 4.1.2 name-role-value (A): implementation-dependent

## Links

- Documentation: https://www.kern-ux.de/komponenten/button
- Source: https://gitlab.opencode.de/kern-ux/kern-ux-plain/-/tree/v2.8.2/src/scss/core/components/_button.scss
- Figma: https://www.figma.com/community/file/1624024563231427311

## The tool: `get_button`

KERN UX: HTML for a button. Required: label. variant primary (default), secondary or tertiary; five sizes; an optional icon. labelVisibility 'sr-only' makes an icon-only button that keeps an accessible name. For actions; to navigate to another page, use get_link.

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `variant` | "primary", "secondary", "tertiary" |  | "primary" | Visual weight: primary (the default), secondary or tertiary. |
| `label` | string | yes |  | Button text. Required for icon-only buttons too: it becomes their sr-only label. |
| `size` | "x-small", "small", "default", "large", "x-large" |  | "default" | Height: x-small 32 px, small 40, default 48, large 56, x-large 64. |
| `block` | boolean |  | false | Full width (kern-btn--block). |
| `type` | "button", "submit" |  | "button" | HTML button type. submit sends the enclosing form; button (the default) does nothing on its own. |
| `disabled` | boolean |  | false | Disabled. |
| `icon` | object |  |  | Decorative icon (aria-hidden="true"); icon.position sets its side. |
| `icon.name` | string | yes |  | KERN icon name, e.g. arrow-forward. list_icons has them all. |
| `icon.position` | "left", "right" |  | "left" | Which side of the label the icon sits on. |
| `labelVisibility` | "visible", "sr-only", "sr-only-mobile" |  | "visible" | sr-only hides the label visually, for an icon-only button; sr-only-mobile hides it on small screens only. |

Every tool also takes `locale` (`de` or `en`; `de` by default) and `strict` (fail on validation errors).

### Example

```json
{
  "label": "More Info",
  "variant": "primary"
}
```

```html
<button type="button" class="kern-btn kern-btn--primary">
    <span class="kern-label">More Info</span>
</button>
```

### Validation rules

`validate_html` checks this markup for:

- `button.icon_only_sr_label` (error): A button with only an icon has a non-empty sr-only label (.kern-label.kern-sr-only).
