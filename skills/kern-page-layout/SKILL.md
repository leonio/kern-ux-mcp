---
name: kern-page-layout
description: Load this skill first, before you call any KERN tool, whenever a task asks for a complete KERN page with a header, a main part and a footer, such as a start page or a service page, also when the page holds a form, a table or an FAQ. It says how to build the whole page with one render_page call of the KERN UX MCP server, with the header and its navigation, the main heading, the sections with grids, cards, tables and FAQs, and the footer, on KERN's grid. For a form on the page, load kern-forms too.
license: EUPL-1.2
compatibility: Needs the KERN UX MCP server (@leonio/kern-ux-mcp).
---

# KERN page layout

Build the page with one `render_page` call from the KERN UX MCP server, and render it strictly. The tools are named here without the prefix your client adds: `render_page` may show as `mcp__kern-ux__render_page`.

The page's text is in the language the person writes in, German when it's unclear, and the render call gets the same `locale`: `"de"` or `"en"`. Take the site, the page's purpose and its sections from the request; where it names none, choose the sections from the purpose.

[references/layout.md](references/layout.md) explains how our tools lay out a page and its columns on KERN's grid. For one component in detail, such as a card or the Kopfzeile, call `get_component_docs`.

## Work in this order

1. **Frame:** one `render_page` call. `header` with the site's `title` and its `navigation` (up to 8 links, `current: true` on this page's link), the page's `heading` (its only `h1`), and a `footer` with up to four link `columns` and a `note`. `kopfzeile: true` only for an official federal website. `document: true` returns a complete HTML document; leave it out for a fragment.
2. **Sections:** in `contentBlocks`, a short intro as `{ kind: "text", text }`, then one section block per section, in the order asked: `{ kind: "section", section: { headingText, contentBlocks } }`. Its `headingText` becomes an `h2`.
3. **Columns:** things side by side, such as services or contacts, go in `{ kind: "grid", grid: { columnsContent: [[…], […]] } }`, one inner list per column. Give each a card, `{ kind: "card", card: { header: { title, titleLevel: 3 }, body, footer } }`: its title one level below its section, its actions in `footer`. No card directly in a card.
4. **Content:** the block kind for what each part shows: `field` blocks in a `form` block (with `actions: { submitLabel }`) for a form, as kern-forms describes, and `disclosure` blocks for questions that expand. A component without a block kind, such as a table (`get_table`) or a notice (`get_alert`), comes from its tool, added as an `html` block. All text in the page's language.
5. **Render:** call `render_page` with the `locale` and `strict: true`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with `validate_html`.

Answer with the final HTML from the tool, verbatim, in one ```html block, not a description of it.
