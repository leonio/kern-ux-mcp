# Contributor Guide

This guide is for contributors changing schemas, templates, manifest generation, or reviewed guidance. Runtime consumers should start with [README.md](../README.md).

## How It Fits Together

```mermaid
flowchart LR
  subgraph Build_Time
    A[kern-ux-plain stories + docs]
    B[docs/guidance-overlay.json]
    C[tools/manifest/build-manifest.ts]
    D[src/ux/registry.json]
    A --> C
    B --> C
    C --> D
  end

  subgraph Runtime
    D --> E[src/mcp/create-server.ts]
    E --> F[src/ux/tools.ts]
    F --> G[src/ux/tool-builders]
    G --> H[src/ux/schemas]
    G --> I[src/ux/templates]
    F --> J[src/ux/json-schema.ts]
    I --> K[src/ux/validate.ts]
  end
```

At runtime the registry decides which tools and component metadata are exposed. The tool builders bind that metadata to Zod schemas from [src/ux/schemas](src/ux/schemas), and [src/ux/json-schema.ts](src/ux/json-schema.ts) converts those Zod schemas to JSON Schema for MCP tool discovery.

## Runtime vs Build Surface

Runtime flow:

- `src/index.ts` -> `src/mcp/create-server.ts` (SDK v2 `McpServer`) -> `src/ux/tools.ts`
- the call pipeline in `src/invoke.ts`, used through the `kernInputSchema` adapter in `src/mcp/kern-schema.ts`
- strategy builders in `src/ux/tool-builders/`
- component schemas in `src/ux/schemas/`
- HTML templates in `src/ux/templates/`
- generated runtime registry in `src/ux/registry.json`, a JSON import in `src/ux/registry.ts`

Build-only tooling:

- manifest generator: `tools/manifest/build-manifest.ts`
- overlay loader/validator: `tools/manifest/guidance-overlay.ts`
- overlay validation entrypoint: `tools/manifest/validate-guidance-overlay.ts`
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
npm test -- src/ux/manifest-generator.test.ts src/ux/tools.behaviour.test.ts src/ux/tools.listing.test.ts
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

## Testing

Tests are colocated with the code as `src/**/*.test.ts` and run with Vitest:

```bash
npm test               # full suite
npm run test:watch     # watch mode
npm run test:coverage  # suite + coverage; fails below the thresholds in vitest.config.ts
npm test -- src/ux/validate.test.ts   # a single file
```

Where tests live:

```text
src/server.mcp.test.ts             - end-to-end: real MCP client over InMemoryTransport (list, call, errors)
src/ux/tools.listing.test.ts       - contract snapshot of the full tools/list output
src/ux/tools.routing.test.ts       - which builder each component/strategy gets
src/ux/tools.input-schemas.test.ts - guidance text that must stay in the listed JSON schemas
src/ux/tools.descriptions.test.ts  - guidance text that must stay in tool descriptions
src/ux/tools.behaviour.test.ts     - utility/discovery/docs tool output
src/ux/validate.test.ts            - one failing and one passing case per validation rule
src/ux/templates/*.test.ts         - per-template rendering
src/test-support/                  - shared helpers (test-only, excluded from the build)
```

Tool-listing snapshot:

- `src/ux/__snapshots__/tools-list.json` holds everything clients see from `tools/list`: tool names, descriptions and JSON input schemas, built from the checked-in `registry.json`.
- A failing snapshot means clients would see a change. If the change is intended, update the snapshot and review the JSON diff in the PR:

  ```bash
  npx vitest run -u src/ux/tools.listing.test.ts
  ```

- CI never writes snapshots. A missing or stale snapshot fails the build, so generate it locally and commit it.
- Biome ignores `**/__snapshots__`, because snapshots use two-space indentation.

Conventions:

- No `any` in tests. Biome's `noExplicitAny` applies to test files too. Use the helpers in `src/test-support/`:
  - `createRegistry` and `invokeTool` for tool calls
  - `getListedToolSchema`, `schemaVariants`, `findVariant` and the `JsonSchemaNode` type for JSON Schema assertions
- For deliberately invalid input that checks a runtime guard, put `// @ts-expect-error <reason>` on the offending line instead of casting.
- Assert on specific `ruleId`s, or on the full list of rule IDs, rather than only `ok`. That way a test can't pass because a different rule happened to fire.
- Keep the default 5s timeout. If a test is slow, fix the setup rather than raising the limit. For example, import modules statically instead of calling `await import()` inside a test, and don't recompute expensive data per assertion.

Coverage:

- Thresholds live in `vitest.config.ts` and sit just below the measured baseline. Raise them as coverage improves, and never lower them to make a PR pass.
- `src/index.ts` is excluded because it only wires stdio. `src/mcp/create-server.test.ts` covers `createKernServer()` end to end on both protocol eras (2025-11-25 and 2026-07-28).
- CI adds a coverage table to the job summary and uploads the HTML report as the `coverage-report` artifact. Locally, open `coverage/index.html`.

Module cache:

- `fsModuleCache: true` keeps transformed modules between runs, in `node_modules/.vitest-cache`. It's keyed on file content, so edits invalidate it, and a reinstall clears it.
- If results ever look stale, run with `--fsModuleCache=false`, or inspect the cache with `DEBUG=vitest:cache:fs npm test`.

## Architecture Rules

- Public MCP tool names stay `get_<component-id>` plus utility tools.
- `checkboxlist` remains merged into `get_checkbox`.
- `strict: true` must keep throwing on validation failures.
- Keep extracted docs and reviewed guidance separate.
- The `tools/list` output is a public contract. Refactors must leave the tool-listing snapshot unchanged, and a deliberate change must show up as a reviewed snapshot diff.

## Repo Customizations

- Always-on repo invariants live in `.github/copilot-instructions.md`.
- File-scoped overlay and manifest rules live in `.github/instructions/guidance-overlay.instructions.md`.
- File-scoped component-change rules live in `.github/instructions/component-change.instructions.md`.
- The end-to-end contributor workflow lives in `.github/skills/component-update-workflow/SKILL.md` and its bundled YAML references.

## Historical Context

The implementation rationale for the reviewed-guidance workflow is preserved in [air-gapped-guidance-plan.md](air-gapped-guidance-plan.md). Treat it as historical design context, not the primary operational guide.