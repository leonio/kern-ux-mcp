# KERN CSS Grid

`kern://components/grid` · status: stable · tool: `get_grid`

Low-level access to CSS Grid for complex layouts without custom CSS. A wrapper .kern-grid defines the grid with display: grid and replaces the classic .kern-row architecture; columns and gaps are set through modifier classes.

## Links

- Documentation: https://www.kern-ux.de/komponenten/layout/hilfsklassen#css-grid

## The tool: `get_grid`

KERN UX: HTML for 1 to 12 equal-width columns on KERN's CSS Grid utilities (kern-grid kern-grid-cols-1 kern-grid-cols-{n}-md kern-gap-lg), one column on small screens. For columns of different widths, see get_utility_reference.

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `columns` | integer, 1 to 12 |  |  | Equal-width columns, 1 to 12; one column on small screens. Default: one per columnsContent list, or 2. |
| `containerFluid` | boolean |  | false | kern-container-fluid instead of kern-container: the full viewport width, e.g. for a banner. |
| `rowAlignment` | "start", "center", "end" |  |  | Vertical alignment of the columns (kern-align-items-*). |
| `includeHeading` | boolean |  | false | Adds a heading above the grid. |
| `headingText` | string |  |  | Text of the heading, with includeHeading: true. |
| `headingLevel` | 1 or 2 or 3 or 4 or 5 or 6 |  | 2 | Level of the heading, h1 to h6. Don't skip levels. |
| `columnsContent` | array of array of block: text, html, badge, field |  |  | Optional content per column, one block list per column: text, html, badge or field blocks. For cards in a grid use get_card_group; for other containers in columns, use render_composition with a grid block. |

Every tool also takes `locale` (`de` or `en`; `de` by default) and `strict` (fail on validation errors).

### Example

```json
{
  "columns": 3,
  "includeHeading": true,
  "headingText": "Partner",
  "headingLevel": 2
}
```

```html
<div class="kern-container">
  <div class="kern-flex kern-flex-col kern-gap-lg">
    <h2 class="kern-heading-medium">Partner</h2>
    <div class="kern-grid kern-grid-cols-1 kern-grid-cols-3-md kern-gap-lg">
      <div>
        <p class="kern-body">Spalte 1</p>
      </div>
      <div>
        <p class="kern-body">Spalte 2</p>
      </div>
      <div>
        <p class="kern-body">Spalte 3</p>
      </div>
    </div>
  </div>
</div>
```

### Validation rules

`validate_html` checks this markup for:

- `layout.grid_in_container` (warning): A kern-grid sits in a div of its own, not directly in kern-container, which would lose its padding.
- `layout.grid_columns_small` (warning): A kern-grid that sets its columns from a breakpoint up also sets them for small screens (kern-grid-cols-1).
