---
name: kern-review
description: Load this skill first, before you call any KERN tool, whenever a task gives you existing HTML, a whole page or a part of one, to check, review, fix or correct against KERN's accessibility or markup rules, or to rebuild with KERN components. It says how to check it with the KERN UX MCP server's validate_html, rebuild it with the KERN tools, and list the fixes by rule.
license: EUPL-1.2
compatibility: Needs the KERN UX MCP server (@leonio/kern-ux-mcp).
---

# KERN review

Review the HTML the person gives you against KERN's accessibility rules, and rebuild it with the KERN UX MCP server's tools instead of patching it. The tools are named here without the prefix your client adds: `validate_html` may show as `mcp__kern-ux__validate_html`.

The fix list and the page's text are in the language the person writes in, German when it's unclear, and the render call gets the same `locale`: `"de"` or `"en"`.

[references/accessibility.md](references/accessibility.md) lists what `validate_html` checks, KERN's accessibility rules, and the WCAG criteria each component leaves to the page. For one component in detail, call `get_component_docs`.

## Work in this order

1. **Check:** call `validate_html` with the HTML as it is.
2. **Problems:** collect them for your answer: the check's issues by `ruleId`, and what the check can't see by the WCAG criterion the reference lists for the component, such as a link made to look like a button (4.1.2) or a heading that doesn't say what its part is about (2.4.6).
3. **Rebuild:** build the same content again with the kern tools instead of patching the markup: `render_page` for a whole page, `render_composition` for a part. Use `field` blocks in a `form` block for inputs, `section` blocks for headed parts, and the component tools, such as `get_table` or `get_button`, as `html` blocks for the rest. Keep every text, link, value and option, and replace classes KERN doesn't define. An image keeps its `src` and gets an `alt` text that says what it shows.
4. **Render:** call `render_page` or `render_composition` with the `locale` and `strict: true`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with `validate_html`.

Answer with the fix list, one line per problem: its rule, how the rebuild fixed it, and what a person still has to check, such as an `alt` text written without seeing the image. Then the final HTML from the tool, verbatim, in one ```html block, not a description of it.
