# Resources

Besides its tools, the server offers Markdown resources that a client can attach to a conversation, for example from VS Code's context picker or with an `@`-mention in Claude:

- `kern://components/{id}`: a card for each component the server knows, 48 in all. It has KERN's guidance (when to use it, do's and don'ts, similar components, the WCAG criteria left to the page) and our tool with its fields, a rendered example and the validation rules that apply. `get_component_docs` links to the card.
- `kern://guides/forms`, `kern://guides/layout` and `kern://guides/accessibility`: what our tools do, next to KERN's guidance on the topic.

The tools work without them: a resource reaches the model only when the client or the user brings it in. A [skill](./skills.md) is different: the client offers it to the model, which loads it when a task needs it.

The resources only change with a release. On protocol `2026-07-28`, lists and reads are marked cacheable for an hour.
