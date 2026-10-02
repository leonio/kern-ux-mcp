---
description: "Use when updating reviewed guidance, overlay schema, guidance workflow docs, or manifest merge and validation logic. Covers docs/guidance-overlay.json, docs/guidance-overlay.schema.json, docs/guidance-overlay-workflow.md, and tools/manifest changes."
applyTo: "docs/guidance-overlay.json, docs/guidance-overlay.schema.json, docs/guidance-overlay-workflow.md, tools/manifest/**"
---

# Guidance Overlay Rules

> **Since R4b (2026-10-02) the overlay has no entries.** Reviewed notes about this repo's tools (where a tool deliberately differs from upstream KERN) live in `packages/core/src/ux/tool-notes.ts`, which `get_component_docs` serves as `reviewedGuidance`. Add or correct them there, with the same evidence rules as below. Knowledge about KERN components will come from the external registry generator ([docs/plan-v2/registry-requirements.md](../../docs/plan-v2/registry-requirements.md)). The overlay and `tools/manifest/*` retire once that generator reaches parity.

- Treat `docs/guidance-overlay.json` and `docs/guidance-overlay.schema.json` as checked-in source inputs. Do not edit `packages/core/src/ux/registry.json` directly.
- If a change logically requires updating `packages/core/src/ux/registry.json`, surface this as a blocker in your response and explain which upstream source file should be changed instead so the registry is regenerated correctly.
- Add new `reviewedGuidance` entries freely, and correct or update existing ones as needed, but never delete or overwrite the extracted `guidance` or `guidanceSections` fields that were produced by automated extraction.
- Every reviewed-guidance statement must stay evidence-backed and tied to a specific, cited location in the repo, such as a file path or section reference under `docs/`.
- Prefer checked-in local evidence in this order: docs snapshots if present, `kern-ux-plain` stories and source, local schemas/templates, local tests and validation rules, then `docs/contributor-guide.md`. When multiple source types cover the same point, cite the highest-priority source only. If a docs snapshot and a story conflict, the docs snapshot takes precedence and the conflict should be noted in a comment.
- After overlay or manifest-source changes, run `npm run validate-guidance-overlay`, `npm run generate-manifest`, and focused tests for `packages/core/src/ux/manifest-generator.test.ts`, `packages/core/src/ux/tools.behaviour.test.ts` and `packages/core/src/ux/tools.listing.test.ts`. If the listing snapshot fails because the regenerated manifest adds, removes or renames tools, review the diff and update it with `npx vitest run -u packages/core/src/ux/tools.listing.test.ts`.
- If any of these commands fail, stop and report the full error output before making further changes. Do not proceed with a PR or further edits until all commands pass.
- Keep evidence source strings aligned with the current repo layout under `docs/`.