---
description: "Use when updating reviewed guidance, overlay schema, guidance workflow docs, or manifest merge and validation logic. Covers docs/guidance-overlay.json, docs/guidance-overlay.schema.json, docs/guidance-overlay-workflow.md, and tools/manifest changes."
applyTo: "docs/guidance-overlay.json, docs/guidance-overlay.schema.json, docs/guidance-overlay-workflow.md, tools/manifest/**"
---

# Guidance Overlay Rules

- Treat `docs/guidance-overlay.json` and `docs/guidance-overlay.schema.json` as checked-in source inputs. Do not edit `src/ux/registry.json` or `dist/ux/registry.json` directly.
- If a change logically requires updating `src/ux/registry.json` or `dist/ux/registry.json`, surface this as a blocker in your response and explain which upstream source file should be changed instead so the registry is regenerated correctly.
- Add new `reviewedGuidance` entries freely, and correct or update existing ones as needed, but never delete or overwrite the extracted `guidance` or `guidanceSections` fields that were produced by automated extraction.
- Every reviewed-guidance statement must stay evidence-backed and tied to a specific, cited location in the repo, such as a file path or section reference under `docs/`.
- Prefer checked-in local evidence in this order: docs snapshots if present, `kern-ux-plain` stories and source, local schemas/templates, local tests and validation rules, then `docs/contributor-guide.md`. When multiple source types cover the same point, cite the highest-priority source only. If a docs snapshot and a story conflict, the docs snapshot takes precedence and the conflict should be noted in a comment.
- After overlay or manifest-source changes, run `npm run validate-guidance-overlay`, `npm run generate-manifest`, and focused tests for `src/ux/manifest-generator.test.ts` and `src/ux/tools.test.ts`.
- If any of these commands fail, stop and report the full error output before making further changes. Do not proceed with a PR or further edits until all commands pass.
- Keep evidence source strings aligned with the current repo layout under `docs/`.