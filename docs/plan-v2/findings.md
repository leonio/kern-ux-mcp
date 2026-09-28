# Plan v2 findings

These findings come from the `src/` discovery done during the TS7 upgrade, on 2026-09-27. Line numbers refer to the code at that point and will drift as items land.

Each finding has the same four parts:

- **Where**: the files and lines involved
- **Problem**: what's wrong today
- **Proposal**: the suggested change
- **Risk**: what could break, and how to guard against it

---

## 1. Wiring lives in `server.ts`, not `index.ts`

**Where:** [src/index.ts](../../packages/stdio/src/index.ts), [src/server.ts:511-565](../../src/server.ts)

**Problem:** None in `index.ts` itself. At 15 lines, it's a good entry point. Tool wiring actually happens in `createServer()`, which works like this:

- It builds the low-level `Server` from `@modelcontextprotocol/sdk/server/index.js`.
- It calls `createTools(registry)`.
- It registers `ListToolsRequestSchema` and `CallToolRequestSchema` handlers by hand.
- The call handler inlines the whole pipeline: normalize → parse → handle → validate output → wrap.

**Proposal:** Keep `index.ts` as it is. Items 2, 3 and 15 slim down `createServer()`.

**Risk:** None. This finding is context only.

## 2. Per-tool behaviour is keyed by name strings in `server.ts`

**Where:**

- `formatInputValidationError`, [src/server.ts:219-331](../../src/server.ts): 12 `if (name === "get_…")` branches that return a "Known-good payload" hint.
- `normalizeToolArgs`, [src/server.ts:337-509](../../src/server.ts): 6 branches that alias or default arguments for get_inputtext, get_inputnumber, get_inputfile, get_tasklist, get_dialog and get_section.

**Problem:**

- Adding or renaming a tool means editing `server.ts` far from the tool's definition. Nothing checks that the names still match.
- Several hints repeat the known-good payload that is already in the tool's `description`. `get_section` is one example, at [tools.ts:503](../../packages/core/src/ux/tools.ts).

**Proposal:**

1. Extend `ToolDef` in [src/ux/tool-builders/shared.ts:14](../../packages/core/src/ux/tool-builders/shared.ts):

   ```ts
   normalize?: (args: Record<string, unknown>) => unknown;
   errorHint?: string | ((error: z.ZodError) => string);
   ```

2. Move each branch next to its builder.
3. Have `server.ts` call `tool.normalize?.(args)`, and append `tool.errorHint` when it's set.
4. `render_composition` uses a function-valued `errorHint`: move `formatCompositionError` next to that tool.

**Risk:** Low. `src/server.normalize.test.ts` and `src/server.validation.test.ts` cover the behaviour, so move the tests along with the code. The error message text must stay identical.

## 3. Extract the call pipeline and the logging from `server.ts`

**Where:** The call pipeline is at [src/server.ts:534-562](../../src/server.ts). The debug logging helpers are at [src/server.ts:18-50](../../src/server.ts).

**Problem:**

- The pipeline can only be exercised through an MCP request handler.
- The debug logging is private to `server.ts`, so tool builders can't use it.

**Proposal:**

- Add `src/invoke.ts` (or `src/ux/invoke.ts`) exporting `invokeTool(tool, rawArgs): Promise<unknown>`. It runs normalize, safeParse, the handler, and output validation, throwing the formatted errors.
- The request handler becomes: look up the tool, call `invokeTool`, then `createTextToolResult`.
- Move `isDebugEnabled`, `toDebugString` and `debugLog` into `src/logging.ts`.

**Risk:** Low. This is a pure extraction. [src/server.mcp.test.ts](../../src/server.mcp.test.ts) covers the handler end to end.

**Note:** [src/test-support/tools.ts](../../packages/core/src/test-support/tools.ts) already exports a test helper named `invokeTool`, which only calls `tool.handler`. When the production function lands, rename the test helper (for example to `callHandler`), or make the tests use the real pipeline.

## 4. Duplicated output and validation schemas

**Where:**

- The same Zod shape for validation issues appears in [src/ux/tools.ts](../../packages/core/src/ux/tools.ts) at `buildComponentTool` (~79), `buildValidateHtmlTool` (~155), `buildGetSectionTool` (~480), `buildGetCardGroupTool` (~524), `buildGetDisclosureTool` (~570) and `buildRenderCompositionTool` (~665).
- `ComponentOutputSchema` already exists at [src/ux/tool-builders/shared.ts:25](../../packages/core/src/ux/tool-builders/shared.ts).
- The TS type `ValidationResult` in [src/ux/validate.ts:4](../../packages/core/src/ux/validate.ts) is declared separately.

**Problem:** There are 7 copies of the same contract, so a change to the validation output has to be made in every one.

**Proposal:**

- Export `ValidationIssueSchema` and `ValidationResultSchema` from `validate.ts`, or a new `validate.schema.ts`.
- Derive `ValidationResult = z.infer<…>` from them.
- Reuse `ComponentOutputSchema` for every HTML-producing tool.

**Risk:** Low. Watch for small differences between the copies:

- `validate_html` has no `.default([])` on `issues`.
- `buildComponentTool` has no `warnings` field, even though its handler returns `warnings`.

## 5. Duplicated HTML-tool handlers

**Where:** The `get_section`, `get_card_group` and `get_disclosure` handlers ([src/ux/tools.ts:478-611](../../packages/core/src/ux/tools.ts)), and `render_composition` ([~693](../../packages/core/src/ux/tools.ts)).

**Problem:** All four handlers follow the same steps as `buildParameterizedComponentTool` ([shared.ts:96](../../packages/core/src/ux/tool-builders/shared.ts)):

1. `pickLocale`
2. `strict`
3. build
4. `validateHtmlStrict`
5. `assertStrictValidationOrThrow`
6. return `{ html, warnings, validation }`

The only difference is that they aren't tied to a manifest component.

**Proposal:** Add `buildHtmlTool({ name, description, inputSchema, render, component? })`, and make `buildParameterizedComponentTool` a thin wrapper around it. The optional `component` adds the status banner and the status warnings.

**Risk:** Low.

## 6. Interactive tool routing is declared three times

**Where:** [src/ux/tool-builders/interactive.ts](../../packages/core/src/ux/tool-builders/interactive.ts)

- `INTERACTIVE_PARAMETERIZED_IDS` (line 72)
- 26 small `buildXTool` functions (lines 103-357)
- a 26-case `switch` in `buildPriorityComponentTool` (line 359)

**Problem:** Adding a component takes edits in three places in this file, plus a schema, a template and possibly `server.ts` (item 2). If they drift apart, the `default: throw` in the switch fires at runtime.

**Proposal:** Use one declarative table:

```ts
const INTERACTIVE_TOOLS = {
  button: { schema: ButtonSchema, build: buildButton, description: "…" },
  // …
} satisfies Record<string, InteractiveToolSpec>;
```

The ID set becomes `Object.keys(...)`, and dispatch becomes a lookup. With items 2 and 8, each entry can also carry `normalize` and `errorHint`.

**Risk:** Medium. The descriptions are long strings, so copy them exactly. The tool-listing snapshot ([src/ux/tools.listing.test.ts](../../packages/core/src/ux/tools.listing.test.ts)) catches any change to names, descriptions or schemas.

## 7. Double routing in `createTools`

**Where:** [src/ux/tools.ts:781-815](../../packages/core/src/ux/tools.ts)

**Problem:** The loop checks the manifest `strategy` first. It then falls back to `component.category === "interactive"`, `LAYOUT_MANIFEST_IDS` and `TYPOGRAPHY_MANIFEST_IDS`. That's two sources of truth for the same decision.

**Proposal:**

1. Confirm that `tools/manifest/build-manifest.ts` always emits a `strategy`.
2. Delete the fallback branches and the ID sets. If the sets are still needed, move them into the manifest generator.
3. Replace the if-chain with a `Record<ComponentStrategy, (c) => ToolDef>`.

**Risk:** Low to medium, depending on the manifest guarantee. Add a test asserting that every registry component has a strategy.

**Coverage evidence (2026-09-27):** `tools.ts` lines 804-814 never ran. That isn't because they're unreachable. `strategy` is required, and the path only runs for a *foundational* component with `strategy: "fallback"`. All 12 fallback components in the checked-in registry are interactive. `tools.routing.test.ts` ("foundational components with strategy=fallback") now pins the current behaviour: the layout ID set, then the typography ID set, then generic canonical HTML. Decide explicitly whether the ID sets should stay as a safety net or the generator should guarantee a precise strategy, and update those tests in the same PR.

## 8. Types are erased at the `ToolDef` boundary

**Where:** `ToolDef` and `ToolHandler` at [src/ux/tool-builders/shared.ts:10-21](../../packages/core/src/ux/tool-builders/shared.ts)

**Problem:**

- `inputSchema` is typed as `z.ZodType`, and the handler uses a bivariance hack that takes `unknown`.
- As a result, each handler writes its argument type by hand, for example `args: { locale?: Locale; strict?: boolean }`. Nothing ties that type to the schema.
- Several handlers annotate `z.input<typeof inputSchema>`, but they receive the parsed `z.output<…>`. The difference matters wherever a schema uses `.default()` or `.transform()`.
- `buildParameterizedComponentTool<TArgs>` accepts any `TArgs`, whatever `inputSchema` is.

**Proposal:**

```ts
function defineTool<I extends z.ZodType, O extends z.ZodType>(def: {
  name: string; description: string; inputSchema: I; outputSchema: O;
  handler: (args: z.output<I>) => Promise<z.input<O>>;
  normalize?: …; errorHint?: …;
}): ToolDef { … }
```

The registry keeps storing the erased `ToolDef`, but each tool's definition is checked at the point where it's written.

**Risk:** Medium. It may surface real type mismatches, which is the point of the change. Do it after item 4, so that the output schemas are already shared.

## 9. The `render_composition` closure web

**Where:** [src/ux/tools.ts:697-739](../../packages/core/src/ux/tools.ts)

**Problem:** Four mutually recursive arrow functions are rebuilt on every call, each using an `as Parameters<typeof buildX>[0]` cast. The recursion wiring is rendering logic, but it sits inside a tool definition.

**Proposal:** Move it to `src/ux/templates/composition-renderer.ts` as `createCompositionRenderer(locale)`, which returns `{ renderBlocks(blocks) }`. Replace the casts with the schema output types.

**Risk:** Low. `composition_tool.test.ts` covers this code.

## 10. Hard-coded server version

**Where:** [src/server.ts:515](../../src/server.ts)

**Problem:** The server always reports `version: "0.1.0"`, but the package version is injected by CI (package.json has `0.0.0-semver`).

**Proposal:** Read the version at startup, the same way `registry.ts` locates `registry.json`. Alternatively, `copy-manifest.mjs` could write the version into `dist` at build time.

**Risk:** Low.

## 11. The registry check parses tool names

**Where:** `validateRegistryAgainstToolNames`, [src/ux/registry.ts:55](../../packages/core/src/ux/registry.ts)

**Problem:** It strips `get_` from each tool name and special-cases `component_docs` to recover component IDs. Any tool that isn't named `get_<id>` breaks the check without any error.

**Proposal:**

- Add an optional `componentId` to `ToolDef` and set it in the builders.
- Check `registry.components` against that field instead.
- The warning text still says "update createTools()". Update the text once item 7 lands.

**Risk:** Low.

## 12. Dead or duplicated code

- `export type ToolSchemas` at [src/server.ts:567](../../src/server.ts) isn't used anywhere.
- `localizeIssues` at [src/ux/validate.ts:326](../../packages/core/src/ux/validate.ts) isn't used, and its `_locale` parameter is ignored.
- `_hasClass` at [src/ux/validate.ts:23](../../packages/core/src/ux/validate.ts) isn't used.
- `experimentalBanner` at [shared.ts:45](../../packages/core/src/ux/tool-builders/shared.ts) is an alias of `statusBanner`. It's still used in `layout.ts` and `typography.ts`, and the name is misleading because the function handles deprecated components too.
- `validate_html` computes `const _locale = pickLocale(...)` and never uses it ([tools.ts:174](../../packages/core/src/ux/tools.ts)). Its `locale` input is effectively ignored.
- `getCanonicalHtmlFromManifest` at [tools.ts:62](../../packages/core/src/ux/tools.ts) is a one-line indirection.
- `src/ux/stories.ts` is used only by `stories.test.ts`. [tools/manifest/build-manifest.ts:222](../../tools/manifest/build-manifest.ts) has its own copy of `extractStoryHtmlTemplates`. Keep one copy: the tools version, or make it import the `src` one.
- `src/ux/paths.ts` (`getKernUxPlainRoot`) is used only by the build-time tools, but it ships in `dist`. Move it under `tools/`.

- `templates/typography.ts` ends its `switch (params.kind)` with a `default` branch that can't run, because `TypographyRenderSchema` only allows the 8 handled kinds. Replace it with an exhaustive `const _exhaustive: never = params.kind` check.
- `RecursiveContentRenderOptions.renderFormFlowNode` in `templates/content-union.ts` is declared but never read. `formFlow` always uses `buildFormFlow` directly.

**Risk:** Low. Check with `grep` again before deleting anything.

**Coverage evidence (2026-09-27):**

- `paths.ts` is at 0%. Nothing in the runtime loads it.
- `validate.ts` is at 44% of functions, partly because of the unused `_hasClass` and `localizeIssues`.
- `validate.ts` guards every parser call (`root.querySelectorAll?.(…) ?? []`, `getAttribute?.`) through a hand-written `HtmlNodeLike` type. `node-html-parser` always provides those methods, so the fallback branches can never run. They are dead code and cap branch coverage. Use the parser's own `HTMLElement` type and drop the `?.`/`?? []` guards.

## 13. The tooling isn't type-checked

**Where:** [tsconfig.json](../../tsconfig.json) (`include: ["src/**/*.ts"]`) and CI `npx tsc --noEmit`.

**Problem:**

- `tools/manifest/*.ts` and `vitest.config.ts` run through tsx or Vitest (esbuild), which don't type-check. Type errors there go unnoticed.
- Known issue: [tools/manifest/guidance-overlay.ts:4](../../tools/manifest/guidance-overlay.ts) has `import Ajv2020 from "ajv/dist/2020"`. It has no extension, which NodeNext resolution rejects.

**Proposal:**

1. Add `tsconfig.tools.json`, extending the base config with `rootDir: "."`, `noEmit: true`, and include `tools/**/*.ts` and `vitest.config.ts`.
2. Add a CI step: `npx tsc -p tsconfig.tools.json`.
3. Fix the ajv import, for example `"ajv/dist/2020.js"`.

**Risk:** Low. Expect a few errors to surface on the first run.

## 14. Optional hardening

- **`verbatimModuleSyntax: true`.** The code already uses `import type` consistently, so this is a stricter successor to `isolatedModules`, which was added in the TS7 upgrade.
- **Target ES2024.** Node ≥ 24.16 supports ES2024 fully. The build currently targets ES2022, and TS7's default target is es2025.
- **Biome `$schema`.** [biome.json](../../biome.json) points at `2.4.16`, but `^2.5.11` is installed.

## 15. Spike: the high-level `McpServer` API

**Where:** [src/server.ts](../../src/server.ts)

**Problem:** The server hand-rolls tool listing, including the Zod → JSON Schema conversion in `json-schema.ts` (234 lines), and the dispatch. The SDK's `McpServer.registerTool` does both, and adds typed handlers and `structuredContent` / `outputSchema` support.

**Proposal:** Time-box a spike to answer three questions:

- Is SDK 1.29 compatible with our Zod 4 schemas?
- Does its JSON Schema output match what `toolInputSchemaToJsonSchema` produces today? `json-schema.ts` inlines `$defs` and forces an object root for a reason, probably client compatibility.
- Can the custom error formatting (item 2) still be applied?

Only migrate if the tool listing stays byte-compatible, or if a change to it is accepted on purpose.

**Risk:** Unknown until the spike is done. Do it last, after items 2, 3 and 8, when the migration would be mechanical.

## 16. The `formFlow` schema is defined twice, and one copy is dead

**Where:** [src/ux/schemas/form-flow.ts](../../packages/core/src/ux/schemas/form-flow.ts) and the inline `formFlow` branch of [src/ux/schemas/content-union.ts](../../packages/core/src/ux/schemas/content-union.ts) (~line 234).

**Problem:**

- Coverage shows `schemas/form-flow.ts` at 0% statements. It is never loaded when the server runs, because its only import is `import type { FormFlowInput }` in `templates/form-flow.ts`, and that import disappears at compile time.
- The schema that actually validates `formFlow` blocks is written out separately inside `content-union.ts`.
- So the template is typed against a schema that never validates anything, and the two copies can drift apart without any test noticing. `FormFlowStepSchema.contentBlocks` is already typed as `z.array(z.any())`.

**Proposal:** Make `schemas/form-flow.ts` the single source:

1. Use `FormFlowSchema`, with its step `contentBlocks` supplied lazily as the recursive node schema, inside `content-union.ts`.
2. Derive `FormFlowInput` from it, and delete the inline copy.
3. If the recursion makes that awkward, go the other way: delete `schemas/form-flow.ts` and derive the type from the content-union branch.

**Also:** there is a third hand-written copy: the `FormFlowContentNodeInput` TS type in `schemas/content-union.ts`.

**Risk:** Low to medium. The tool-listing snapshot will show whether the emitted JSON Schema for `render_composition` changes, and it should stay identical. Existing `form-flow.test.ts` and `composition_tool.test.ts` cover the runtime.

---

Items 17–21 come from the MCP 2026-07-28 discovery on the same date, and item 22 from a later review. They feed the 2.0 roadmap in [roadmap.md](roadmap.md).

## 17. SDK v2 migration facts

**Where:**
- [src/server.ts:511-565](../../src/server.ts): the low-level `Server` and hand-written handlers
- [src/index.ts](../../packages/stdio/src/index.ts)
- [src/ux/json-schema.ts](../../packages/core/src/ux/json-schema.ts)
- [src/server.mcp.test.ts](../../src/server.mcp.test.ts)

**Problem:**
- `@modelcontextprotocol/sdk` 1.30.0 supports protocol versions up to `2025-11-25`, and its low-level `Server` is marked `@deprecated`.
- Protocol `2026-07-28` (stateless, `server/discover`, cache hints, `isError` for validation errors) needs SDK v2. So do the resources, prompts and HTTP hosts in the roadmap.
- Handing our Zod schemas to the SDK natively doesn't work:
  - v1 `McpServer` advertises the 4 tools with a `discriminatedUnion` root (`get_accordion`, `get_checkbox`, `get_radio`, `get_summary`) as **empty** object schemas, and changes the 6 recursive ones.
  - v2 generates 2020-12 schemas through `~standard.jsonSchema`, which would change all 52.

**SDK v2 facts gathered during discovery (confirmed or corrected against 2.1.0 in R0; see [R0 results](#r0-results-2026-09-27) below):**

| Fact | Detail |
|---|---|
| Packages | `@modelcontextprotocol/server` (2.0.0 on 2026-07-27, 2.1.0 on 2026-09-23), `@modelcontextprotocol/node`, `@modelcontextprotocol/client`. Requires `zod ^4.2.0`, which dedupes with our 4.6.x. **R0:** `@modelcontextprotocol/node` has a **peer dependency on `hono` ^4.11.4** and depends on `@hono/node-server` 1.x. The HTTP package must declare `hono`. |
| Schema contract | `registerTool` takes Standard Schema objects. It reads JSON Schema from `~standard.jsonSchema.input({ target: "draft-2020-12" })` and validates with `~standard.validate` before the handler runs. It wraps the result as `{ type: "object", ...json }`. **R0:** returning our draft-07 document regardless of the requested target works with every client tested. Key order isn't preserved on the wire anyway: clients re-parse, so legacy clients see `type, properties, …, $schema` and 2026 clients see `$schema, type, …`. Compare listings semantically, never byte for byte. |
| Validation errors | The text reads `Input validation error: Invalid arguments for tool <name>: <issues>`, with a path prefix on each issue. Our adapter should return one issue with no path, and drop our own "Invalid arguments" header. **R0:** confirmed. The exact texts are below. |
| Unknown tool | Rejects with JSON-RPC `-32602` (`Tool <name> not found`) on both eras and every transport. v1.30 returned an `isError` result instead. **R0:** confirmed. |
| Schema cost | **R0 correction:** conversion happens **both** at `registerTool` (for an `x-mcp-header` scan) **and on every `tools/list`**, not only at registration. Without memoisation, every HTTP request would pay 52 conversions at registration plus 52 per listing. With the memoised adapter, `createKernServer()` costs **0.85 ms** for 52 tools. |
| Caching | `ServerOptions.cacheHints` (per operation) and `cacheHint` on `registerResource`. The default is `ttlMs: 0`, `cacheScope: "private"`. |
| Hosts | `serveStdio(factory)` from `@modelcontextprotocol/server/stdio`. `createMcpHandler(factory)` for stateless HTTP, used with `toNodeHandler` in `node:http`. Older eras (2025-06-18, 2025-11-25) are served from the same factory. |
| Host validation | `localhostHostValidation`/`localhostOriginValidation` only fit loopback binds. A container binding `0.0.0.0` needs explicit allowlists. |
| Testing | `InMemoryTransport` speaks only the 2025 versions. To test 2026-07-28 in-process, call `createMcpHandler(f).fetch` through `StreamableHTTPClientTransport`. On stdio, 2026 needs a spawned process. |

**Proposal:**
- Register every tool through a custom Standard Schema adapter, `kernInputSchema(def)`.
  - Its `validate()` runs normalize, then the Zod parse, then the existing hint formatter.
  - Its `jsonSchema.input()` returns the memoised output of `toolInputSchemaToJsonSchema`.
- Build the catalog once at module scope. `createKernServer()` only registers pre-built definitions.
- Run the MCP e2e tests with `describe.each` over both protocol versions.

**Risk:** Medium. Guard it with the existing listing snapshot, plus a wire-level snapshot and a per-tool semantic-equality test, and time-box the spike (R0). Tests asserting `rejects.toThrow` for invalid input must change to `isError` assertions, in the same PR.

### R0 results (2026-09-27)

The spike harness lived under `spike/r0/` on `feat/v2-alpha` until R2 replaced it; `git checkout 31110cf -- spike/r0` restores it (reinstall `@modelcontextprotocol/node` for its HTTP entry). It registers the 52 existing `ToolDef`s unchanged on `McpServer` through a `kernInputSchema()` Standard Schema adapter. Versions: SDK 2.1.0, zod 4.6.5, TS 7.0.2, Node 26.7.0 plus 24.21.0, MCP Inspector 2.8.0.

**The adapter approach works. R2 can go ahead as planned.**

**Listing.** Every setup lists 52 tools whose names, descriptions and `inputSchema`s deep-equal [tools-list.json](../../packages/core/src/ux/__snapshots__/tools-list.json), ignoring key order. The setups:
- SDK client over `InMemoryTransport` (2025)
- `createMcpHandler().fetch` on 2025 and on 2026-07-28
- a spawned stdio process on 2025 and on 2026-07-28
- Inspector CLI over stdio and over HTTP, on both eras

**Error texts.** They're the same on every transport and era, apart from `_meta` on 2026.

| Case | Result |
|---|---|
| Invalid input (`get_button`, `variant: "rainbow"`) | `isError: true`, text: `Input validation error: Invalid arguments for tool get_button: - variant: Invalid option: expected one of "primary"\|"secondary"\|"tertiary"`, then `\nKnown-good payload: …` |
| The same, if our own header is kept | `… for tool get_button: Invalid arguments for get_button:\n- variant: …` (doubled, as predicted). **R2:** strip the header and start the adapter message with `\n`, so the bullet list begins on its own line. |
| Invalid `render_composition` block | `isError: true`, with the `formatCompositionError` hints and cheat sheet, prefixed the same way. Our "(N issues)" header is dropped along with the rest of our header. |
| Strict failure (`render_composition`, `strict: true`, `<img>` without `alt`) | `isError: true`, text: `Strict validation failed for render_composition. Fix errors and retry:\n- <img>-Elemente müssen ein alt-Attribut haben (alt="" für dekorative Bilder).` There's no SDK prefix: any handler throw becomes `isError` with the error's message. That includes output-schema failures. |
| Unknown tool | JSON-RPC error `-32602` `Tool get_does_not_exist not found` |

**Protocol behaviour**
- On 2026, `tools/list` carries `ttlMs: 0, cacheScope: "private"` by default. On 2025 there are no cache fields. So R2b's `cacheHints` are needed for the listing to be cacheable.
- `capabilities.tools.listChanged` defaults to **`true`**, and the Inspector then opens a `subscriptions/listen` stream on 2026. **R2:** pass `capabilities: { tools: { listChanged: false } }`, since the tool set is static.
- `InMemoryTransport` hands over objects without serialising them, so wire tools carry `title`, `icons`, `annotations`, `execution` and `_meta` keys set to `undefined`. The R2 wire snapshot must round-trip through `JSON.stringify` first.
- **stdio on 2026:** the SDK client runs `server/discover` on a **disposable sibling process**, then spawns the real server. SDK-based clients therefore pay server boot twice: about 1.3 s for the first `tools/list` after connect, against about 10 ms afterwards. Boot time matters. Keep module-scope work small.
- The bundled server boots in about 0.4–1 s here; under `tsx` it takes about 1.3 s.
- Don't call `preloadSchemas()`. The SDK recommends lazy loading for Node CLIs, and it only costs about 16 ms.

**HTTP**
- `toNodeHandler` plus `hostHeaderValidation` works as documented. A wrong `Host` gets `403` with `{"code":-32000,"message":"Invalid Host: evil.example"}`.
- Both the Node adapter and the handler cap request bodies at **4 MiB** by default. The `validate_html` `maxLength` (finding 21) should sit well below that.

**Schema portability.** Inspector 2.8.0's `--strict` check reports **0 errors and 2 warnings** across all 52 tools. Both are in `get_summary`: `number` is typed `["string","number"]`, which is less portable to single-`type` dialects such as Gemini's OpenAPI subset. Split it into `anyOf` branches in R5.
- The check doesn't flag the four `anyOf`-root tools, the inlined recursive schemas, or the `$defs`/`$ref` probe.

**TypeScript 7**
- TS 7.0.2 compiles against the v2 `.d.ts` files with `skipLibCheck: false` and `lib: ES2022` (no DOM).
- The only lib error comes from the **v1** SDK (`HeadersInit` without DOM). That error is why `skipLibCheck` is on today, so R2 can consider turning it off.
- JSON import (`import m from "./registry.json" with { type: "json" }`, `resolveJsonModule`, NodeNext) keeps the import attribute in the emitted JS and copies the JSON to `outDir`.
- `tsc -b` with `composite`, plus an incremental rebuild, works.

**Bundle and MCPB**
- esbuild 0.28 (ESM, `--platform=node --target=node24`, fully inlined) produces a 2.0 MB single file. Only `node:` built-ins stay external. `registry.json` is still copied alongside until R3 switches to the JSON import.
- `mcpb` 2.1.2 validates a `manifest_version "0.3"` manifest and packs a **425 kB** `.mcpb`.
- The bundle runs on **Node 24.21.0** and on 26.7.0, on both eras.

**Reported by hand (2026-09-27):** the spike works in Claude and in VS Code Copilot over HTTP. The per-probe results below haven't been recorded yet.

**Still open.** These need a person at each client; the runbook is `spike/r0/CLIENT-MATRIX.md` in the restored harness:
- the matrix for VS Code Copilot, Codex CLI, Claude Code, Claude Desktop, ChatGPT and the Responses API: era, prompts/resources, `$defs`/`$ref`, `anyOf` roots, tool-count limit
- Claude Desktop running the `.mcpb` on Node 24, built-in or system

The R5 schema-shrink choice (A or B) and the compact-profile decision stay gated on those results.

## 18. Composition gaps and bugs

**Where:**
- [src/ux/schemas/content-union.ts](../../packages/core/src/ux/schemas/content-union.ts) and [src/ux/templates/content-union.ts](../../packages/core/src/ux/templates/content-union.ts): the block kinds
- [src/ux/templates/form-flow.ts:134-144](../../packages/core/src/ux/templates/form-flow.ts)
- [src/ux/templates/fieldset.ts:20](../../packages/core/src/ux/templates/fieldset.ts)
- [src/ux/validate.ts:231](../../packages/core/src/ux/validate.ts)
- `templates/card.ts:105-109`, `templates/grid.ts:84-88`, [src/ux/tool-builders/layout.ts:70](../../packages/core/src/ux/tool-builders/layout.ts)

**Problem:** The planned prompts (page layout, input form, wizard) would show up these gaps straight away:

- **No form-field blocks.** The content union has only 9 kinds: `text`, `html`, `button`, `badge`, `section`, `disclosure`, `grid`, `card`, `formFlow`. To build a form today, a model has to render each field with its own `get_*` tool and paste the HTML into an `html` block.
- **No `<form>` wrapper and no page shell.** Nothing emits `<form>` except the dialog, and there's no page, `<main>` or footer tool.
- **Wrong button class in `formFlow`.** The navigation buttons use `kern-button kern-button--*`. The KERN class is `kern-btn`, as used in `templates/button.ts`.
- **More `formFlow` gaps.**
  - It renders only the active step.
  - It has no `<form>`, so its submit button submits nothing.
  - Its `heading` doubles as the tasklist heading.
- **`get_fieldset` can't wrap your own inputs.** It always renders two hard-coded fields (Vorname, Name) with fixed ids `vorname`/`name`. Two fieldsets on one page therefore get duplicate ids.
- **Two form rules never fire.** `form.error_id` and `form.error_describedby` look for `.kern-input__error` and similar. The templates emit `.kern-error`, so neither rule fires on generated output.
- **Accepted nestings get dropped.** The schema accepts nestings the renderer can't produce (a card inside a card, a grid inside a grid, a grid inside a card inside a section/disclosure/grid). Each one is dropped with a warning.
- **Standalone `get_grid` drops sections and disclosures.** It passes no render context, so sections and disclosures inside its columns are skipped.

**Proposal:**
- Add `field` and `form` block kinds that reuse the existing input schemas and templates.
- Fix the `formFlow` class and wrapper, and add `renderAllSteps`.
- Let `get_fieldset` accept child fields.
- Point the validate rules at `.kern-error`.
- Tighten the schema to match what the renderer can produce.
- Add `render_page`.

Do item 9 (`createCompositionRenderer`) first, so the new kinds plug into one renderer. These are roadmap step R4.

**Risk:** Low to medium.
- The class fix and the fieldset change alter the rendered HTML on purpose.
- The new block kinds are additive changes to the `render_composition` input schema.
- Tightening the nesting rules is a breaking schema change, so it belongs on the 2.0 branch.
- `form-flow.test.ts`, `fieldset.test.ts` and `composition_tool.test.ts` cover the affected code.

## 19. Context budget of `tools/list`

**Where:** [src/ux/__snapshots__/tools-list.json](../../packages/core/src/ux/__snapshots__/tools-list.json), [src/ux/json-schema.ts](../../packages/core/src/ux/json-schema.ts), and the tool descriptions in `tools.ts` and `tool-builders/*`.

**Problem:**
- The listing is 282 KB pretty-printed, and **142K characters compact**: about 35–40K tokens, sent to the model on every request.
- Six tools make up about 60K of those characters, because each inlines the full recursive content union:

  | Tool | Schema characters |
  |---|---|
  | `get_card_group` | 10.8K |
  | `get_card` | 10.7K |
  | `get_grid` | 10.3K |
  | `get_section` | 9.7K |
  | `get_disclosure` | 9.3K |
  | `render_composition` | 8.4K |

- Descriptions add another 9.5K characters, mostly German.
- **Since R2b** the listing also carries a `title`, `annotations` and an `outputSchema` per tool: **198K compact characters** for 54 tools. `outputSchema` accounts for 49K of that, because the 48 HTML tools each repeat the same 845-character `ComponentOutputSchema`. Many clients probably pass only name, description and `inputSchema` to the model, which would make this wire size rather than context; the R0 matrix checks it per client.
- VS Code Copilot also limits how many tools can be enabled per request, and 52 tools use a large share of it.

**Proposal:**
- Add a context-budget test that prints per-tool sizes and fails above a budget. The target is under 60K compact characters.
- Then shrink the schemas with one of two options:
  - **(A)** 2020-12 `$defs`/`$ref`. The 2026 spec now defines `$ref` resolution for clients, but legacy client support must be confirmed in R0.
  - **(B)** limit the standalone container tools to a shallow block set, and route deep nesting through `render_composition`.
- Move long payload examples out of descriptions into `examples` and resources.
- Optionally add a `KERN_TOOLSET=compact` profile.

These are roadmap step R5.

**Risk:** Medium. Smaller schemas change what models see, so measure against a scenario baseline before and after, and use the [failure catalog](../../.github/skills/tool-description-quality/references/failure-catalog.md).

## 20. Release config: GitVersion only knows `main`

**Where:** [gitversion.yml](../../gitversion.yml), [.github/workflows/release.yml](../../.github/workflows/release.yml).

**Problem:**
- **No entry for the integration branch.** `gitversion.yml` configures only `main`. `feat/v2-alpha` doesn't match GitVersion's default `feature` pattern (`features?[/-]`), so it falls back to the unknown-branch defaults. Once the first breaking (`!`) commit reaches `main`, the next release from `main` would be 2.0.0.
- **Typo in the patch regex.** The regex on line 6 is `ˆchore\(deps\):`. Its first character is U+02C6 (modifier letter circumflex), not `^`, so the pattern never matches. It's harmless today only because Renovate uses `fix(deps):` commits.

**Proposal:**
- Add a `feat/v2-alpha` branch entry with a pre-release label and `is-release-branch: false`. `release.yml` already maps `preReleaseLabel` to the npm dist-tag, so no workflow change is needed for that.
- Fix the regex.
- Mark the first R2 commit as breaking, so the branch computes `2.0.0-<label>.N`.

This is roadmap step R1.

**Risk:** Low. Check the result with `dotnet-gitversion /showvariable SemVer` on the branch before the first release.

## 21. Leaks and packaging

**Where:** [tools/manifest/build-manifest.ts:557](../../tools/manifest/build-manifest.ts), [src/ux/registry.json](../../packages/core/src/ux/registry.json), [package.json](../../package.json), `validate_html` in [src/ux/tools.ts](../../packages/core/src/ux/tools.ts).

**Problem:**
- **Local path in the package.** `registry.json` stores `sourceRoot: "C:\\src\\github\\leonio\\kern-ux-plain"`, an absolute path from the maintainer's machine, and it ships in the npm package.
- **`fast-glob` ships to users.** It's only used by the build-time manifest generator, but it's listed under `dependencies`.
- **Unbounded HTML input.** `validate_html` accepts an HTML string with no maximum length. That matters once the server is exposed over HTTP.

**Proposal:**
- Replace `sourceRoot` with the upstream KERN version: currently `@kern-ux/native` 2.6.2, commit `b6d9c73`. Resources can then say which KERN version they describe.
- Move `fast-glob` to `devDependencies`.
- Add a `maxLength` to `validate_html.html`, as a deliberate schema change.

This is roadmap step R1.

**Risk:** Low. Regenerating the manifest needs the sibling `kern-ux-plain` checkout. Alternatively, patch the checked-in `registry.json` the same way `build-manifest.ts` would write it, and regenerate on the next manifest run.

---

Item 22 comes from a review, on the same date, of the separate `kern-ux-scraper` repository. It feeds roadmap step R4b.

## 22. The registry moves to an external generator; this repo owns the contract

**Where:**
- [tools/manifest/](../../tools/manifest/): `build-manifest.ts`, `guidance-overlay.ts`, `validate-guidance-overlay.ts`, `paths.ts`, `stories.ts`
- [src/ux/types.ts](../../packages/core/src/ux/types.ts): `RegistryManifest` and `ComponentInfo`, which are TS types only
- [src/ux/registry.ts](../../packages/core/src/ux/registry.ts): loads `registry.json` with only a two-key sanity check
- [docs/registry.schema.json](../registry.schema.json): a hand-written schema that has drifted from the types
- The sibling repository `kern-ux-scraper` (Go, kept outside this repo): it scrapes kern-ux.de into a corpus (`dist/`) and maps it to components (`mapping/`)

**Problem:**
- Today `registry.json` is generated here from the `kern-ux-plain` source alone. The source says which components exist and what their markup is. It doesn't say how or when to use them: usage rules, do's and don'ts, the per-component WCAG audit results, synonyms and related components. Only 15 of 42 components have docs.
- The scraper corpus has that knowledge. The plan is for the scraper repository to become **the registry generator**: source scan, corpus mapping, curation, and LLM-generated English component knowledge. This repo only says "I need a registry". The generator can stay private, while its output ships here.
- **Cycle and duplication in the current prototype.** `tools/corpus-map/build-corpus-map.mjs` reads this repo's *generated* `registry.json`, which the join is meant to produce. It also copies the curated exclusion and alias tables from `build-manifest.ts` ("keep in sync").
- **There is no contract.** The registry shape exists only as TS types, plus a JSON Schema that has drifted. A registry produced elsewhere could break the server in ways that only show up at runtime, on the first request that needs the missing field.
- **Copyright.** kern-ux.de text isn't copied into the registry. An LLM generates English from it. Even so, a translation or close paraphrase can still be a derivative work ("Bearbeitung"). The `kern-ux-plain` source is EUPL-1.2, the same licence as this repo; the licence of the docs site hasn't been checked.

**Proposal:**
- **One owner per side.** The generator owns the source scan, the corpus mapping, the curated tables and the generation. It scans `kern-ux-plain` itself and never reads this repo's `registry.json`, which breaks the cycle. This repo owns the **contract** and the tool implementations.
- **A consumer-driven contract.** `RegistryManifestSchema` is written in Zod here. The TS types are derived from it, and it is exported as JSON Schema, replacing `docs/registry.schema.json`, with a major `manifestVersion`. The generator validates its output against that schema before handing it over. The server validates on load (it already fails at startup) and in CI.
- **Hand-over by import.** `registry.json` stays checked in. `npm run registry:import -- <path>` validates the file, copies it, and prints what changed: components added, removed or reclassified. The listing snapshot and the tests then show the effect in normal review. CI never needs access to the generator.
- **Where English text lives:**
  - This code owns the tool API: Zod schemas, parameter descriptions, and what each tool does (R5).
  - The registry owns component knowledge: summary, when to use, do's and don'ts, accessibility notes, examples and synonyms, as new optional fields.
  - Tool descriptions combine the two (the code's text plus the registry summary), and R6 resources render mostly from the registry.
- **Provenance.** `upstream` gains the corpus version next to the source version. The generator should pin `kern-ux-plain` to the release tag: `bf7c823` is a merge *after* the 2.8.2 release commit.
- **Copyright.** Generate original English from facts, rather than translating the pages. Take example markup from the EUPL source, not from the docs site. Keep attribution. Check the kern-ux.de licence page before release.
- **Retire the in-repo generator** once the external one reaches parity: its output passes the contract and gives an identical tool listing. That removes `tools/manifest/*`, the overlay files and the `fast-glob`/`ajv` dev dependencies. Until then, curation changes (for example excluding the `tests` story folder that `kern-ux-plain` 2.8.2 adds) are needed in both places.

**Risk:** Medium.
- A breaking change to the contract needs coordinated changes in two repositories. `manifestVersion` and validation on load catch a mismatch at import time, not in production.
- LLM-generated component text changes what models see. It goes through the same review as a code change: the listing snapshot, the R5 failure catalog, and the R5 baseline.
