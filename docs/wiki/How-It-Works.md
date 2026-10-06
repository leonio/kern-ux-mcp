# How it works

The server gives an AI assistant tools for the KERN-UX design system. The assistant calls the tools; the server returns HTML that uses KERN's classes and markup, ready to paste into a page that loads the KERN CSS.

```
You ──prompt──▶ AI assistant ──tool call (JSON)──▶ kern-ux-mcp ──▶ KERN HTML (+ warnings)
                     ▲                                                   │
                     └───────────────── result ──────────────────────────┘
```

The server holds no state and calls nothing on the internet. All KERN knowledge ships inside the package.

## The tools

There are 54 tools, in four kinds:

| Kind | Tools | Use them for |
|---|---|---|
| **Pages and layouts** | `render_page`, `render_composition` | A whole page, or a nested layout of sections, grids, cards, forms and multi-step forms in one call. Start here for anything bigger than one component. |
| **Single components** | `get_button`, `get_inputtext`, `get_card`, `get_table`, `get_alert` … (one per component) | One component with its options. |
| **Look-ups** | `list_components_by_category`, `get_component_docs`, `list_icons`, `get_tokens`, `get_utility_reference` | Finding the right component, icon, CSS variable or utility class. |
| **Validation** | `validate_html` | Checking HTML (yours or the model's) against KERN's accessibility rules. |

Most rendering tools take:
- `locale`: `de` (default) or `en` for the built-in texts.
- `strict`: when `true`, the tool fails if the HTML breaks an accessibility rule, instead of returning it with warnings.

## Getting good results

- Ask for the result, not the tool: *"Build a contact form with name, email and a message, in KERN"*. The assistant picks the tools.
- For forms and pages, mention **accessibility** or **strict** if you want the assistant to validate before it answers.
- Load the KERN CSS in the page you paste the HTML into. The server returns markup only.

## When something is wrong

- **Wrong arguments**: the tool answers with an error result (`isError: true`) that lists each problem and often a working example. Assistants read it and retry on their own.
- **Strict failures**: also an error result, listing the accessibility errors.
- **Unknown tool name**: a protocol error. Usually a client with an old tool list: restart the server in your client.

## Coming before 2.0.0

- **Resources**: component cards and guides for forms, layout and accessibility, which clients can attach as context.
- **Prompts**: `create_page_layout`, `create_input_form` and `review_kern_html` as ready-made starting points.
- Layout moves to KERN's CSS Grid utilities.

## Deeper reading

- [Codebase guide](https://github.com/leonio/kern-ux-mcp/blob/main/docs/codebase-guide.md): how the code is organised
- [Plan v2](https://github.com/leonio/kern-ux-mcp/blob/main/docs/plan-v2/README.md): how 2.0 was built, and what's open after it
