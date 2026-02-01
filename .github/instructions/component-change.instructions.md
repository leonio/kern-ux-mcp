---
description: "Use when changing a KERN UX component tool, schema, template, or focused runtime tests. Covers schema updates, template rendering changes, tool-builder wiring, and the nearest validation path."
applyTo: "src/ux/schemas/**, src/ux/templates/**, src/ux/tool-builders/**, src/ux/tools.ts, src/ux/**/*.test.ts"
---

# Component Change Rules

- When changing component behavior, update the owning schema, the owning template, and the test file(s) co-located with or directly importing the changed schema, template, or tool-builder (for example `*.test.ts` files in the same directory or one level up).
- Keep the public MCP contract stable unless the task explicitly requires a contract change.
- When a contract change is required, document the breaking change in a comment at the top of the modified schema file and flag it explicitly in your response before proceeding.
- Tool names follow `get_<component-id>` and must not be renamed.
- `checkboxlist` is intentionally merged into `get_checkbox`; do not separate them.
- `strict: true` must always throw on validation failures; never soften this behavior.
- Prefer small local changes over broad refactors. If a file mostly forwards or registers behavior, make changes in the file that actually computes or renders the behavior, not in files that only forward or register it, unless the registration itself must change.
- Validate with the narrowest relevant command first: touched tests, then typecheck or lint if no narrower behavior check exists.