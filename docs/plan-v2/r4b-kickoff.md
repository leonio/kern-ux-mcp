# Kickoff: roadmap step R4b (registry contract)

This file holds the R4b plan, its progress and what was learned. Snapshot date: 2026-10-02. The state R4b starts from is in [r4-handover.md](r4-handover.md), including the review of 2026-10-02; what the registry is missing is in [registry-requirements.md](registry-requirements.md).

## Your task

Do the parts of **R4b** from [roadmap.md](roadmap.md#r4b-registry-contract-consumer-side-of-the-external-generator) that don't need the external generator: code takes over the tool list and routing, then the contract (Zod schema, JSON Schema export, validation test, `registry:import`). The rest of R4b (knowledge fields, inventories, summaries in descriptions, retiring the in-repo generator) waits for the generator's first output.

Working agreements (standing, from the user):
- One commit per roadmap checkbox on `feat/v2-alpha`, a **pause for review after each group**, and a trailing `docs:` commit per group that updates this file.
- **Don't push without asking.** Don't regenerate or edit `registry.json`; that's the maintainer's.
- A contract change adds an entry to [../migration-2.0.md](../migration-2.0.md) in the same commit.

## Where things stand

- **Branch:** `feat/v2-alpha`, 5 commits ahead of origin (the review docs, the coverage floors, the README). R4 isn't released; the maintainer isn't ready to regenerate the registry yet, so R4b goes first.
- **Server:** 55 tools, listing 257.6K compact characters. 1713 tests, coverage 96.3 / 89.7 / 97.9 / 96.2, floors 94.5 / 88 / 96 / 94.5.
- **How tools come from the registry today:** `createTools()` makes one `get_<id>` tool per registry component and routes it by the registry's `strategy`, then `category`, then three ID sets (`INTERACTIVE_PARAMETERIZED_IDS`, `LAYOUT_MANIFEST_IDS`, `TYPOGRAPHY_MANIFEST_IDS`). Findings 7 and 11 describe the double routing and the name-parsing registry check.
- **Bugs this exposes:**
  - `get_index` exists because of `_index.scss`, a partial; it renders a placeholder.
  - `get_heading`, `get_label`, `get_preline`, `get_subline` and `get_title` return the generator diagnostic "No canonical story template extracted for …" as a warning on every call (the typography and layout builders append `component.warnings`).
  - `list_components_by_category` reports `strategy: "fallback"` for nine components whose tools have full schemas (the input tools and `tasklist`).
  - `get_component_docs` still calls the Kopfzeile tool a placeholder, because `registry.json` bakes in the overlay and hasn't been regenerated since R4.

## Plan

### A. Code owns the tool list (roadmap box 1)

**A1. The component-tool table.**
- `tool-builders/component-tools.ts`: `COMPONENT_TOOLS`, one entry per tool (43: today's 44 components minus `index`), mapping the component ID to its builder (`interactive`, `layout`, `typography`, or `fallback` for canonical HTML). The category (`foundational` for layout and typography, otherwise `interactive`) is derived from it.
- `createTools()` walks the registry in its sorted order and builds a tool only for components in the table. A registry component that isn't in the table has no tool; `get_component_docs` still documents it.
- The catalog checks that every table entry is in the registry and fails otherwise, replacing `validateRegistryAgainstToolNames` (finding 11). Tests can still build tools from partial registries.
- The registry's `category`, `strategy` and `warnings` stop being read (they become optional in `ComponentInfo`). `list_components_by_category` and `get_component_docs`' related tools take the category and strategy from the table. Generator diagnostics no longer reach tool output.
- Removed: the ID sets, `buildInteractiveTool`, `routeComponentTool`'s fallback branches, and the layout and typography builders' generic paths, which no table entry reaches (`buildLayout`, `buildTypography` and their schemas). This is finding 7.
- Effect: `get_index` goes (55 → 54 tools); the five typography tools stop warning; nine components report `strategy: "interactive"`. Migration notes entry.

**A2. Notes about our tools move to code.**
- The three overlay entries (Kopfzeile, InputDate, Dropdown) describe our tools, not KERN. They move to `tool-notes.ts` in core, and `get_component_docs` serves `reviewedGuidance` from there instead of from the registry. The output shape doesn't change.
- `docs/guidance-overlay.json` keeps its schema but no entries, so the in-repo generator stops baking them in. The overlay workflow doc and the instructions that point agents at the overlay say where the notes live now.
- Effect: the Kopfzeile text is right without a regeneration, so the next release no longer needs one.

### B. The contract (roadmap boxes 2–5)

**B1.** `registry.schema.ts`: `RegistryManifestSchema` in Zod, with `RegistryManifest`, `ComponentInfo` and friends derived from it (`types.ts` keeps the non-registry types). Additive: today's file validates as is; the fields code no longer reads are optional.
**B2.** Export it as JSON Schema to `docs/registry.schema.json` (replacing the stale hand-written file), with a test that the checked-in export is current.
**B3.** A test validates the checked-in `registry.json` against the schema. No validation at startup.
**B4.** `npm run registry:import -- <path>`: validate, copy into `packages/core/src/ux/registry.json`, and print added, removed and changed components and the fields that changed.

Decisions for B (recommended in [registry-requirements.md](registry-requirements.md#7-contract-decisions); taken as recommended, see "Decisions for B" under Progress):
1. `manifestVersion` stays 1.x; the loader accepts major 1, and a breaking change bumps both repositories to 2.
2. Unknown keys are accepted when loading, and `registry:import` lists them.
3. The export uses JSON Schema 2020-12.

### C. Later (waits on the generator)

Roadmap boxes 6–9: the knowledge fields and inventories, consuming them, summaries in tool descriptions, retiring `tools/manifest/*`.

### Verification per commit

`npx biome ci .`, `npm run typecheck`, `npm run test:coverage`, and `npm run build && npm run test:e2e` where the tool list changes. Snapshot diffs are reviewed in their commit.

## Progress

- [x] A1 `61fa863`: `COMPONENT_TOOLS` decides which component tools exist; `get_index` gone; generator warnings out of tool output
- [x] A2 `88467a6`: the notes about our tools served from `tool-notes.ts`; the overlay has no entries
- [x] B1 `a49d540`: `RegistryManifestSchema` in `registry.schema.ts`, the registry types derived from it, the loader's major check
- [x] B2 `27da921`: `docs/registry.schema.json` exported by `npm run registry:schema`, kept current by a test
- [x] B3 `47ffb3f`: the checked-in `registry.json` validated against the schema and the export
- [x] B4 `e522b80`: `npm run registry:import -- <path> [--dry-run]`

Learned in A:
- **The release no longer needs a registry regeneration.** The only reason was the stale Kopfzeile text in `get_component_docs`, which now comes from code. The checked-in `registry.json` still carries the overlay and the routing fields; nothing reads them.
- **Tests can't invent component IDs any more.** Only table entries get tools, so tests for the canonical-HTML fallback use `search` and `details`. A partial registry still works: `createTools()` builds what it finds, and only the catalog insists on every entry.
- **Function coverage counts each lookup entry.** The layout and typography builders are now maps of small `build` functions, and four (`kopfzeile`, `link`, `preline`, `subline`) were never called through a handler. One table-driven test renders all 13 layout and typography tools from the checked-in registry in strict mode, which also pins the routing end to end.
- **`git stash` keeps untracked files,** so a coverage comparison against `HEAD` with a new module still present counts that module as untested.
- Listing: 55 → 54 tools, 257.6K → 256.1K compact characters; only `get_index` changed.
- Tests: 1713 → 1718. Coverage 96.7 / 90.1 / 98.0 / 96.7.

Decisions for B, taken as recommended (the maintainer said "continue" at the A pause): `manifestVersion` stays 1.x and the contract is additive; unknown keys are accepted and listed by `registry:import`; the export is JSON Schema 2020-12.

Learned in B:
- **Building the contract's Zod schemas costs about 10 ms** in a compiled bundle (an empty module costs about 1 ms). So `REGISTRY_CONTRACT_MAJOR` lives in `registry.ts`, the loader checks only the major, and the server bundles don't contain the schema module or the import code. Keep it that way: nothing on the runtime path should import `registry.schema.ts`.
- **Zod's JSON Schema export:**
  - `io: "input"` leaves out `additionalProperties: false` (output mode adds it), which keeps unknown keys allowed for the generator. Parsing still strips them, which is how `registry:import` finds them.
  - `reused: "ref"` names its `$defs` `__schema0`, `__schema1`…; naming them with `.meta({ id })` registers them in Zod's global registry, which can clash when Vitest re-evaluates the module per test file. The export stays inlined (20K characters).
  - `z.iso.datetime()` exports a long pattern without lookarounds, so RE2-based validators (Go) handle it.
- **The export is generated, so Biome ignores it,** like `registry.json`; otherwise each `registry:schema` run would fail `biome ci`.
- **Ajv stays** after the in-repo generator retires: a test validates with the exported JSON Schema, which proves it works for a generator, not just the Zod side.
- **Additive means new names.** The richer shapes in [registry-requirements.md](registry-requirements.md) (tokens with values, for example) have to arrive as new optional fields. Changing what `tokens` holds would be major 2.
- The checked-in `registry.json` fits the contract unchanged, including `index` and the fields nothing reads.
- Tests: 1718 → 1742. Coverage 96.9 / 90.5 / 97.9 / 96.9.

What's left of R4b waits on the generator's first output: the knowledge fields and inventories, consuming them, summaries in tool descriptions, and retiring `tools/manifest/*`.
