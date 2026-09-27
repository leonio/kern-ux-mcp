# Plan v2 findings

These findings come from the `src/` discovery done during the TS7 upgrade, on 2026-09-27. Line numbers refer to the code at that point and will drift as items land.

Each finding has the same four parts:

- **Where**: the files and lines involved
- **Problem**: what's wrong today
- **Proposal**: the suggested change
- **Risk**: what could break, and how to guard against it

---

## 1. Wiring lives in `server.ts`, not `index.ts`

**Where:** [src/index.ts](../../src/index.ts), [src/server.ts:511-565](../../src/server.ts)

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
- Several hints repeat the known-good payload that is already in the tool's `description`. `get_section` is one example, at [tools.ts:503](../../src/ux/tools.ts).

**Proposal:**

1. Extend `ToolDef` in [src/ux/tool-builders/shared.ts:14](../../src/ux/tool-builders/shared.ts):

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

**Note:** [src/test-support/tools.ts](../../src/test-support/tools.ts) already exports a test helper named `invokeTool`, which only calls `tool.handler`. When the production function lands, rename the test helper (for example to `callHandler`), or make the tests use the real pipeline.

## 4. Duplicated output and validation schemas

**Where:**

- The same Zod shape for validation issues appears in [src/ux/tools.ts](../../src/ux/tools.ts) at `buildComponentTool` (~79), `buildValidateHtmlTool` (~155), `buildGetSectionTool` (~480), `buildGetCardGroupTool` (~524), `buildGetDisclosureTool` (~570) and `buildRenderCompositionTool` (~665).
- `ComponentOutputSchema` already exists at [src/ux/tool-builders/shared.ts:25](../../src/ux/tool-builders/shared.ts).
- The TS type `ValidationResult` in [src/ux/validate.ts:4](../../src/ux/validate.ts) is declared separately.

**Problem:** There are 7 copies of the same contract, so a change to the validation output has to be made in every one.

**Proposal:**

- Export `ValidationIssueSchema` and `ValidationResultSchema` from `validate.ts`, or a new `validate.schema.ts`.
- Derive `ValidationResult = z.infer<…>` from them.
- Reuse `ComponentOutputSchema` for every HTML-producing tool.

**Risk:** Low. Watch for small differences between the copies:

- `validate_html` has no `.default([])` on `issues`.
- `buildComponentTool` has no `warnings` field, even though its handler returns `warnings`.

## 5. Duplicated HTML-tool handlers

**Where:** The `get_section`, `get_card_group` and `get_disclosure` handlers ([src/ux/tools.ts:478-611](../../src/ux/tools.ts)), and `render_composition` ([~693](../../src/ux/tools.ts)).

**Problem:** All four handlers follow the same steps as `buildParameterizedComponentTool` ([shared.ts:96](../../src/ux/tool-builders/shared.ts)):

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

**Where:** [src/ux/tool-builders/interactive.ts](../../src/ux/tool-builders/interactive.ts)

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

**Risk:** Medium. The descriptions are long strings, so copy them exactly. The tool-listing snapshot ([src/ux/tools.listing.test.ts](../../src/ux/tools.listing.test.ts)) catches any change to names, descriptions or schemas.

## 7. Double routing in `createTools`

**Where:** [src/ux/tools.ts:781-815](../../src/ux/tools.ts)

**Problem:** The loop checks the manifest `strategy` first. It then falls back to `component.category === "interactive"`, `LAYOUT_MANIFEST_IDS` and `TYPOGRAPHY_MANIFEST_IDS`. That's two sources of truth for the same decision.

**Proposal:**

1. Confirm that `tools/manifest/build-manifest.ts` always emits a `strategy`.
2. Delete the fallback branches and the ID sets. If the sets are still needed, move them into the manifest generator.
3. Replace the if-chain with a `Record<ComponentStrategy, (c) => ToolDef>`.

**Risk:** Low to medium, depending on the manifest guarantee. Add a test asserting that every registry component has a strategy.

**Coverage evidence (2026-09-27):** `tools.ts` lines 804-814 never ran. That isn't because they're unreachable. `strategy` is required, and the path only runs for a *foundational* component with `strategy: "fallback"`. All 12 fallback components in the checked-in registry are interactive. `tools.routing.test.ts` ("foundational components with strategy=fallback") now pins the current behaviour: the layout ID set, then the typography ID set, then generic canonical HTML. Decide explicitly whether the ID sets should stay as a safety net or the generator should guarantee a precise strategy, and update those tests in the same PR.

## 8. Types are erased at the `ToolDef` boundary

**Where:** `ToolDef` and `ToolHandler` at [src/ux/tool-builders/shared.ts:10-21](../../src/ux/tool-builders/shared.ts)

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

**Where:** [src/ux/tools.ts:697-739](../../src/ux/tools.ts)

**Problem:** Four mutually recursive arrow functions are rebuilt on every call, each using an `as Parameters<typeof buildX>[0]` cast. The recursion wiring is rendering logic, but it sits inside a tool definition.

**Proposal:** Move it to `src/ux/templates/composition-renderer.ts` as `createCompositionRenderer(locale)`, which returns `{ renderBlocks(blocks) }`. Replace the casts with the schema output types.

**Risk:** Low. `composition_tool.test.ts` covers this code.

## 10. Hard-coded server version

**Where:** [src/server.ts:515](../../src/server.ts)

**Problem:** The server always reports `version: "0.1.0"`, but the package version is injected by CI (package.json has `0.0.0-semver`).

**Proposal:** Read the version at startup, the same way `registry.ts` locates `registry.json`. Alternatively, `copy-manifest.mjs` could write the version into `dist` at build time.

**Risk:** Low.

## 11. The registry check parses tool names

**Where:** `validateRegistryAgainstToolNames`, [src/ux/registry.ts:55](../../src/ux/registry.ts)

**Problem:** It strips `get_` from each tool name and special-cases `component_docs` to recover component IDs. Any tool that isn't named `get_<id>` breaks the check without any error.

**Proposal:**

- Add an optional `componentId` to `ToolDef` and set it in the builders.
- Check `registry.components` against that field instead.
- The warning text still says "update createTools()". Update the text once item 7 lands.

**Risk:** Low.

## 12. Dead or duplicated code

- `export type ToolSchemas` at [src/server.ts:567](../../src/server.ts) isn't used anywhere.
- `localizeIssues` at [src/ux/validate.ts:326](../../src/ux/validate.ts) isn't used, and its `_locale` parameter is ignored.
- `_hasClass` at [src/ux/validate.ts:23](../../src/ux/validate.ts) isn't used.
- `experimentalBanner` at [shared.ts:45](../../src/ux/tool-builders/shared.ts) is an alias of `statusBanner`. It's still used in `layout.ts` and `typography.ts`, and the name is misleading because the function handles deprecated components too.
- `validate_html` computes `const _locale = pickLocale(...)` and never uses it ([tools.ts:174](../../src/ux/tools.ts)). Its `locale` input is effectively ignored.
- `getCanonicalHtmlFromManifest` at [tools.ts:62](../../src/ux/tools.ts) is a one-line indirection.
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

**Where:** [src/ux/schemas/form-flow.ts](../../src/ux/schemas/form-flow.ts) and the inline `formFlow` branch of [src/ux/schemas/content-union.ts](../../src/ux/schemas/content-union.ts) (~line 234).

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

Items 17–21 come from the MCP 2026-07-28 discovery on the same date. They feed the 2.0 roadmap in [roadmap.md](roadmap.md).

## 17. SDK v2 migration facts

**Where:**
- [src/server.ts:511-565](../../src/server.ts): the low-level `Server` and hand-written handlers
- [src/index.ts](../../src/index.ts)
- [src/ux/json-schema.ts](../../src/ux/json-schema.ts)
- [src/server.mcp.test.ts](../../src/server.mcp.test.ts)

**Problem:**
- `@modelcontextprotocol/sdk` 1.30.0 supports protocol versions up to `2025-11-25`, and its low-level `Server` is marked `@deprecated`.
- Protocol `2026-07-28` (stateless, `server/discover`, cache hints, `isError` for validation errors) needs SDK v2. So do the resources, prompts and HTTP hosts in the roadmap.
- Handing our Zod schemas to the SDK natively doesn't work:
  - v1 `McpServer` advertises the 4 tools with a `discriminatedUnion` root (`get_accordion`, `get_checkbox`, `get_radio`, `get_summary`) as **empty** object schemas, and changes the 6 recursive ones.
  - v2 generates 2020-12 schemas through `~standard.jsonSchema`, which would change all 52.

**SDK v2 facts gathered during discovery (confirm them against the installed version in R0):**

| Fact | Detail |
|---|---|
| Packages | `@modelcontextprotocol/server` (2.0.0 on 2026-07-27, 2.1.0 on 2026-09-23), `@modelcontextprotocol/node`, `@modelcontextprotocol/client`. Requires `zod ^4.2.0`, which dedupes with our 4.6.x. |
| Schema contract | `registerTool` takes Standard Schema objects. It reads JSON Schema from `~standard.jsonSchema.input()` and validates with `~standard.validate` before the handler runs. It wraps the result as `{ type: "object", ...json }`, which moves `type` ahead of `$schema`. |
| Validation errors | The text reads `Input validation error: Invalid arguments for tool <name>: <issues>`, with a path prefix on each issue. Our adapter should return one issue with no path, and drop our own "Invalid arguments" header. |
| Unknown tool | Rejects with JSON-RPC `-32602` (`Tool <name> not found`). v1.30 returned an `isError` result instead. |
| Schema cost | JSON Schemas are converted when a tool is registered. A per-request factory therefore pays for all 52 conversions on every HTTP request, unless the adapter returns memoised schemas. |
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

## 18. Composition gaps and bugs

**Where:**
- [src/ux/schemas/content-union.ts](../../src/ux/schemas/content-union.ts) and [src/ux/templates/content-union.ts](../../src/ux/templates/content-union.ts): the block kinds
- [src/ux/templates/form-flow.ts:134-144](../../src/ux/templates/form-flow.ts)
- [src/ux/templates/fieldset.ts:20](../../src/ux/templates/fieldset.ts)
- [src/ux/validate.ts:231](../../src/ux/validate.ts)
- `templates/card.ts:105-109`, `templates/grid.ts:84-88`, [src/ux/tool-builders/layout.ts:70](../../src/ux/tool-builders/layout.ts)

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

**Where:** [src/ux/__snapshots__/tools-list.json](../../src/ux/__snapshots__/tools-list.json), [src/ux/json-schema.ts](../../src/ux/json-schema.ts), and the tool descriptions in `tools.ts` and `tool-builders/*`.

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

**Where:** [tools/manifest/build-manifest.ts:557](../../tools/manifest/build-manifest.ts), [src/ux/registry.json](../../src/ux/registry.json), [package.json](../../package.json), `validate_html` in [src/ux/tools.ts](../../src/ux/tools.ts).

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
