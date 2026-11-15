# KERN guide: layout

How our tools lay out pages and columns on KERN's CSS Grid utilities, and KERN's guidance on containers, breakpoints and spacing.

## How our tools do it

- **Page:** `render_page` puts the `h1` and the blocks in `<main class="kern-container kern-flex kern-flex-col kern-gap-lg">`: centred, padded at the sides, stacked with KERN's large gap. The header and footer have containers of their own.
- **Columns:** `get_grid`, grid blocks, `get_card_group` and the page footer use `kern-grid kern-grid-cols-1 kern-grid-cols-{n}-md kern-gap-lg`: one column on small screens, `n` equal columns (1 to 12) from the md breakpoint (768 px) up, 24 px apart.
- **A div of its own:** the grid always sits in a plain `div`. KERN removes a `kern-container`'s padding when a `kern-grid` is its direct child, which puts the content against the screen edge. An `html` block with a `kern-grid` at its top level gets the same `div`.
- **Columns of different widths:** put `kern-col-{n}-md` on the items of a `kern-grid kern-grid-cols-1 kern-grid-cols-12-md`, e.g. 8 and 4.
- **Not:** the container grid (`kern-row`, `kern-col-md-*`), which KERN deprecates; don't mix it with `kern-grid`. A plain `kern-grid` has 12 columns and no gap.
- **Checks:** `validate_html` warns about a grid right inside a container (`layout.grid_in_container`) and one whose column counts all start at a breakpoint (`layout.grid_columns_small`).

### Example: `get_grid`

```json
{
  "includeHeading": true,
  "headingText": "Unsere Leistungen",
  "columnsContent": [
    [
      {
        "kind": "text",
        "text": "Wohngeld"
      }
    ],
    [
      {
        "kind": "text",
        "text": "Elterngeld"
      }
    ],
    [
      {
        "kind": "text",
        "text": "Kindergeld"
      }
    ]
  ]
}
```

```html
<div class="kern-container">
  <div class="kern-flex kern-flex-col kern-gap-lg">
    <h2 class="kern-heading-medium">Unsere Leistungen</h2>
    <div class="kern-grid kern-grid-cols-1 kern-grid-cols-3-md kern-gap-lg">
      <div>
        <p class="kern-body">Wohngeld</p>
      </div>
      <div>
        <p class="kern-body">Elterngeld</p>
      </div>
      <div>
        <p class="kern-body">Kindergeld</p>
      </div>
    </div>
  </div>
</div>
```

## What to use when

- **Was verwende ich wann?:** For new projects and actively developed layouts, CSS Grid is the preferred choice: it offers more precise two-dimensional control and a more modern code standard.
- **CSS Grid Hilfsklassen (2D):** For the global page layout and complex two-dimensional structures, such as pages with header, sidebar, main and footer, or tile grids with variable heights and widths. Layout-first: you define the grid and the content follows. Gives full control over rows and columns at once.
- **CSS-Flex Hilfsklassen (1D):** For fine alignment inside components, such as centring icons, distributing navigation links or aligning buttons in cards. Content-first: the size of the content drives the distribution. Point-wise control, for example with kern-justify-content-between, without a fixed column system.

Source: [Layout components](https://www.kern-ux.de/komponenten/layout/index) on kern-ux.de

## Containers and breakpoints

- **Kern Container:** .kern-container is a primary layout element: it centres the whole page content horizontally and limits it to a readable maximum width. It should be the direct child of the body tag or of the main layout area.
- **Kern Container Fluid:** .kern-container-fluid is a variant without a max-width: it always takes the full viewport width at every breakpoint. It is typically used to keep the horizontal padding at the page edges while content fills the available area, ideal for elements that must span the full width.
- **Verfügbare Breakpoints:** Same breakpoints as the grid system: no suffix is always active (mobile first), -sm from 576px, -md from 768px, -lg from 992px, -xl from 1200px, -xxl from 1600px. kern-mx-auto centres a block element with a fixed width.

Source: [Utilities](https://www.kern-ux.de/komponenten/layout/hilfsklassen) on kern-ux.de

- **einspaltige Layouts:** Single-column layouts can produce very wide text blocks on larger screens, so keep line length in a comfortable range, ideally about 60 to 80 characters, and watch this at every breakpoint. Offsets let you create narrower columns and clearer reading structures on any device.

Source: [Layout](https://www.kern-ux.de/design-system/foundations/layout) on kern-ux.de

## Spacing

- **Space-Token (Padding / Gap / Margin):** Lists the space tokens used for padding, gap and margin, from --kern-metric-space-none at 0 through --kern-metric-space-default at 16px up to --kern-metric-space-11x-large at 192px.
- **Umgang mit Weißraum:** Whitespace signals how strongly elements belong together: the closer they are, the stronger the relation, and the wider the gap, the more clearly groups and patterns become visible. Larger dimensions are built by combining smaller ones through auto-layout in Figma or padding in CSS.
- **Stacking:** Body and Heading components stack directly. When further elements such as a button or a card follow, group them with whitespace: spacing scales with text size, so Heading-Large pairs with --kern-metric-space-large, while text and a following button use --kern-metric-space-default.
- **Space Kombination beim Stacking:** Stacking starts from the text: a Title-Default combines with --kern-metric-space-default and a Title-Small with --kern-metric-space-small. Within a group, vertical spacing is smaller than horizontal, for example --kern-metric-space-default vertically and --kern-metric-space-large horizontally.

Do:

- Combine several space tokens to create larger whitespace instead of introducing new values.
- Keep elements that belong together close and separate unrelated groups with more whitespace.
- Scale stacking space to the text size, for example --kern-metric-space-large next to Heading-Large.
- Give grouped elements more space horizontally than vertically, for example --kern-metric-space-large across and --kern-metric-space-default down.

Don't:

- Do not place a large gap between text and a following button; keep them together with --kern-metric-space-default so the law of proximity still holds.

Source: [Sizes and spacing](https://www.kern-ux.de/design-system/foundations/groesse-und-abstaende) on kern-ux.de

- **Gap (Abstände):** Gap classes space flex and grid elements through the gap property, without extra margins or paddings. All KERN spaces can be used as values.
- **Stack:** .kern-stack is a vertical flex container with the standard md gap. .kern-stack-{size} changes the spacing for all screen sizes; sizes are none, xxs, xs, sm, md, lg, xl. .kern-stack-{size}-{breakpoint} makes it responsive.

Source: [Utilities](https://www.kern-ux.de/komponenten/layout/hilfsklassen) on kern-ux.de
