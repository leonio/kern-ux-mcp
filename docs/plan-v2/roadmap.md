# Roadmap to 2.0: MCP 2026-07-28, core library, stdio/MCPB and HTTP

This roadmap moves the server to MCP protocol `2026-07-28` and SDK v2. It splits the code into one private core library plus three thin hosts: stdio, MCPB and Streamable HTTP. It also adds resources and prompts that build on the Zod schemas and guidance the repo already has.

We work through it progressively, one step at a time. Each step is one PR or a small group, and each can be released on its own.
- **Tick the boxes below as PRs land.**
- The background for each step is in [findings.md](findings.md) (items 17–21).
- How this roadmap relates to the earlier plan-v2 items is in [README.md](README.md).

Discovery date: 2026-09-27. Line numbers refer to the code at that point and will drift.

## Status tracker

### R0: SDK v2 spike

**R0 no longer blocks R5** (decided 2026-10-02). Option A was measured and doesn't shrink anything, and 55 tools are well under VS Code's 128-tool limit. The open boxes are a client check to finish before GA (R7's merge). Whether a client passes `outputSchema` to the model only changes how R5 reports it.

- [x] Install `@modelcontextprotocol/server`, `@modelcontextprotocol/node` and `@modelcontextprotocol/client`.
- [x] Check that the `tools/list` output through the adapter deep-equals [tools-list.json](../../packages/core/src/ux/__snapshots__/tools-list.json), ignoring key order.
- [x] Record the exact `isError` text for invalid input and for strict-validation failures.
- [ ] Test the client matrix on both protocol versions (2026-07-28 and 2025-11-25). MCP Inspector is done; Claude and VS Code Copilot (HTTP) are reported working. The per-probe results follow the runbook `spike/r0/CLIENT-MATRIX.md`, deleted in R2: `git checkout 31110cf -- spike/r0` restores it (reinstall `@modelcontextprotocol/node` for its HTTP entry).
  - Over stdio: VS Code Copilot, Codex CLI, Claude Code, Claude Desktop, MCP Inspector.
  - Over HTTP through a tunnel: ChatGPT and the Responses API `mcp` tool.
  - For each client, record:
    - whether it supports prompts and resources
    - whether it handles `$defs`/`$ref` and `anyOf` roots
    - its tool-count limits
    - whether it passes `outputSchema` to the model (it decides whether R5's budget counts it)
- [x] Check that TS 7 compiles against the v2 `.d.ts` files, that JSON-import emit works, and that `tsc -b` works.
- [ ] Check that Claude Desktop runs an MCPB bundle on Node 24, built-in or through the system Node setting. The bundle runs on Node 24.21.0 under the Inspector; the Desktop run is still open.
- [ ] Write the results into [findings.md](findings.md) item 17. The automated results are in; the client matrix is still to add.

### R1: Prerequisites (safe to cherry-pick to `main`)

- [x] `gitversion.yml`:
  - add a `feat/v2-alpha` branch entry with a pre-release label and `is-release-branch: false`
  - fix the `ˆchore` typo (finding 20)
- [x] Item 3: extract an `invokeTool` pipeline and `logging.ts` from `server.ts`. Rename the test helper to `callHandler`.
- [x] Item 4: add a single `ValidationResultSchema`, and fix the `buildComponentTool` `warnings` gap.
- [x] Item 10: read the server version from `package.json`.
- [x] Item 12: remove dead code, and move `paths.ts` under `tools/`.
- [x] Item 13: add `tsconfig.tools.json` and a CI step for it.
- [x] Item 16: keep a single `formFlow` schema.
- [x] Finding 21:
  - replace `registry.json` `sourceRoot` with the upstream KERN version
  - move `fast-glob` to devDependencies
  - add a `maxLength` to `validate_html.html`
- [x] Renovate: add a group rule for `/^@modelcontextprotocol\//`.

### R2: SDK v2 swap (single package, stdio only)

- [x] Add the `kernInputSchema()` Standard Schema adapter and `registerKernTool()` (see [The tool model](#the-tool-model)). Strip our "Invalid arguments" header and start the message with `\n` (R0).
- [x] Build `createKernServer()` on `McpServer` with `capabilities: { tools: { listChanged: false } }` (R0), and change `index.ts` to `serveStdio(() => createKernServer())`.
- [x] Return `isError` results for invalid input and strict failures. Update the e2e test, now [create-server.test.ts](../../packages/core/src/mcp/create-server.test.ts): an unknown tool now rejects with -32602.
- [x] Add a wire-level listing snapshot plus a semantic-equality test against the domain snapshot. JSON round-trip the in-memory result first (R0).
- [x] Remove `@modelcontextprotocol/sdk` v1.
- [x] Delete the R0 harness in `spike/r0/`. `git checkout 31110cf -- spike/r0` restores it (reinstall `@modelcontextprotocol/node` for its HTTP entry).

### R2b: Standards metadata (via the adapter)

- [x] Add a `title` (from the registry title) and `annotations` (`readOnlyHint`, `idempotentHint`, `openWorldHint: false`) to every tool.
- [x] Advertise `outputSchema` and return `structuredContent`, keeping the JSON text block. This adds 49K compact characters to the listing (143K → 198K); see finding 19.
- [x] Set `cacheHints` for `tools/list`, `prompts/list` and resources: one hour, `public`, plus `server/discover`. Per-resource hints for `resources/read` come in R6.

### R3: Workspaces and hosts

Start here: [r3-handover.md](r3-handover.md) has where R3 ended (released as `2.0.0-alpha.69`) and the next steps. [r3-kickoff.md](r3-kickoff.md) has the plan, its progress and what was learned.

- [x] Do a pure move into `packages/core` (`"private": true`) and `packages/stdio`, working through the path checklist in [R3 details](#r3-workspace-split-and-hosts).
- [x] Load `registry.json` as a JSON import, memoise `getCatalog()`, and delete `tools/manifest/copy-manifest.mjs`.
- [x] Set up the esbuild bundles:
  - for npm: core inlined, third-party packages external
  - for MCPB and Docker: everything inlined
  - plus a check that every dependency is declared
- [x] Build `packages/http`:
  - the handler, with host and origin validation (declare the `hono` peer dependency of `@modelcontextprotocol/node`)
  - `/healthz` and `/readyz`
  - optional auth, rate limiting and CORS
  - a SIGTERM drain
- [x] Add the `Dockerfile`, `compose.yaml` and the GHCR push.
- [x] Add the MCPB `manifest.json`, `mcpb pack`, and the bundle as a release asset.
- [x] CI: an e2e job, a packed-install smoke test, and builds of the `.mcpb` and the image without pushing.
- [x] `release.yml`: publish stdio and http, idempotently, with one SBOM per package.
- [X] Do the one-time manual steps in [release-bootstrap.md](../release-bootstrap.md).

### R4: Composition gaps (prerequisite for prompts)

Done, not yet released. Where R4 ended and the groundwork for R5 and R4b: [r4-handover.md](r4-handover.md). Plan, progress and lessons: [r4-kickoff.md](r4-kickoff.md).

- [x] Item 9: `createCompositionRenderer(locale)`.
- [x] Add a `field` block kind (inputs, select, radio, checkbox, textarea) to the content union.
- [x] Add a `form` block kind: `<form>`, an error summary, fieldsets, and an actions row.
- [x] Fix `formFlow`: the `kern-btn` class, a `<form>` wrapper, heading separation, and a `renderAllSteps` option.
- [x] Make `get_fieldset` accept child fields instead of the hard-coded Vorname/Name.
- [x] Make the `validate.ts` `form.error_*` rules target `.kern-error`, and add a regression test.
- [x] Make the schema reject nestings the renderer can't produce.
- [x] Add a `render_page` tool: page shell, header, `<main>` and footer.

### R4b: Registry contract (consumer side of the external generator)

In progress: [r4b-kickoff.md](r4b-kickoff.md) has the plan and progress. Can start any time after R3's JSON import of `registry.json`. Background in [finding 22](findings.md#22-the-registry-moves-to-an-external-generator-this-repo-owns-the-contract). Current state, field usage and kickoff questions: [r4-handover.md](r4-handover.md#r4b-registry-contract). **What the registry is missing, and how to generate it:** [registry-requirements.md](registry-requirements.md) (2026-10-02).

- [x] Code owns the tool list and routing: a component-to-tool table replaces `category`/`strategy` routing, so a regenerated registry can't add or remove tools (`get_index` goes). The overlay's notes about our own tools (Kopfzeile, InputDate, Dropdown) move to code, and generator `warnings` stop reaching tool output. ([registry-requirements.md](registry-requirements.md) 2.1–2.4)
- [x] `RegistryManifestSchema` in Zod, with `RegistryManifest`/`ComponentInfo` derived from it and a major `manifestVersion`. Additive: today's file keeps validating, and the fields code no longer reads become optional.
- [x] Export it as JSON Schema, replacing `docs/registry.schema.json`, for the generator to validate against.
- [x] Validate `registry.json` in a test and in `registry:import`. **Not at startup:** the file is bundled, so the server runs exactly the file CI checked (decided 2026-10-02).
- [x] `npm run registry:import -- <path>`: validate, copy, and print the component and field diff.
**The boxes below wait on the first knowledge bundle** and get re-planned then as phases K1–K4 of [knowledge-bundle.md](knowledge-bundle.md) (`knowledge:import` replaces `registry:import`).

- [ ] Optional knowledge fields and inventories from [registry-requirements.md](registry-requirements.md) section 3 (summary, synonyms, similar, when to use, examples, classes, accessibility, anatomy; icons, utilities, all `kern-*` classes, tokens with values; `docsOnly`), with size limits and the corpus version in `upstream`.
- [ ] Consume the inventories: `list_icons`, `get_utility_reference` and `get_tokens` read the registry instead of hand-coded lists, and `validate_html` warns on unknown `kern-*` classes.
- [ ] Tool descriptions combine code-owned API text with the registry summary; component knowledge stops being written in code. **Waits on the generator delivering summaries** (3 of 44 components have one today), not on R5; it fits next to R6's cards.
- [ ] Retire `tools/manifest/*` and the overlay files once the external generator reaches parity (contract passes, identical listing before any summaries are consumed).

### R5: English base language and the context budget

Measurements (2026-09-29), what they say about the shrink options, and kickoff questions: [r4-handover.md](r4-handover.md#r5-english-base-language-and-the-context-budget). In progress: [r5-kickoff.md](r5-kickoff.md). **Order and targets decided 2026-10-02:** option B comes before the English areas, the `examples` table comes before the hints are rewritten, and the baseline is scripted.

- [x] A scripted scenario baseline: a small harness runs the 8–10 scenarios against the stdio server through a model API, recording invalid calls, retries and tokens. Run it against the R4 release; VS Code Copilot and Claude Code stay as spot checks. Re-run after each area below.
- [x] Add a context-budget test that prints per-tool listing sizes and fails above the budget. Targets: **≤ 120K compact characters model-facing** (name, description, `inputSchema`) for the full toolset, **≤ 60K** for a compact profile. `outputSchema` is reported, not counted.
- [ ] Option B: the six standalone block tools accept a smaller block set (about 58K saved). Measure a fixed shallow set (`text`, `html`, `badge`, `field`) against sets matched to each tool's job (a grid of cards, a section with a grid: containers whose children are simple blocks) before choosing. Deep nesting goes through `render_composition` and `render_page`. Once the registry has `anatomy` (R4b), a test checks the sets against it.
- [x] An `examples` table keyed by tool name, with a golden test (every example validates with `strict: true`). The error hints' known-good payloads are built from it. This is the first piece of `defineTool()`'s `examples`, without migrating any tool.
- [ ] English: foundations and form-field schemas.
- [ ] English: layout and typography schemas and tools.
- [ ] English: interactive schemas and tools.
- [ ] English: composition schemas, `COMPOSITION_CHEAT_SHEET`, and error hints.
- [ ] Optional: a `KERN_TOOLSET=compact` profile.

In the English areas, component tool descriptions are API text only: what the tool renders and its parameters, plus a pointer. "When to use" knowledge stays out of code, and about 7K of the budget stays free for registry summaries (R4b).

### R5.1: Output polish (after R5)

These change what tools return, so they wait until R5's before/after measurements are done. That way the noise is the same in the baseline and every re-run.

- [ ] The grid warns "KERN UX has two layout systems…" only when it matters (columns that don't divide 12), not on every grid.
- [ ] `get_inputtext` and the other text-like tools drop the default "enter your full name" format hint (the `field` block already has none).
- [ ] Blocks in `<main>` and in `render_composition` get spacing between them, like a form's stack.
- [ ] A fieldset's group error appears in the form's error summary, linked to the group's first input.

### R6: Resources

- [ ] Resource registration, cache hints and a snapshot test harness.
- [ ] `kern://components`, the `kern://components/{id}` cards with completion, and `kern://components/{id}/schema`.
- [ ] Guides: composition, forms, layout, accessibility.
- [ ] `kern://tokens`, `kern://utilities`, `kern://icons` and `kern://templates/page-shell`.
- [ ] Add `resource_link`s from `get_component_docs`.

### R7: Prompts, then 2.0.0 GA

- [ ] `create_page_layout`
- [ ] `create_input_form`
- [ ] `create_wizard_form`
- [ ] `review_kern_html` and `explain_component`
- [ ] Prompt snapshots, plus a scenario e2e test: every prompt's example output passes `validate_html`.
- [ ] Merge `feat/v2-alpha` into `main` and release 2.0.0.

### Ongoing from R2: progressive `defineTool()` migration

- [ ] `defineTool()` with `examples`, co-located `normalize`/`errorHint`, and the golden-example test (items 2, 8). R5 lands the `examples` table and the golden test first; `defineTool()` then takes them over.
- [ ] Utility tools.
- [ ] Typography and layout tools.
- [ ] Interactive tools as a declarative table, with routing declared once and the component ID on the definition (items 6, 7, 11).
- [ ] Composition tools through a generic HTML tool builder (item 5).

---

## Context

The server was written in Feb 2026 against `@modelcontextprotocol/sdk` 1.x (1.30.0 installed, protocol ≤ 2025-11-25). It uses the deprecated low-level `Server` with hand-written `tools/list` and `tools/call` handlers ([src/server.ts:511-565](../../src/server.ts)). It exposes 52 tools and nothing else: no resources, no prompts, stdio only.

**Known problems**
- **Per-tool knowledge is scattered.** Normalisation and "known-good payload" hints are name-keyed if-chains in `server.ts`, and routing is declared twice (findings 2, 6, 7).
- **LLM-facing text is German.** That covers 350 `.describe()` strings and most tool descriptions.
- **Bad input comes back as JSON-RPC errors.** The model can't self-correct from those.
- **`tools/list` is heavy.** It is 142K characters of compact JSON, about 35–40K tokens. Six composition-capable tools each inline the full recursive content union (finding 19).

**Protocol `2026-07-28`** is stateless:
- no `initialize`; `server/discover` instead
- per-request `_meta`
- `resultType`
- `ttlMs`/`cacheScope` on list and read results
- validation errors reported as `isError` results
- sampling and logging deprecated

**TS SDK v2 is GA:** `@modelcontextprotocol/server` 2.0.0 shipped on 2026-07-27 and 2.1.0 on 2026-09-23, and it requires zod ≥ 4.2 (we have 4.6.5). It implements 2026-07-28 and still serves 2025-era clients. It consists of:
- `@modelcontextprotocol/server`: `McpServer`, `registerTool`/`registerResource`/`registerPrompt`, `completable`, `serveStdio`, `createMcpHandler`
- `@modelcontextprotocol/node`: `toNodeHandler`, host and origin validation
- `@modelcontextprotocol/client`

**Outcome:** one private core library that owns every tool, resource and prompt definition, with three thin hosts built on it:
- a stdio server (keeps the existing npm name)
- an MCPB bundle
- a Streamable HTTP server, published as an npm package and a container image

It all lands progressively on `feat/v2-alpha` and ships as **2.0.0** (the current release is 1.1.2).

References:
- [MCP architecture (2026-07-28)](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture)
- [Server concepts](https://modelcontextprotocol.io/docs/2026-07-28/learn/server-concepts)
- [Spec changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [TS SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/)
- [Upgrade to v2](https://ts.sdk.modelcontextprotocol.io/v2/migration/upgrade-to-v2.html)
- [MCPB manifest](https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md)

## Decisions

| Topic | Decision |
|---|---|
| Packaging | npm workspaces with 3 packages. **`@leonio/kern-ux-core` is private and never published**; it gets bundled into the two published packages, `@leonio/kern-ux-mcp` (stdio + `.mcpb`) and `@leonio/kern-ux-mcp-http` (npm + GHCR image). Versions are lockstep. |
| Language | **English is the base language** for all LLM-facing text: `.describe()`, tool descriptions, resources, prompts. German stays where it already adds value: the `de` side of the reviewed guidance, UI labels (rendered HTML still defaults to `locale: "de"`), German KERN names (Kopfzeile, Pflichtfeld), and `de`/`en` validation messages. |
| Contract | These changes are accepted: `isError` for bad input, `outputSchema` + `structuredContent`, `title` + `annotations`, and input-schema changes where they follow MCP standards and cut context size. Tool names stay stable. |
| HTTP | It must run locally, in a container, and eventually publicly. There's no deploy target yet, so the container ships complete, with auth and rate limiting as options. |
| Branch | `feat/v2-alpha` is the long-lived integration branch. It publishes pre-releases under an npm dist-tag: `release.yml` already turns the GitVersion pre-release label into the dist-tag. |
| Node | `>=24` everywhere, including stdio, the MCPB bundle and the container. |
| Knowledge | **Tooling is built from a knowledge bundle, not `registry.json`** (decided 2026-10-02). The external generator (`kern-ux-scraper`) reads `kern-ux-plain`, the kern-ux.de docs source and third-party component libraries (the React kit first), and writes one English JSON document per component ([knowledge-bundle.md](knowledge-bundle.md)). This repo owns the bundle contract, checks the bundle in under `knowledge/`, and derives the runtime `registry.json` from it. English only; the docs prose (CC BY-NC-SA) is never copied. Third-party libraries get their own tools, which may later move out of this repo. Until the first bundle arrives, the roadmap continues on today's `registry.json`. |
| Clients | VS Code + GitHub Copilot, OpenAI (Codex CLI over stdio; ChatGPT and the Responses API over remote HTTP), Claude (Code, Desktop), plus the MCP Inspector. |

**On keeping core private.** Not publishing core stops anyone from doing `npm install @leonio/kern-ux-core`. It doesn't hide the code:
- The repo is public under EUPL-1.2. npm `--provenance` needs a public repo.
- The bundled core code ships inside both published packages.

Restricting reuse would be a licence decision, not a packaging one. The packaging below supports either choice.

## Target architecture

```
package.json            private workspace root (workspaces: packages/*); biome.json, tsconfig.base.json, vitest.config.ts, tools/, docs/
packages/
  core/   @leonio/kern-ux-core   "private": true; the ONLY package importing the MCP SDK (Biome noRestrictedImports keeps src/ux SDK-free)
    src/ux/**           existing domain, moved as-is (schemas, templates, validate, i18n, registry.json)
    src/tools/          catalog + defineTool() definitions (replaces tools.ts routing over time)
    src/resources/      kern:// resources and templates, generated from domain data
    src/prompts/        prompt definitions
    src/mcp/            kern-schema.ts (Standard Schema adapter), register-tool.ts, pipeline.ts, logging.ts, create-server.ts
  stdio/  @leonio/kern-ux-mcp       published; bin kern-ux-mcp → serveStdio(() => createKernServer()); mcpb/ (manifest.json, icon)
  http/   @leonio/kern-ux-mcp-http  published; bin kern-ux-mcp-http → node:http + createMcpHandler + toNodeHandler; Dockerfile, compose.yaml
```

- **Bundling, because core is private.**
  - The npm packages use esbuild to inline `@leonio/kern-ux-core` (a workspace-only dependency, listed under `devDependencies`) and keep third-party packages external. Those are the SDK, zod and node-html-parser. They stay as real `dependencies` of stdio and http, so users get security patches and the SBOM stays accurate.
  - A small check script fails CI if a third-party import in core isn't declared in stdio/http.
  - The `.mcpb` and the Docker image use a **fully inlined** bundle instead: one file, no `node_modules`.
- **`registry.json` becomes a JSON import** (`import m from "./registry.json" with { type: "json" }`), replacing `fs` + `import.meta.url` in [src/ux/registry.ts:7-51](../../packages/core/src/ux/registry.ts). esbuild inlines it, so `tools/manifest/copy-manifest.mjs` is deleted.
- **`getCatalog()` is memoised at module scope.** It holds the registry, the tool definitions and the pre-computed JSON Schemas. `createKernServer({ version })` only registers from that memo, so the per-request HTTP factory stays cheap. SDK v2 would otherwise re-run `z.toJSONSchema` for all 52 tools on every request (finding 17).

## The tool model

The Zod schemas plus the existing hints are enough to generate good tool definitions.

**Registration seam: `kernInputSchema(def)`.** This is a custom Standard Schema object. SDK v2 uses `~standard.jsonSchema.input()` and `~standard.validate` as given (finding 17).
- `validate()` runs normalize, then the Zod parse, then the existing hint formatter. It returns **one issue with no path**, because the SDK already wraps the message as `Input validation error: Invalid arguments for tool X: …`. Drop our own header so it isn't doubled.
- `jsonSchema.input()` returns our memoised [json-schema.ts](../../packages/core/src/ux/json-schema.ts) output, so we control the listing shape. The only side effect is that the SDK moves `type` ahead of `$schema`, which doesn't change meaning.
- Legacy `ToolDef`s from today's builders register through this seam on day one: all 52 tools move across in one step, unchanged. Until each family migrates, the adapter calls the existing `normalizeToolArgs`, `formatInputValidationError` and `formatCompositionError` from [server.ts](../../src/server.ts).

**Target definition: `defineTool()`.** Tool families migrate to it one PR at a time:

```ts
defineTool({
  name: "get_button", title: "KERN Button", componentId: "button",
  description: "Short English what/when + 'See kern://components/button'",
  inputSchema: ButtonSchema, outputSchema: ComponentOutputSchema,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  normalize?: (args) => args,              // moved from server.ts normalizeToolArgs
  errorHint?: string | ((err) => string),  // moved from formatInputValidationError
  examples: [{ title: "Primary with icon", input: { … } }],
  handler: async (args /* z.output<I> */) => ({ html, warnings, validation }),
});
```

`examples` is the single source for known-good payloads. It feeds four things:
- the error hints
- the resource cards
- prompt few-shots
- a golden test in which every example renders with `strict: true`, with no validation errors

Today the same payloads are duplicated across tool descriptions, `server.ts` and the tests.

## Step details

### R0 spike

This step is time-boxed. The harness in `spike/r0/` was throwaway and was deleted in R2; only the findings are kept. `git checkout 31110cf -- spike/r0` restores it (reinstall `@modelcontextprotocol/node` for its HTTP entry). The tracker lists what to confirm. Two of the answers were meant to gate R5; neither does any more (2026-10-02):
- **`$defs`/`$ref` and `anyOf`-root support per client** was to decide between the R5 schema-shrink options. Option A was measured and makes the listing larger, so R5 uses option B. `render_composition` already relies on `$ref` for recursion.
- **Tool-count limits** were to decide whether the R5 compact profile is needed. 55 tools are well under VS Code's 128, so the profile stays optional.

### R1 prerequisites

These are plan-v2 items that make the swap mechanical, plus small fixes from findings 20 and 21. None of them change the MCP contract, so each can be cherry-picked to `main` as a 1.x patch.

### R2 and R2b: SDK v2 swap

- `createKernServer({ version })` lives in `src/mcp/` while the repo is still one package. It moves to `packages/core` in R3.
- Validation and strict-mode failures become `isError: true` results with the same hint text.
- An unknown tool rejects with JSON-RPC `-32602` (`Tool X not found`).
- Success results keep the existing `JSON.stringify(payload, null, 2)` text block. The spec says SHOULD for backwards compatibility.
- R2b then adds `structuredContent` and the advertised `outputSchema`.

### R3 workspace split and hosts

**Moves**
- Use `git mv src/ux → packages/core/src/ux`, snapshots included.
- Split [src/server.ts](../../src/server.ts) into `packages/core/src/mcp/*`; [src/index.ts](../../packages/stdio/src/index.ts) becomes `packages/stdio/src/index.ts`.
- `src/test-support` moves to `packages/core/src/test-support`.

**TypeScript and tests**
- Add a `"source"` export condition, with `customConditions: ["source"]` in `tsconfig.base.json` for typechecking without building. Build order: core, then stdio and http.
  - **Done differently (2026-09-28):** the condition is **`@leonio/source`**, because `eventsource-parser` (an SDK client dependency) exports raw `.ts` under `source`. Core exports *only* that condition and has no build of its own: tsc, Vitest, esbuild and `tsx --conditions=@leonio/source` all read its source.
- Item 14 (`verbatimModuleSyntax`, ES2024 target) fits into `tsconfig.base.json` here.
- Vitest 5 `test.projects: ["packages/*"]`, with a coverage include of `packages/*/src/**`. Keep the thresholds. (Done as inline projects with `extends: true`: `core`, `tools`, one more per host.)
- In Biome, change the ignore to `!packages/core/src/ux/registry.json`.

**Path checklist.** npm runs workspace scripts with cwd set to the package directory.
- Resolve these from `import.meta.url` instead of cwd:
  - `src/ux/paths.ts:10`
  - `tools/manifest/build-manifest.ts:18`
- Keep `generate-manifest` as an explicit root script, and drop the `prebuild` hook, which needs the sibling `kern-ux-plain` checkout.
- Update the 18 `src/ux/...` evidence paths in [docs/guidance-overlay.json](../guidance-overlay.json). They surface in `get_component_docs`.
- Update the `applyTo` globs in `.github/instructions/*.md`.
- Update `.github/skills/*`, `tools/dev/dev-loop.ps1` and `docs/*`.

**HTTP (`packages/http`)**
- Routes: `createMcpHandler(() => createKernServer(...))` wrapped in `toNodeHandler` inside `node:http`, plus `/healthz` and `/readyz`.
- Environment variables:

  | Variable | Default | Purpose |
  |---|---|---|
  | `HOST` | `127.0.0.1` | Bind address |
  | `PORT` | `3000` | Listen port |
  | `KERN_ALLOWED_HOSTS`, `KERN_ALLOWED_ORIGINS` | localhost validation | **Explicit lists are required when binding `0.0.0.0`**. `localhostHostValidation` only fits loopback binds. Entries are hostnames: the SDK guards ignore ports, so the host strips any. |
  | `KERN_AUTH_TOKEN` | unset | Optional static bearer check in front of the handler |
  | `KERN_RATE_LIMIT` | unset | Optional per-IP token bucket |
  | `KERN_CORS_ORIGINS` | unset | Optional CORS allowlist |
  | `KERN_DEBUG` | unset | Same as today |

- Optional OpenTelemetry (`_meta` `traceparent`), off by default. **Deferred** (2026-09-28): not in the tracker, and it adds dependencies.
- SIGTERM drain.
- ChatGPT and the Responses API need a public HTTPS URL. For local testing, document a tunnel (`cloudflared`/`ngrok`) in the README.

**Container**
- Multi-stage `Dockerfile`, with the fully inlined HTTP bundle copied into `gcr.io/distroless/nodejs24:nonroot`. (Done as `gcr.io/distroless/nodejs24-debian13:nonroot`, pinned by digest; the untagged name floats to the newest Debian.)
- `HEALTHCHECK` goes through a tiny node script, since distroless has no curl.
- Plus `.dockerignore` and `compose.yaml`.
- The release pushes the image to GHCR with provenance and SBOM attestations.

**MCPB (`packages/stdio/mcpb/manifest.json`)**
- `manifest_version "0.3"`, `server.type "node"`, `entry_point "server/index.js"`, `mcp_config.args ["${__dirname}/server/index.js"]`
- `compatibility.runtimes.node ">=24"`
- `user_config`: `debug` (boolean). A `default_locale` (de/en) option is deferred (decided 2026-09-28): the server has no server-wide locale, and adding one would change schema defaults per config. Revisit with R5.
- `license "EUPL-1.2"`, and an icon
- Generate the static `tools[]`/`prompts[]` list at build time (they're fixed per release) and set `tools_generated`/`prompts_generated` to `false`.
- Pack with `mcpb validate && mcpb pack` (`@anthropic-ai/mcpb` as a dev dependency). **Done differently:** the CLI runs pinned through `npm exec` (`tools/build/mcpb.ts`), not as a dev dependency. Its interactive `init` pulls in packages with audit advisories.

**Release ([release.yml](../../.github/workflows/release.yml))**
- `npm version $semVer -ws --no-git-tag-version`. **Done as** `npm pkg set version=<semVer> --workspaces`, before the build, since the bundles inline the version.
- Pack and publish **only** stdio and http, to npm with provenance and to GitHub Packages. Core is `private`, so npm refuses to publish it.
- A per-package SBOM via `npm sbom -w <pkg> --sbom-format cyclonedx`. syft can't see hoisted `node_modules` from a package directory. **Done differently:** `npm sbom -w` dropped `zod` with `--omit dev` and describes the workspace root, so `tools/build/sbom.ts` runs `@cyclonedx/cyclonedx-npm` and makes the package the subject.
- Make publishing idempotent: skip a package whose `npm view pkg@ver` already exists, so a re-run after a partial failure works.
- Attach the tarballs, the `.mcpb` and the SBOMs to the GitHub release.
- The one-time manual steps are in [release-bootstrap.md](../release-bootstrap.md).

**CI ([ci.yml](../../.github/workflows/ci.yml))**
- Existing steps: `biome ci`, typecheck (plus the tools tsconfig), `npm run build -ws`, `vitest --coverage`.
- An e2e job for stdio and HTTP.
- The dependency-declaration check.
- A **packed-install smoke test**: `npm pack` stdio and http, install them into a temp dir, spawn both, run `listTools`.
- Build the `.mcpb` and the Docker image without pushing.

### R4 composition gaps

These are real bugs or missing pieces, and the prompts would expose them (finding 18).
1. Do plan-v2 item 9 first: `createCompositionRenderer(locale)`.
2. Add a **`field` block kind**. It dispatches to the existing inputtext/email/date/number/tel/url/password/textarea/select/radio/checkbox schemas and templates, so forms compose in one call instead of "render with `get_*`, then paste into an `html` block".
3. Add a **`form` block kind**: `<form action method novalidate>`, an optional error-summary alert, fieldset groups (legend + `field` blocks), and an actions row.
4. `formFlow`:
   - fix `kern-button` → `kern-btn` ([templates/form-flow.ts:134-144](../../packages/core/src/ux/templates/form-flow.ts))
   - wrap the step in `<form>`
   - separate the form heading from the tasklist heading
   - add a `renderAllSteps` option (inactive steps get `hidden`)
5. `get_fieldset` accepts child fields instead of the hard-coded Vorname/Name ([templates/fieldset.ts:20](../../packages/core/src/ux/templates/fieldset.ts)).
6. [validate.ts:231](../../packages/core/src/ux/validate.ts): the `form.error_id`/`form.error_describedby` rules should target `.kern-error`, the class the templates actually emit. Add a regression test.
7. The schema should reject nestings the renderer can't produce, instead of accepting them and emitting a warning.
8. Add a `render_page` tool: page shell + header (`get_pattern`/`kopfzeile`) + `<main>` blocks + a footer (section + 4-column grid).

### R4b registry contract

The registry stops being generated here (finding 22). This repo says what it needs, and the external generator delivers it.

The field-by-field requirements, the problems with today's file and a generator design are in [registry-requirements.md](registry-requirements.md).

**Ownership**
- The generator owns the source scan (it reads `kern-ux-plain` directly, never this repo's `registry.json`), the corpus mapping, the curated exclusion and alias tables, and the generated text.
- This repo owns the contract and the tool implementations. Neither side copies the other's tables.
- **The tool list is code's** (2026-10-02). Today `createTools()` makes one tool per registry component, so a regeneration adds or removes tools (`get_index`; `get_details` and `get_search` arrived that way with 2.8.2), and `category`/`strategy` encode our routing in the generator. A component-to-tool table in code replaces both. A registry component without a tool is documentation only.

**Contract**
- `src/ux/registry.schema.ts`: `RegistryManifestSchema` in Zod, the single source for the TS types. It is exported to JSON Schema and published as `docs/registry.schema.json`.
- `manifestVersion` becomes a major version that the loader checks. A breaking contract change bumps it, and both repositories change together.
- New optional fields first, so today's registry keeps validating: component summary, when to use, do's and don'ts, accessibility notes (WCAG criterion IDs), examples, synonyms, related components, and `upstream` extended with the corpus version.
- Validation runs in a test and in `registry:import`, not at startup: the bundles inline the file, so it can't differ from what CI checked.

**Hand-over**
- `registry.json` stays checked in. CI never needs the generator.
- `registry:import` validates the file, copies it in, and prints the added, removed and reclassified components. The tool-listing snapshots then show the effect in review.

**Text split**
- Code owns the tool API text: what the tool does, its parameters, error hints (R5).
- The registry owns component knowledge. `get_<component>` descriptions combine the code's text with the registry summary, and R6 cards render from the registry.
- R5's context budget still applies to the combined descriptions.

**Retirement.** When the generator's output passes the contract and produces an identical tool listing, delete `tools/manifest/*`, `docs/guidance-overlay*.json`, `validate-guidance-overlay`, `generate-manifest`, and the `fast-glob` dev dependency. `ajv` and `ajv-formats` stay: a core test validates against the exported `docs/registry.schema.json` with them (R4b B2). Update the R3 path checklist to match.

### R5 English base language and the context budget

Do one area per PR, and check each against the [failure catalog](../../.github/skills/tool-description-quality/references/failure-catalog.md). The order below was decided on 2026-10-02.
1. **Scripted baseline first.** A small harness runs 8–10 scenario tasks (Wohngeld wizard, contact form, landing page) against the stdio server through a model API, and records invalid calls, retries and tokens. It runs against the R4 release, then again after each step below, so the comparisons are cheap and repeatable. VS Code Copilot and Claude Code stay as manual spot checks.
2. **Add a context-budget test.** It prints per-tool sizes and fails above the budget: ≤ 120K compact characters model-facing for the full toolset, ≤ 60K for a compact profile, with `outputSchema` reported but not counted. (The original 60K target predates R2b and R4; the model-facing part alone was 200K on 2026-09-29.)
3. **Shrink the standalone block tools with option B.** It comes before the English pass, because it changes which text is repeated: afterwards the block union appears in 2 tools instead of 8.
   - **(B)** `get_section`, `get_card`, `get_card_group`, `get_grid`, `get_disclosure` and `get_fieldset` accept a smaller block set, and deep nesting goes through `render_composition` and `render_page`. Measure a fixed shallow set against sets matched to each tool's job before choosing.
   - **(A)** 2020-12 `$defs`/`$ref` was measured on 2026-09-29 and made the input schemas larger (186.6K to 256.5K): the duplication is across tools, and a tool can't reference another tool's schema.
4. **The `examples` table and its golden test**, before the hints are rewritten, so hints are built from tested payloads instead of translated as prose.
5. **English becomes the base** for every `.describe()`, tool description and `COMPOSITION_CHEAT_SHEET`, one area per PR. German stays as listed in the decisions table.
6. **Trim descriptions** to *what + when + a pointer to the resource*. Long payloads move into `examples`. Component tool descriptions carry API text only; the "when" comes from the registry summary later (R4b), and about 7K of the budget stays free for it.
7. **Optional toolset profile.** `KERN_TOOLSET=full|compact` is server config, so the listing doesn't vary per connection.
   - The compact profile keeps `render_composition`, `render_page`, `render_component({componentId, props})`, `validate_html` and the docs tools.
   - VS Code Copilot caps how many tools can be enabled per request (128 at the time of writing). The full set is 55 tools, so this is about context size, not the cap.

### R5.1 output polish

The R4 leftovers that change tool output: the grid's layout-systems warning, the default text-field hint, spacing between top-level blocks, and fieldset group errors in the error summary. They wait until R5's measurements are done, so the baseline and every re-run see the same output.

## R6 resources (`packages/core/src/resources`)

Content is generated at runtime from existing data and cached: the registry, Zod schemas, `examples`, the overlay, `validate.ts` rules, and the utility, token and icon data. Everything is served with `cacheScope: "public"` and a long `ttlMs`, since content only changes per release.
- **YAML** is used where the data is tabular. It takes the `yaml` dependency, which has no transitive dependencies.
- **Markdown** is used where the content is prose plus HTML, with HTML in fenced blocks so nothing needs escaping.
- English is the base. Where the overlay has German text, cards add a `de` section.

| URI | MIME | Content |
|---|---|---|
| `kern://components` | `application/yaml` | Index: id, title, status, category, tool, one-line summary |
| `kern://components/{id}` (template, `{id}` completion) | `text/markdown` | Card: status, tool, summary, a **`yaml` field digest from the Zod schema** (name, type, required, enum, default, description), examples, canonical HTML, reviewed guidance, applicable validation rules, related tools, anti-use cases |
| `kern://components/{id}/schema` | `application/schema+json` | The exact input JSON Schema |
| `kern://guides/composition` | `text/markdown` | Block kinds, nesting matrix, cheat sheet, form and field blocks |
| `kern://guides/forms` | `text/markdown` | Label/hint/error pattern, ids and `aria-describedby`, optional marking, error summary, from `foundations.ts` + KERN Form Controls |
| `kern://guides/layout` | `text/markdown` | Container/row/col, 12-column rule, breakpoints, spacing tokens, heading hierarchy, `kern-layer` surfaces |
| `kern://guides/accessibility` | `text/markdown` | The 13 `validate.ts` rules with de/en messages and how to satisfy each |
| `kern://tokens`, `kern://utilities`, `kern://icons` | `application/yaml` | Existing data from `get_tokens`, [templates/utility-reference.ts](../../packages/core/src/ux/templates/utility-reference.ts), `VALID_ICON_NAMES` |
| `kern://templates/page-shell` | `text/html` | HTML5 shell: `lang`, KERN CSS/fonts, skip link, `<main>` |

The existing docs tools stay, because OpenAI clients and many others only consume tools. `get_component_docs` adds `resource_link`s to the matching cards.

## R7 prompts (`packages/core/src/prompts`)

Each prompt returns:
- a user message holding the workflow (which tools, in what order, which rules)
- the embedded relevant guide(s)
- `resource_link`s to the component cards it relies on

`locale` and `componentId` offer completion via `completable()`.

| Prompt | Args (strings) | Workflow it encodes |
|---|---|---|
| `create_page_layout` | `purpose`, `sections?`, `locale?` | `render_page`: header pattern, sections/grid/cards, footer, then `validate_html` |
| `create_input_form` | `purpose`, `fields` (free text, e.g. "Vorname, Nachname, E-Mail, Geburtsdatum"), `locale?` | Map fields to input types, `form` block with fieldsets, error-summary pattern, `validate_html` with `strict` |
| `create_wizard_form` | `purpose`, `steps`, `locale?` | `formFlow` per step (or `renderAllSteps`), tasklist and progress, review step via `get_summary`, submit on the last step |
| `review_kern_html` | `html` | `validate_html`, the accessibility guide, a fix list, re-render with the correct tools |
| `explain_component` | `componentId` | Embed the card and suggest the matching tool call |

## Verification

**Every PR:** `npm run lint`, the typecheck, `npm test`. A change to the MCP contract adds an entry to [docs/migration-2.0.md](../migration-2.0.md) in the same commit.

**Listing**
- The domain snapshot ([tools-list.json](../../packages/core/src/ux/__snapshots__/tools-list.json)) stays.
- A new wire-level `mcp-tools-list.json`, taken from `client.listTools()`.
- A per-tool check that the wire `inputSchema` deep-equals the domain schema, ignoring key order.
- Memoised schemas are frozen in tests to catch mutation.
- Snapshot diffs get reviewed in their own PR.

**Core e2e** ([server.mcp.test.ts](../../src/server.mcp.test.ts)), run with `describe.each` over two setups:
- the 2025 protocol through `InMemoryTransport`
- 2026-07-28 through `createMcpHandler(f).fetch` + `StreamableHTTPClientTransport`, since `InMemoryTransport` only speaks the 2025 versions

Assertions:
- invalid arguments give `isError` with the hint text
- strict failures and an unknown `componentId` give `isError`
- an unknown tool rejects with -32602
- `structuredContent` matches `outputSchema`
- `ttlMs`/`cacheScope` are present on 2026 responses

**Golden tests**
- Every `examples[]` entry and cheat-sheet example goes through `callTool` with `strict: true`, giving `validation.ok`.
- Every tool name mentioned in descriptions, guides and prompts exists.

**Resources and prompts**
- File snapshots of the lists and of every resource's content.
- `{id}` completion works.
- Every `resource_link` resolves.

**stdio e2e:** spawn both the npm build and the MCPB bundle, on both protocol versions, then list tools and call `get_button`.

**HTTP e2e**
- listen on port 0 and cover both protocol versions
- a wrong Host or Origin gets 403
- with `KERN_AUTH_TOKEN` set, no token gets 401
- `/healthz` returns 200
- 20 parallel calls, to check that per-request factories are isolated
- a factory-cost budget of a few milliseconds

**Container:** `docker build`, then `docker run -p 3000:3000 -e HOST=0.0.0.0 -e KERN_ALLOWED_HOSTS=localhost:3000`, then check it with `npx @modelcontextprotocol/inspector`.

**Clients**
- VS Code Copilot (`.vscode/mcp.json`, stdio + HTTP)
- Codex CLI (stdio)
- Claude Code (`claude mcp add kern -- node packages/stdio/dist/index.js`)
- Claude Desktop (install the `.mcpb`)
- ChatGPT / Responses API (HTTP via a tunnel)

Run the 3 layout/form prompts where they're supported, and paste the output into [samples/basic-layout/index.html](../../samples/basic-layout/index.html) for a visual check.

## Top risks and guards

1. **Listing drift** (2020-12 dialect, key order, new fields): the adapter, the semantic-equality test, and review of snapshot diffs.
2. **Error semantics change:** it happens on the alpha branch, with an entry in [docs/migration-2.0.md](../migration-2.0.md) and the tests updated in the same PR. (The GitHub release notes come from PRs, and this branch has none.)
3. **HTTP exposure:**
   - `maxLength` on large strings
   - explicit host/origin allowlists in the container
   - documented as trusted-network-only until auth is turned on
4. **Workspace path breakage:** the path checklist plus the packed-install smoke test.
5. **Missing dependency in a published bundle** (because core is inlined): the dependency-declaration check plus the packed-install smoke test.
6. **Partial publish:** idempotent publish steps.
7. **English rewrite changes LLM behaviour:** it happens late, split by area, measured against the baseline, and checked against the failure catalog.

## Other ideas (not scheduled)

- **Publish to the official MCP Registry** (`server.json`): the npm package, the OCI image, and later a remote URL.
- **MCP Apps extension:** a live HTML preview of rendered output (a `ui://` resource) in hosts that support it.
- **Harvest more KERN docs:** superseded by the external generator and the docs corpus (finding 22, R4b). The ideas still apply there: the `COMPONENTS.MD` Form Controls `###` sections, and story `parameters.docs.description` fields.
- **Clean-up:** the junk `index` component (from `_index.scss`) and the `tests` story folder (new in `kern-ux-plain` 2.8.2) belong on the generator's exclusion list. `get_index` goes once code owns the tool list (R4b). `docs/registry.schema.json` is replaced in R4b.
