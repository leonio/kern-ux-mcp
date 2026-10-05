# KERN Pattern

`kern://components/pattern` · status: stable · tool: `get_pattern`

## The tool: `get_pattern`

KERN UX: KERN's header pattern as fixed HTML (flex and grid variants). There is no footer pattern: render_page renders a page with header and footer, and render_composition can build one from a section and a 4-column grid.

### Fields

No fields of its own.

Every tool also takes `locale` (`de` or `en`; `de` by default) and `strict` (fail on validation errors).
