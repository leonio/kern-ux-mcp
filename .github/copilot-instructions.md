# Copilot Instructions

- This repo is a TypeScript MCP server for KERN UX. Runtime flow is: `src/server.ts` -> `src/ux/tools.ts` -> tool builders in `src/ux/tool-builders/` -> component schemas in `src/ux/schemas/` -> HTML templates in `src/ux/templates/`.
- `src/ux/registry.json` is generated runtime data, not source. It is built by `tools/manifest/build-manifest.ts` from `kern-ux-plain` stories, markdown component docs, and the reviewed overlay in `docs/guidance-overlay.json`.
- Never edit generated artifacts directly: do not hand-edit `src/ux/registry.json` or `dist/ux/registry.json`. Change source inputs, then regenerate.
- Keep the public MCP contract stable unless the task explicitly changes it. Important rules: tool names stay `get_<component-id>`, `checkboxlist` remains merged into `get_checkbox`, and `strict: true` must keep throwing on validation failures.
- When changing component behavior, update the owning schema, the owning template, and the nearest focused tests together. Prefer small local changes over broad refactors.
- When changing guidance, keep extracted guidance and reviewed guidance separate. `guidance` and `guidanceSections` come from source extraction; `reviewedGuidance` is additive, build-time merged, and must be evidence-backed.
- Prefer checked-in local evidence in this order: docs snapshots if present, `kern-ux-plain` stories/source, local schemas/templates, local tests, then audit notes such as `docs/contributor-guide.md`.
- In German user-facing text, use proper German spelling with umlauts and `ß` where appropriate: write `für`, `über`, `größer`, `Hinweise` instead of ASCII fallbacks like `fuer`, `ueber`, or `groesser`, unless a file format, identifier, or protocol requires ASCII.