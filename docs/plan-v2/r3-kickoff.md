# Kickoff: roadmap step R3 (workspaces and hosts)

Paste this file into a new session to start R3. It collects the state after R2b and everything learned so far that the roadmap doesn't say. Snapshot date: 2026-09-27.

## Your task

Do **R3: Workspaces and hosts** from [roadmap.md](roadmap.md#r3-workspaces-and-hosts): the workspace split, the esbuild bundles, the HTTP host, the Docker image, the MCPB bundle, CI and `release.yml`.

Read these first, in this order:
1. [roadmap.md](roadmap.md): the R3 tracker, "Target architecture", "R3 workspace split and hosts", "Verification", and the decisions table.
2. [findings.md](findings.md): item 17 (SDK v2 facts and the **R0 results**) and item 22 (the registry contract, R4b, which R3 must not block).
3. [../release-bootstrap.md](../release-bootstrap.md): the one-time manual steps at the end of R3. Those are **the user's** to do, not yours.

Working agreements (standing, from the user):
- Work progressively: one checkbox group per commit, on `feat/v2-alpha`. **Don't push without asking.**
- Tick roadmap boxes when the work lands (a trailing `docs:` commit is fine).
- **Ask before large or irreversible decisions.** R3 is the largest step, so check the plan below with the user first.

## Where things stand

- **Branch:** `feat/v2-alpha`, 24 commits ahead of `main`, not pushed. GitVersion computes `2.0.0-alpha.N`.
- **Done:** R0 (spike; its client matrix is still partly open), R1, R2 (SDK v2), R2b (titles, annotations, `outputSchema`, cache hints). R4b (registry contract) is planned.
- **Server:** `@modelcontextprotocol/server` 2.1 over stdio. It speaks protocol 2026-07-28 and still serves 2024-11-05 through 2025-11-25. There are 54 tools.
- **Checks:** 475 tests. Coverage is about 95.4 / 88.4 / 95.7 / 95.4 (statements / branches / functions / lines), with thresholds of 87 / 79 / 87 / 87.
- **Published dependencies:** `@modelcontextprotocol/server`, `node-html-parser`, `zod`. `@modelcontextprotocol/client` is a dev dependency, used by the tests.

### Source layout today (what R3 moves)

| Path | Role |
|---|---|
| `src/index.ts` | stdio entry: loads `getCatalog()` eagerly (exits 1 on a broken registry), then `serveStdio(() => createKernServer())` |
| `src/mcp/catalog.ts` | `getCatalog()`: tool definitions built once per process (async, memoised promise) |
| `src/mcp/kern-schema.ts` | Standard Schema adapters `kernInputSchema()` / `kernOutputSchema()`, memoised per `ToolDef` |
| `src/mcp/create-server.ts` | `registerKernTool()`, `createKernServer()` (title, annotations, `outputSchema`, `structuredContent`, cache hints, `listChanged: false`). Imports `../../package.json` for the version. |
| `src/invoke.ts` | the SDK-free pipeline: `parseToolInput`, `runTool`, `invokeTool`, the `formatInputValidation*` hints, `normalizeToolArgs` |
| `src/logging.ts` | `KERN_DEBUG` stderr logging |
| `src/ux/**` | the domain: schemas, templates, builders, `validate.ts`, `validate.schema.ts`, `json-schema.ts` (memoised `getToolInputJsonSchema` / `getToolOutputJsonSchema`), `registry.ts` + `registry.json` |
| `src/test-support/{tools,mcp}.ts` | test helpers: `callHandler`, `createRegistry`, and `MCP_ERAS` (the in-memory 2025 client and the `createMcpHandler().fetch` 2026 client) |
| `tools/manifest/*` | the registry generator (to be retired by R4b), plus `paths.ts` and `stories.ts` (moved out of `src` in R1) |

Snapshots:
- `src/ux/__snapshots__/tools-list.json`: the domain contract (name, title, description, input and output schema, annotations)
- `src/mcp/__snapshots__/mcp-tools-list.json`: the raw 2026 wire listing, with the server version replaced by a placeholder

`src/mcp/listing.test.ts` checks that the wire equals the domain listing on both eras, with the memoised schemas deep-frozen first.

Configs:
- `tsconfig.json` (src, `resolveJsonModule`), `tsconfig.build.json`, `tsconfig.tools.json` (tools and `vitest.config.ts`, run in CI)
- Vitest includes `src/**` and `tools/**` tests
- Biome ignores `src/ux/registry.json` and `**/__snapshots__`

## Agreed plan and progress (2026-09-28)

The user approved the proposed plan below, with these changes:
- **Pacing:** one commit per roadmap checkbox, and a **pause for review after each group** (A, B, C).
- **Move shape:** `src/` moved to `packages/core/src/` as-is. `invoke.ts`, `logging.ts` and `test-support/` stay at the core root, so no relative imports changed. Renaming to `mcp/pipeline.ts` can come later.
- **Decisions 1–3 below:** as recommended. Hosts call `createKernServer({ version })` with their own version, `getCatalog()` is synchronous, unit tests stay in core, and process-spawning e2e tests belong to the hosts.
- **Order:** the JSON import landed before the move, so the move needed no registry copy step.
- **Export condition:** `@leonio/source`, not `source` (`eventsource-parser` exports raw `.ts` under `source`). Core has no build; everything reads its source.
- **MCPB `user_config`:** only `debug`. `default_locale` is deferred, because the server has no server-wide locale.
- **OpenTelemetry:** deferred. It's not in the tracker and adds dependencies.
- **Docker:** the user starts Docker Desktop for the local image check in C. Ask when you get there.
- **CI:** also run on pushes to `feat/v2-alpha` (commit 7).

Progress:
- [x] A1 `b536610`: JSON import, synchronous catalog, `createKernServer({ version })`
- [x] A2 `adbc829`: workspace split (core, stdio), esbuild npm bundle for stdio (`tools/build/bundle.ts`), path checklist
- [ ] B: the fully inlined bundle and the dependency check, then `packages/http` with its e2e tests
- [ ] C: Docker, MCPB, CI, `release.yml`

Learned in A:
- A cold-cache `vitest run --coverage` can hit the 5 s test timeout locally; a warm rerun passes. CI always runs cold, so watch for it.
- Windows: `git mv src …` failed with "Permission denied" (the editor holds the directory). Moving its children one by one worked.
- `"*"` as the workspace dev-dependency spec links the prerelease-versioned core; npm doesn't try the registry.
- The stdio npm bundle is 345 kB, with the SDK, zod, node-html-parser and `node:crypto` external. It boots faster than the old tsc output.
- `release.yml` still packs the private root until commit 8 rewrites it (a publish would fail safely, since the root is private).

## Proposed plan (as written before the user's review)

Three commit groups. Each one leaves the repo green.

**A. Pure move and JSON import**
- `git mv` `src/ux` → `packages/core/src/ux` (snapshots included). The rest of `src/mcp`, `invoke.ts` and `logging.ts` go to `packages/core/src/mcp`, and `src/index.ts` → `packages/stdio/src/index.ts`.
- Workspace root with `tsconfig.base.json` and the `"source"` export condition. Fold in item 14 (`verbatimModuleSyntax`, ES2024).
- Vitest `test.projects`, with the coverage include and thresholds kept.
- The Biome ignore path.
- Then the JSON import of `registry.json`, a synchronous memoised `getCatalog()`, and deleting `copy-manifest.mjs`.
- Walk through the path checklist below.

**B. Bundles and the HTTP host**
- esbuild bundles: for npm, core inlined and third-party packages external; for MCPB and Docker, everything inlined.
- A script that fails if a third-party import isn't declared.
- `packages/http`: host and origin validation, `/healthz` and `/readyz`, optional auth, rate limit and CORS, a SIGTERM drain.
- HTTP e2e tests.

**C. Container, MCPB, CI and release**
- `Dockerfile` (distroless nodejs24), `compose.yaml`, the MCPB manifest and pack.
- CI: an e2e job, a packed-install smoke test, and building `.mcpb` and the image without pushing.
- `release.yml`: stdio and http, idempotent, one SBOM per package.
- Finally, hand the user `release-bootstrap.md`.

### Decisions to raise before starting

1. **Server version in core.** `create-server.ts` imports `../../package.json`. Inside the private core package that resolves to *core's* version. The roadmap signature is `createKernServer({ version })`, so the host should pass its own version. Recommend that.
2. **Async or sync catalog.** With the JSON import, `getCatalog()` can become synchronous. `index.ts` keeps failing fast at startup either way.
3. **Where the tests live.** Keep them next to the code in `packages/core` (they use `src/test-support`). The e2e suites that spawn processes belong to the hosts.

## Facts you'd otherwise rediscover

**SDK v2 (2.1.0), verified in R0 and R2:**
- `@modelcontextprotocol/node` was **removed in R2**, because nothing used it. `packages/http` must add it **plus its peer dependency `hono`**. `toNodeHandler(createMcpHandler(factory))` inside `node:http` works, and `hostHeaderValidation([...])` answers 403 with `{"code":-32000,"message":"Invalid Host: …"}`.
- Both the Node adapter and the handler cap request bodies at **4 MiB**. `validate_html.html` has `maxLength: 500000`.
- Invalid input and handler throws become `isError` results; an unknown tool gets JSON-RPC `-32602`. The 2025-era codec passes `inputSchema` through unchanged.
- **stdio on 2026:** SDK clients run `server/discover` on a disposable sibling process, then spawn the real one, so boot time counts twice. Keep module-scope work small. The bundled server boots in roughly 0.4–1 s; under `tsx` it takes about 1.3 s. Don't call `preloadSchemas()`.
- The per-request factory costs about **1.2 ms** (budget: a few ms). The HTTP e2e test in the roadmap should assert it.

**The R0 spike harness** is in git: `git show 31110cf:spike/r0/<file>`. It has working starting points for B and C:
- `http.ts`: a `node:http` host with host validation, `/healthz`, and a request log
- `build.sh`: esbuild, ESM, `--platform=node --target=node24`, with a `createRequire` banner. The banner was added pre-emptively; check whether it's actually needed.
- `mcpb/manifest.json`: manifest 0.3, validated and packed with `@anthropic-ai/mcpb@2.1.2`, giving a 2.0 MB bundle and a 425 kB `.mcpb`
- `inspector.json`: a config for the Inspector CLI

**MCP Inspector CLI 2.8.0** (`npx -y @modelcontextprotocol/inspector@latest --cli …`):
- `--protocol-era legacy|modern`, `--transport http --server-url …`, `--method tools/list|tools/call`, `--strict` for the schema-portability check (currently 2 warnings, both `get_summary` type arrays)
- Passing environment variables with `-e` breaks ad-hoc mode. Use `--config <file> --server <name>` instead.

**Release and versioning:**
- `gitversion.yml`: `feat/v2-alpha` uses `mode: ContinuousDelivery` and `label: alpha`. The global `ContinuousDeployment` would drop the label and publish as `latest`.
- `release.yml` runs the tests *before* `npm pkg set version`, and derives the npm dist-tag from the pre-release label. Commit messages drive the version bump: `feat` → minor, `fix` and `chore(deps)` → patch, `!` or `BREAKING CHANGE:` → major.
- For R3 it must publish **only** `-w packages/stdio -w packages/http` (never `-ws`, which would include the private core), skip versions that already exist, and make SBOMs with `npm sbom -w <pkg> --sbom-format cyclonedx`.

**Registry:**
- The user regenerates `src/ux/registry.json` in the background from `kern-ux-plain`, currently pinned to 2.8.2 (`cf2a17b`), with `tests` excluded. **Don't commit or revert the user's registry or snapshot changes.** If they're dirty when you need a clean baseline, ask the user.
- Longer term the registry comes from the external generator (the `kern-ux-scraper` repo; finding 22, R4b). R3 shouldn't build anything new into `tools/manifest/`.

### Stale references in the roadmap's R3 path checklist

- `src/ux/paths.ts:10` → now **`tools/manifest/paths.ts:10`** (moved in R1). `build-manifest.ts:18` → now **line 22** (`OUTPUT_PATH`). `tools/manifest/guidance-overlay.ts:21/26` also resolve from `process.cwd()`.
- `docs/guidance-overlay.json` has **18** `src/ux/...` evidence paths, which `get_component_docs` shows.
- `.github/instructions/*.instructions.md` (3 files: `applyTo` globs), `.github/skills/{component-update-workflow,tool-description-quality}`, `.github/copilot-instructions.md`, `docs/codebase-guide.md` and `docs/contributor-guide.md` all name `src/...` paths.
- `generate-manifest` stays a root script. Drop the `prebuild` hook, which needs the sibling checkout.

## Environment quirks (Windows)

- The Bash tool is Git Bash. `dotnet-gitversion` only finds `.git` when run from **PowerShell** in the repo root.
- Local Node is **26.7**. For Node 24 checks, use `npx -y -p node@24 node …` (24.21.0), whose binary path can be passed to the Inspector through `--config`.
- `node -` reading a heredoc on stdin runs it as **TypeScript** in Node 26, which mangles backslash escapes in template literals. Write throwaway scripts to `.cjs` files in the scratchpad instead.
- Scratch `tsx` scripts outside the repo need a `.mts` extension and `file:///C:/…` import URLs.
- In PowerShell, a failed `git add` doesn't stop the next `git commit`. Check `git status` or the commit's `--stat` afterwards.
- `vitest run -u <file>` updates **all** file snapshots, not just that file's. Review every snapshot diff.
- Before each commit run `npx biome ci .`, `npx tsc --noEmit`, `npx tsc -p tsconfig.tools.json`, `npm run build:ci` and `npm run test:coverage`. After the split, adapt these to the workspace.
