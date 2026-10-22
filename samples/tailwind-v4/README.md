# Tailwind CSS v4 with KERN-UX

A Tailwind CSS v4 theme built from KERN's design tokens. Tailwind's utilities, and Tailwind components you paste in, render in KERN's colours, fonts, spacing, radii, breakpoints and light and dark themes, next to KERN's own components.

```bash
cd samples/tailwind-v4
npm install
npm run build   # or: npm run watch
```

Then open `index.html`. Each row shows a component three ways: KERN's markup, Tailwind utilities on KERN's tokens, and generic Tailwind markup with Tailwind's palette classes, remapped.

## Setup

```css
@layer theme, base, kern, components, utilities;

@import "tailwindcss";
@import "@kern-ux/native/dist/kern.min.css" layer(kern);
@import "./kern-theme.css";
@import "./kern-remap.css"; /* optional, for pasted components */
```

Link KERN's font as usual: `@kern-ux/native/dist/fonts/fira-sans.css`.

| File | Contents |
|---|---|
| [src/kern-theme.css](src/kern-theme.css) | The theme: semantic colour names, type roles, spacing, radii, shadows, breakpoints, the `dark:` variant and two fixes for KERN inside Tailwind. Imports `kern-tokens.css`. |
| [src/kern-tokens.css](src/kern-tokens.css) | Generated. Every KERN colour token `--kern-color-<name>` as the Tailwind colour `kern-<name>`. |
| [src/kern-remap.css](src/kern-remap.css) | Generated, optional. Tailwind's default palette, radii and shadows pointed at KERN's. |
| [scripts/kern-tokens.mjs](scripts/kern-tokens.mjs) | Writes the two generated files (`npm run tokens`) and checks them (`npm run check`). |

### Why a `kern` layer

Unlayered CSS beats every Tailwind layer, so with a plain `@import` of KERN, its `*:not(i) { font-family }` rule wins over `font-mono`. In the `kern` layer, KERN comes after Tailwind's preflight, so its components keep their look, and before the utilities, so `kern-btn w-full` works. Declare the order first: a layer that's named for the first time later lands after the utilities.

### Why `@theme inline`

Without `inline`, Tailwind sets `--color-primary: var(--kern-color-action-default-contextual)` once on `:root` and utilities read that. KERN defines its contextual tokens on `body` and redefines its tokens on `[data-kern-theme]`, `.kern-dark` and `.kern-level-*`, so a value resolved on `:root` is wrong below those, and the contextual ones don't exist on `:root` at all: built without `inline`, `bg-primary` comes out transparent. With `inline`, `bg-primary` compiles to `background-color: var(--kern-color-action-default-contextual)` and resolves on the element it styles.

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

## Tailwind components

Tailwind itself has no components; the component sets built on it name colours in one of two ways.

**Semantic names**, as in shadcn/ui and the sets built like it: `bg-primary`, `text-muted-foreground`, `border-input`. `kern-theme.css` defines these names, so the components render in KERN's colours without changes. With shadcn/ui, delete the `:root` and `.dark` colour blocks, the `@theme inline` block and the `@custom-variant dark` line that its CLI writes into your CSS, and import the files above.

**Palette classes**, as in Tailwind Plus and most copy-paste component sites: `bg-indigo-600`, `text-gray-500`, `rounded-lg`. `kern-remap.css` points each Tailwind family at the nearest KERN family by hue (indigo and blue at darkblue, gray and slate at neutral, sky and cyan at lightblue, amber at orange …), each step at the KERN step with the nearest OKLCH lightness, Tailwind's radii at KERN's three and its shadows at KERN's three elevations.

The steps go by lightness, not by name, because KERN's steps are calibrated by contrast: every KERN `-500` is 4.5:1 on white, every `-600` 6:1, every `-700` 8.5:1, while Tailwind's vary (`blue-500` is 3.8:1, `gray-500` 4.8:1). Over 30 text and background pairs common in Tailwind components, mapping `gray-500` to `neutral-500` by name drops 3 below 4.5:1, among them `text-gray-500` on `bg-gray-50`. Mapping by lightness drops 1, `text-white` on `bg-green-600`, which is 3.2:1 in Tailwind's own palette and 3.5:1 here.

## Limits

- **The theme changes values, not markup.** A remapped Tailwind button is still 36px tall with 14px text; KERN's is 48px with 18px and a 4px focus outline. For KERN-conformant UI, use KERN's components, or build on the tokens as the middle column of the demo does.
- **`dark:` in nested themes.** A light section inside a dark page still matches `dark:`, because a selector can't tell which themed ancestor is nearest. The token utilities are right at any depth.
- **KERN 2.8.2 pads every `<textarea>` with `!important`** (`padding: 8px 16px`). Important declarations in an earlier layer beat those in later ones, so no utility, `!p-2` included, can override it. Where a Tailwind textarea needs other padding, set it with `!important` in an earlier layer: `@layer base { .notes { padding: 6px 12px !important; } }`.
- **Preflight.** Rendering all 322 examples from [knowledge/](../../knowledge/components) in Chromium, KERN's components look the same with and without Tailwind's preflight, given the dialog fix in `kern-theme.css`. What changes is markup without KERN classes: preflight removes the body margin, unstyles bare headings and lists, and sets `line-height: 1.5` on the root. If a page is KERN components with Tailwind only for layout, leave preflight out and all 322 render identically:

  ```css
  @layer theme, base, kern, components, utilities;
  @import "tailwindcss/theme.css" layer(theme);
  @import "tailwindcss/utilities.css" layer(utilities);
  ```

- **Fira Mono** isn't part of `@kern-ux/native`; without it, `font-mono` falls back to the system's monospace font.

## Updating KERN

After updating `@kern-ux/native` or `tailwindcss`, run `npm run tokens` to regenerate `kern-tokens.css` and `kern-remap.css`. `npm run check` fails when either is stale or when a stylesheet in `src/` names a token KERN doesn't define, which is how a renamed token shows up: KERN has renamed tokens between releases, for example `--kern-typography-font-size-static-small` to `--kern-typography-font-size-small-static`.
