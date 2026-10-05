<!-- message 1: resource kern://guides/accessibility (text/markdown, 12600 bytes) -->

<!-- message 2: text -->
Review this HTML against KERN's accessibility rules and rebuild it with the kern tools:

```html
<h1>Bürgerbüro</h1>
<h3>Öffnungszeiten</h3>
<img src="buergerbuero.jpg">
<input type="text" id="name" placeholder="Name">
<button class="kern-button">Senden</button>
```

The accessibility guide above lists what `validate_html` checks, KERN's accessibility rules, and the WCAG criteria each component leaves to the page. Work in this order:

1. **Check:** call `validate_html` with the HTML as it is.
2. **Problems:** collect them for your answer: the check's issues by `ruleId`, and what the check can't see by the WCAG criterion the guide lists for the component, such as a link made to look like a button (4.1.2) or a heading that doesn't say what its part is about (2.4.6).
3. **Rebuild:** build the same content again with the kern tools instead of patching the markup: `render_page` for a whole page, `render_composition` for a part. Use `field` blocks in a `form` block for inputs, `section` blocks for headed parts, and the component tools, such as `get_table` or `get_button`, as `html` blocks for the rest. Keep every text, link, value and option, and replace classes KERN doesn't define. An image keeps its `src` and gets an `alt` text that says what it shows.
4. **Render:** call `render_page` or `render_composition` with `locale: "de"` and `strict: true`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with `validate_html`.

Answer with the fix list in German, one line per problem: its rule, how the rebuild fixed it, and what a person still has to check, such as an `alt` text written without seeing the image. Then the final HTML from the tool, verbatim, in one ```html block, not a description of it.
