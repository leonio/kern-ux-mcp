# Prompts

The server offers three prompts: workflows over the tools that you start from the client. With the server named `kern-ux`, that's `/mcp.kern-ux.create_input_form` in VS Code and `/mcp__kern-ux__create_input_form` in Claude Code.

| Prompt | Arguments | What it does |
|---|---|---|
| `create_input_form` | `purpose`, `fields`, `steps`, `locale` | A form from a list of fields: input types, fieldsets, required and optional fields, and the error summary. Given `steps`, separated by semicolons, a multi-step form with the step list, progress, and a summary in the step for checking the answers. |
| `create_page_layout` | `purpose`, `sections`, `locale` | A whole page from `render_page`: the header with navigation, the `h1`, one section per entry with grids and cards, and the footer. |
| `review_kern_html` | `html`, `locale` | Checks the HTML with `validate_html`, rebuilds it with the tools, and answers with a fix list and the corrected HTML. The fix list says what a person still has to check, such as an `alt` text written without seeing the image. |

Each prompt embeds the guide it relies on, links the component cards it uses, renders with `strict: true`, and asks for the final HTML verbatim. `locale` is `de` (the default) or `en` and sets the language of the page's text; the prompts themselves are in English.

The [`kern-ux-forms` skill](./skills.md) follows the same workflow as `create_input_form`, for clients where the assistant picks it up on its own.
