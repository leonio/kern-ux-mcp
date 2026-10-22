# @leonio/kern-ux-tailwind

[KERN-UX](https://www.kern-ux.de/) as a Tailwind CSS v4 theme. Tailwind's utilities, and Tailwind components you paste in, render in KERN's colours, fonts, spacing, radii, breakpoints and light and dark themes, next to KERN's own components.

```bash
npm install @leonio/kern-ux-tailwind @kern-ux/native tailwindcss
```

```css
@import "tailwindcss";
@import "@leonio/kern-ux-tailwind";
@import "@leonio/kern-ux-tailwind/remap.css"; /* optional, for pasted components */
```

Import it after `tailwindcss`. It brings in KERN's stylesheet itself, in Tailwind's `base` layer after preflight: KERN's components keep their look, and utilities still override them, as in `kern-btn w-full`. Don't load `kern.min.css` a second time with a `<link>`: unlayered, it would beat every utility. Load KERN's font as usual, from `@kern-ux/native/dist/fonts/fira-sans.css`.

The [sample](https://github.com/leonio/kern-ux-mcp/tree/main/samples/tailwind-v4) shows KERN's components, Tailwind components on KERN's tokens and remapped Tailwind markup side by side.

## What you get

| Utilities | KERN |
|---|---|
| `bg-primary`, `text-primary-foreground` | `action-default-contextual`, `action-on-default-contextual` |
| `bg-background`, `bg-card`, `bg-popover`, `text-foreground` | `layout-background-default-contextual`, `layout-text-default-contextual` |
| `bg-muted`, `bg-secondary`, `bg-accent`, `text-muted-foreground` | `layout-layer-surface-contextual`, `layout-text-muted-contextual` |
| `border-border`, `border-input`, `outline-ring`, `bg-destructive` | `decorative-border-`, `form-input-border-`, `action-focus-default-`, `feedback-danger-contextual` |
| `bg-kern-<name>`, `text-kern-<name>`, … | every `--kern-color-<name>`, the palette included: `bg-kern-feedback-info-background-contextual`, `text-kern-darkblue-700` |
| `text-kern-body-small`, `text-kern-body`, `text-kern-body-large`, `text-kern-label`, `text-kern-heading-small` … `-display` | KERN's type roles, each with its size, line height and weight; the headings grow at 768px as KERN's do |
| `p-kern-default`, `gap-kern-small`, … | `metric-space-*`. Tailwind's own scale already matches KERN's 4px grid: `p-4` is `space-default`. |
| `rounded-kern-small`, `-default`, `-large` | `metric-border-radius-*` |
| `shadow-kern-low`, `-default`, `-high` | `shadow-elevation-*` |
| `sm:` `md:` `lg:` `xl:` `2xl:` | KERN's grid breakpoints: 576, 768, 992, 1200 and 1600px |
| `dark:` | KERN's theme: the system preference, unless an ancestor sets `data-kern-theme` or `.kern-light`/`.kern-dark` |
| `font-sans`, `font-mono` | Fira Sans, Fira Mono |

All of it is `@theme inline`: `bg-primary` compiles to `background-color: var(--kern-color-action-default-contextual)` and resolves on the element it styles. KERN defines its contextual tokens on `body` and redefines its tokens on `[data-kern-theme]`, `.kern-dark` and `.kern-level-*`, so a value Tailwind resolved once on `:root` would be wrong below those, or, for the contextual ones, missing.

## Tailwind components

Tailwind itself has no components; the component sets built on it name colours in one of two ways.

**Semantic names**, as in shadcn/ui and the sets built like it: `bg-primary`, `text-muted-foreground`, `border-input`. This package defines these names, so the components render in KERN's colours without changes. With shadcn/ui, delete the `:root` and `.dark` colour blocks, the `@theme inline` block and the `@custom-variant dark` line that its CLI writes into your CSS, and import this package instead.

**Palette classes**, as in Tailwind Plus and most copy-paste component sites: `bg-indigo-600`, `text-gray-500`, `rounded-lg`. `remap.css` points each Tailwind family at the nearest KERN family by hue (indigo and blue at darkblue, gray and slate at neutral, sky and cyan at lightblue, amber at orange …), each step at the KERN step with the nearest OKLCH lightness, Tailwind's radii at KERN's three and its shadows at KERN's three elevations.

The steps go by lightness, not by name, because KERN's steps are calibrated by contrast: every KERN `-500` is 4.5:1 on white, every `-600` 6:1, every `-700` 8.5:1, while Tailwind's vary (`blue-500` is 3.8:1, `gray-500` 4.8:1). Over 30 text and background pairs common in Tailwind components, mapping `gray-500` to `neutral-500` by name drops 3 below 4.5:1, among them `text-gray-500` on `bg-gray-50`. Mapping by lightness drops 1, `text-white` on `bg-green-600`, which is 3.2:1 in Tailwind's own palette and 3.5:1 here.

## Limits

- **The theme changes values, not markup.** A remapped Tailwind button is still 36px tall with 14px text; KERN's is 48px with 18px and a 4px focus outline. For KERN-conformant UI, use KERN's components, or build on the tokens.
- **`dark:` in nested themes.** A light section inside a dark page still matches `dark:`, because a selector can't tell which themed ancestor is nearest. The token utilities are right at any depth.
- **KERN 2.8.2 pads every `<textarea>` with `!important`** (`padding: 8px 16px`). Important declarations in an earlier layer beat those in later ones, so no utility, `!p-2` included, can override it. Where a Tailwind textarea needs other padding, override it in the same layer with a class: `@layer base { .notes { padding: 6px 12px !important; } }`.
- **Preflight.** Rendering the 322 examples of KERN's components in Chromium, they look the same with and without Tailwind's preflight, given two fixes this package adds: font families inherit again below `body`, and KERN's dialog keeps its centring. What preflight changes is markup without KERN classes: it removes the body margin, unstyles bare headings and lists, and sets `line-height: 1.5` on the root. If a page is KERN components with Tailwind only for layout, leave preflight out:

  ```css
  @layer theme, base, components, utilities;
  @import "tailwindcss/theme.css" layer(theme);
  @import "tailwindcss/utilities.css" layer(utilities);
  @import "@leonio/kern-ux-tailwind";
  ```

- **Fira Mono** isn't part of `@kern-ux/native`; without it, `font-mono` falls back to the system's monospace font.

## Versions

Each release is tested with `@kern-ux/native` 2.8.2 and Tailwind CSS 4.1 to 4.3. KERN has renamed tokens between releases, so the peer range on `@kern-ux/native` stays within one minor version; a release for the next one follows once its tokens are checked.
