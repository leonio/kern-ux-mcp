<!-- message 1: resource kern://guides/layout (text/markdown, 6896 bytes) -->

<!-- message 2: resource_link kern://components/kopfzeile "KERN Kopfzeile" -->

<!-- message 3: resource_link kern://components/heading "KERN Heading" -->

<!-- message 4: resource_link kern://components/grid "KERN CSS Grid" -->

<!-- message 5: resource_link kern://components/card "KERN Card" -->

<!-- message 6: resource_link kern://components/link "KERN Link" -->

<!-- message 7: text -->
Build a page with the kern tools: Home page of the Musterstadt citizen portal

The layout guide above explains how our tools lay out a page and its columns, and the cards linked above describe its parts. Work in this order:

1. **Frame:** one `render_page` call. `header` with the site's `title` and its `navigation` (up to 8 links, `current: true` on this page's link), the page's `heading` (its only `h1`), and a `footer` with up to four link `columns` and a `note`. `kopfzeile: true` only for an official federal website. `document: true` returns a complete HTML document; leave it out for a fragment.
2. **Sections:** in `contentBlocks`, a short intro as a `text` block, then one `section` block per section, each with a `headingText`, which becomes an `h2`.
3. **Columns:** things side by side, such as services or contacts, go in a `grid` block, one inner list per column. Give each a `card` with its title one level below its section (`header.titleLevel: 3`) and its actions in `footer`. No card directly in a card.
4. **Content:** the block kind for what each part shows: `field` blocks in a `form` block (with `actions: { submitLabel }`) for a form, `disclosure` blocks for questions that expand. A component without a block kind, such as a table (`get_table`) or a notice (`get_alert`), comes from its tool, added as an `html` block. All text in English.
5. **Render:** call `render_page` with `locale: "en"` and `strict: true`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with `validate_html`.

Answer with the final HTML from the tool, verbatim, in one ```html block, not a description of it.
