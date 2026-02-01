# Contributor Guide

This guide is for contributors changing schemas, templates, manifest generation, or reviewed guidance. Runtime consumers should start with [README.md](../README.md).

## Runtime vs Build Surface

Runtime flow:

- `src/index.ts` -> `src/server.ts` -> `src/ux/tools.ts`
- strategy builders in `src/ux/tool-builders/`
- component schemas in `src/ux/schemas/`
- HTML templates in `src/ux/templates/`
- generated runtime registry in `src/ux/registry.json` loaded by `src/ux/registry.ts`

Build-only tooling:

- manifest generator: `tools/manifest/build-manifest.ts`
- overlay loader/validator: `tools/manifest/guidance-overlay.ts`
- overlay validation entrypoint: `tools/manifest/validate-guidance-overlay.ts`
- manifest copy step: `tools/manifest/copy-manifest.mjs`
- local dev loop script: `tools/dev/dev-loop.ps1`

## Runtime Manifest Shape

The generated registry keeps only the data needed by runtime tools and curated docs output.

Included in `src/ux/registry.json`:

- canonical component ids
- `title`, `status`, `category`, `strategy`
- `htmlCanonical`
- `warnings`
- token snapshot (`colors`, `spacing`, `rawVariables`)
- extracted docs as `docs.excerpt` plus optional `docs.sections`
- additive curated guidance as `reviewedGuidance`

Not packaged from raw source extraction:

- raw SCSS docblock provenance text
- duplicated extracted `de` / `en` doc payloads
- author/date/file metadata from SCSS comments

Reviewed guidance remains localized and additive. Extracted docs are intentionally lean and non-localized.

## Manifest Workflow

Regenerate the manifest when KERN UX stories, markdown component docs, reviewed guidance, or manifest extraction logic changes:

```bash
npm run validate-guidance-overlay
npm run generate-manifest
npm test -- src/ux/manifest-generator.test.ts src/ux/tools.test.ts
```

Build packaging also copies the generated manifest into `dist/ux/registry.json`:

```bash
npm run build
```

If you are only running the server, you do not need to regenerate the manifest. Regeneration is a contributor task.

## Guidance Sources

Use checked-in evidence in this order:

1. curated docs snapshots if present
2. `kern-ux-plain` stories and upstream source
3. local schemas in `src/ux/schemas/`
4. local templates in `src/ux/templates/`
5. local tests and validation rules

Curated overlay assets:

- payload: `docs/guidance-overlay.json`
- schema: `docs/guidance-overlay.schema.json`
- workflow: `docs/guidance-overlay-workflow.md`
- drafting prompt: `.github/prompts/draft-guidance-overlay-entry.prompt.md`
- workflow skill: `.github/skills/component-update-workflow/SKILL.md`

## Schema Context

Schema layer map:

```text
src/ux/schemas/foundations.ts     - shared primitives
src/ux/schemas/<component>.ts     - per-component Zod schemas
src/ux/schemas/content-union.ts   - recursive discriminated union for render_composition
src/ux/tool-builders/shared.ts    - output validation and shared builder helpers
src/ux/tools.ts                   - createTools() wires schemas to MCP tools
```

Known recursive schema note:

- `render_composition` depends on recursive Zod schemas built with `z.lazy()`.
- `src/ux/json-schema.ts` must keep emitting ref-preserving JSON Schema for recursive tool schemas.
- Flattening recursive positions to inline `{}` breaks `render_composition` tool discovery and weakens validation tests.

Current high-value schema facts:

- `checkbox` list mode uses `groupName` as the shared `name` source for all list items.
- `input-date` is still a repo-level simplification over the upstream grouped day/month/year pattern.
- `dropdown` remains explicitly experimental.
- `kopfzeile` is still a simplified MCP placeholder rather than full upstream parity.

## Architecture Rules

- Public MCP tool names stay `get_<component-id>` plus utility tools.
- `checkboxlist` remains merged into `get_checkbox`.
- `strict: true` must keep throwing on validation failures.
- Keep extracted docs and reviewed guidance separate.

## Repo Customizations

- Always-on repo invariants live in `.github/copilot-instructions.md`.
- File-scoped overlay and manifest rules live in `.github/instructions/guidance-overlay.instructions.md`.
- File-scoped component-change rules live in `.github/instructions/component-change.instructions.md`.
- The end-to-end contributor workflow lives in `.github/skills/component-update-workflow/SKILL.md` and its bundled YAML references.

## Historical Context

The implementation rationale for the reviewed-guidance workflow is preserved in [air-gapped-guidance-plan.md](air-gapped-guidance-plan.md). Treat it as historical design context, not the primary operational guide.