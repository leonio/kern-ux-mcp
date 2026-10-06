# How 2.0 was built

The record of the 2.0 work on `feat/v2-alpha`, from the discovery on 2026-09-27 to the release candidate on 2026-10-06. It keeps what each step did, the decisions that shaped it, the measurements and what was learned. The forward-looking parts (what's open, how to run the next update) are in the [README](README.md).

This file condenses the roadmap, the discovery findings and the kickoff and handover file of each step. They're in git history: `git show e0ee9bb:docs/plan-v2/<file>` (`roadmap.md`, `findings.md`, `r3-kickoff.md` … `r7-handover.md`, `post-alpha-work.md`, `knowledge-bundle-review.md`, `registry-requirements.md`).

## The arc in numbers

| | Start (1.1.2) | After R4 | After R5 | 2.0.0 |
|---|---|---|---|---|
| Tools | 52 | 55 | 54 | 54 |
| Model-facing listing (compact characters) | about 142K, the whole listing | 199.7K | 115.6K | 119.4K (budget 120K) |
| First request in the eval (tokens) | | 70,676 (baseline) | 36,654 | 37,484 (`r7-c`) |
| Resources, prompts | none | none | none | 48 cards and 3 guides, 3 prompts |
| Tests | 475 (at R3) | 1,713 | 1,824 | 2,274 |

"Model-facing" is the name, description and `inputSchema` of every tool in compact JSON. `outputSchema` (about 48K) is reported, not counted. The listing grew in R2b (`outputSchema`) and R4 (the new block kinds), and R5 brought it down.

## The decisions that shaped 2.0

| Topic | Decision |
|---|---|
| Protocol | MCP `2026-07-28` on TypeScript SDK v2, still serving `2024-11-05` through `2025-11-25` clients from the same process. |
| Packaging | npm workspaces: a private `@leonio/kern-ux-core`, never published, inlined into `@leonio/kern-ux-mcp` (stdio and `.mcpb`) and `@leonio/kern-ux-mcp-http` (npm and a GHCR image). Lockstep versions, Node 24 or later. |
| Contract | Tool names stay stable. Accepted changes: `isError` results for bad input, `outputSchema` and `structuredContent`, `title` and `annotations`, and schema changes that follow MCP standards or cut the listing. Every one is in [migration-2.0.md](../migration-2.0.md). |
| Language | English for everything a model reads. German stays in UI labels (`locale` defaults to `de`), KERN's German names and the `de` validation messages. |
| Knowledge | KERN knowledge comes only from the knowledge bundle, which the packer (`kern-ux-knowledge-packer`) builds and this repo imports as static JSON. Facts about our own tools come from code. Design: [knowledge-bundle.md](knowledge-bundle.md). |
| Clients | VS Code Copilot and Claude (Code, Desktop), plus the MCP Inspector. OpenAI clients dropped out on 2026-10-02. |
| Branch | `feat/v2-alpha`, publishing pre-releases under the npm dist-tag `alpha`. Contract changes are described in commit bodies, never with `!` or `BREAKING CHANGE:`, which GitVersion would read as another major. |

## Discovery (2026-09-27)

The TS 7 upgrade came with a read through `src/` that produced 22 findings, each written as **Where**, **Problem**, **Proposal** and **Risk**, with file references. Most were small refactors (one call pipeline, one validation schema, one `formFlow` schema, the version from `package.json`); the larger ones became roadmap steps: the SDK v2 facts (R0), the composition gaps (R4), the listing size (R5) and the registry moving to an external generator (R4b). The roadmap then cut the work into steps that could each be released.

The open refactors from that list are the `defineTool()` migration in the [README](README.md#planned).

## R0: SDK v2 spike

**Goal:** prove that SDK v2 can serve the 52 existing tools unchanged before committing to it.

- A throwaway harness registered every `ToolDef` on `McpServer` through a Standard Schema adapter, `kernInputSchema()`. The listing deep-equalled the 1.x snapshot on every transport and protocol era. The harness is in git: `git checkout 31110cf -- spike/r0`.
- It recorded the exact `isError` texts and found what R2 had to set: `listChanged: false` (the default is `true`), our own error header dropped (the SDK adds one), cache hints (2026 defaults to `ttlMs: 0`), and a JSON round trip before snapshotting in-memory results.
- **SDK clients boot a stdio server twice** on 2026-07-28 (`server/discover` on a throwaway process first), so module-scope work stays small.
- Request bodies are capped at 4 MiB; `validate_html` takes up to 500,000 characters.
- **Left open:** the client matrix, which became the release's client check.

## R1 and R2: prerequisites and the SDK swap

- **R1** made the swap mechanical without changing the contract: `invokeTool()` and `logging.ts` out of `server.ts`, one `ValidationResultSchema`, one `formFlow` schema, `tsconfig.tools.json` in CI, dead code removed, and a GitVersion entry for `feat/v2-alpha` (`mode: ContinuousDelivery`, label `alpha`, since the global mode drops the label).
- **R2** moved to `McpServer` through the adapter. Invalid input and strict failures became `isError` results with the same hints; an unknown tool gets JSON-RPC `-32602`. A wire-level listing snapshot is compared with the domain snapshot. SDK v1 went.
- **R2b** added titles, annotations, `outputSchema` with `structuredContent`, and an hour's `public` cache hint on the lists.

## R3: workspaces and hosts

**Goal:** core plus three thin hosts, built, tested and released. Released as **`2.0.0-alpha.69`** on 2026-09-29, the only release during 2.0.

- `src/` moved to `packages/core` as is. Core has no build: it exports its TypeScript under the `@leonio/source` condition, which tsc, Vitest, esbuild and tsx all read. (`source` was taken: `eventsource-parser` ships raw `.ts` under it.)
- **esbuild bundles:** `dist/` for npm (core inlined, third-party packages external, an undeclared import fails the build) and `standalone/` for the `.mcpb` and the container (everything inlined, with `THIRD_PARTY_LICENSES.txt`).
- **`packages/http`:** Host and Origin guards, `/healthz` and `/readyz`, optional bearer token, rate limit and CORS, a SIGTERM drain. A distroless Node 24 image pinned by digest, built for amd64 and arm64 without emulation.
- **CI and release:** e2e on Linux and Windows, a packed-install smoke test, the `.mcpb` and the image built on every push. `release.yml` publishes only the two hosts, to npm (staged, approved with 2FA), GitHub Packages and GHCR, with SBOMs and attestations, and skips whatever already exists so a re-run finishes a partial release.
- **Learned:**
  - Three alphas (66 to 68) stopped partway, each in a step a dry run skips: the npm bootstrap, staged-only publishing, an SBOM without `serialNumber`.
  - `gh release create` without `--target` tags the default branch, which would have mis-tagged every pre-release.
  - `npm sbom -w` drops dependencies and describes the workspace root, so `tools/build/sbom.ts` runs CycloneDX's own tool. The `mcpb` and CycloneDX CLIs run pinned through `npm exec`, outside the lockfile and outside Renovate.
  - The SDK's Host and Origin guards compare hostnames only, ports ignored.

## R4: composition gaps

**Goal:** make forms and pages composable in one call, which the prompts would need.

- **One renderer** (`createCompositionRenderer`) for every container. Before, what rendered depended on where a block sat, with silent "skipped" warnings. Depth means the same in schema and renderer. A nesting matrix test renders every container with every child kind.
- **New block kinds:** `field` (one flat schema dispatching to the input templates, not the 11 input schemas, to save listing room), `fieldset` and `form`, whose error summary is collected from the fields' errors rather than written by the model.
- **`formFlow` fixed:** KERN's button class, a real `<form>`, its own step-list heading, `renderAllSteps` for a script to switch steps.
- **Schema rules** for what doesn't make sense: no form in a form, no card directly in a card, sections and disclosures need content. The walk reports the exact path.
- **`render_page`:** skip link, the real Kopfzeile, header, `<main>`, footer, and `document: true` for a whole HTML page with KERN's CSS from jsDelivr, pinned to the registry's KERN version.
- **Learned:**
  - The input templates interpolated text unescaped; R4 fixed the form templates and R5.1 swept the rest.
  - A headless browser screenshot found three layout problems no test could: fields without spacing, nested `kern-container`s, header padding. KERN has no `[hidden]` rule, so a flex class on a hidden step shows it.
  - The listing grew from 198K to 258K: every block tool repeated the whole union.

## R4b: the registry contract

**Goal:** stop the registry from deciding which tools exist, and define what this repo needs from it.

- **Code owns the tool list.** `COMPONENT_TOOLS` maps component to builder; a registry component without an entry is documentation only. `get_index` (an SCSS partial) went, and generator diagnostics stopped reaching tool output.
- **Notes about our tools moved to code** (`tool-notes.ts`): the registry describes KERN, never our implementation.
- A Zod contract with a JSON Schema export and `registry:import` followed, and R6 retired both: the bundle replaced the generator they were written for.
- **Learned:** building the contract's Zod schemas costs about 10 ms at startup, so nothing on the runtime path imports them; the server runs the registry CI checked.

## R5: English and the context budget

**Goal:** English for every model-facing text, and the listing under 120K characters, measured on a model rather than guessed.

- **The scripted eval came first** (`tools/eval`): headless Claude Code with Haiku 4.5, our stdio server as its only MCP server, ten scenarios, three runs each, about $1 a suite. The baseline (`52b24fa`) recorded 30/30 completed, 95/96 checks and a 70,676-token first request. Later steps added the `nested` suite (four deep layouts, scored on structure, strict validity and how the answer delivers the HTML), the `resources` suite and the `prompts` suite.
- **A budget test** (`tools.budget.test.ts`) that ratchets down with each saving and holds at the 120K target, and `npm run listing:sizes`.
- **Option B:** the six standalone block tools take only `text`, `html`, `badge` and `field` blocks; deep nesting goes through `render_composition` and `render_page`. The eval showed those six had 5 calls in 30 runs. It saved 58K characters and cut the first request by 29%. Emitting shared schemas as `$defs` made the listing larger instead: the duplication was across tools, and one tool can't reference another's schema.
- **`TOOL_EXAMPLES`:** one known-good payload per tool, golden-tested with `strict: true`, which the error hints and later the cards render from.
- **English in four areas.** Most of the saving was duplication, not translation: every component tool's schema repeated its description at more length.
- The compact profile (`KERN_TOOLSET=compact`) was dropped: the full set fit, and 54 tools are far under VS Code's 128.
- **Fixes the evals found:** both option shapes accepted on select fields, the accordion's group mode inferred from `items`, "did you mean" icon names, the five KERN 2.8 button sizes (wrong since KERN 2.8.0 without anyone noticing).
- **Learned:**
  - Shorter isn't always safe: cutting the alert's `body` description to a phrase made one run send it as a sentence 13 times. Name an object's keys.
  - Read the assembled text in the snapshot diff, not the source fragments.
  - Read transcripts before trusting a new measurement: the harness had two scoring bugs, both found that way.
  - What was evaluated is in [evals/](evals/): `baseline`, `option-b`, `english-1` to `-4`, `nested-baseline`, `nested-english-3` and `-4`.

## R5.1: output polish

The R4 leftovers that change tool output, held back so R5's comparisons stayed clean: no warning on every grid, no default "enter your full name" hint, spacing between top-level blocks, a fieldset's group error in the error summary, escaping in every template, and `kern-label kern-sr-only` on hidden button labels as KERN writes it.

- **Learned:**
  - Check that a warning can fire: the plan relied on one the schema's default made unreachable.
  - Sweep, don't list: the findings named nine unescaped templates, a grep found twelve, and one test now feeds the same markup to every text field.
  - Check KERN before "fixing" towards it: the button and the dialog hide labels differently in KERN itself, and counting KERN's own uses settled it.

## R6: the knowledge bundle, layout and resources

**Goal:** KERN knowledge from the bundle, layout on KERN's CSS Grid, and resources where something uses them.

- **The bundle** ([knowledge-bundle.md](knowledge-bundle.md)) is the packer's: one English JSON document per component from `kern-ux-plain`, the kern-ux.de docs source and the React kit. The dependency is one-way: the packer knows nothing about this repo. `npm run knowledge:import` checks a bundle against the packer's schema and our own checks, copies it into `knowledge/` (checked in, so upstream changes arrive as diffs) and generates `registry.json` from it with the code-owned ID map. The in-repo generator and the guidance overlay went.
- **On the tool path,** since a resource reaches a model only when someone brings it in: `get_component_docs` from the bundle, one-line hints in the 18 descriptions where they change a choice (written by the `tool-hints` skill, with their source's hash so an import flags stale ones), `list_icons` from the bundle, and a warning for unknown `kern-*` classes.
- **Layout on `kern-grid`:** KERN deprecated its container grid, and 2.0 was the release where markup could change. Every grid is `kern-grid kern-grid-cols-1 kern-grid-cols-{n}-md kern-gap-lg` in a `div` of its own.
- **Resources:** 48 component cards (`kern://components/{id}`, from the bundle plus our tool, field digest, examples and rules) and three guides (forms, layout, accessibility), with completion and an hour's public cache hint. `validate_html`'s rules moved into one table that the guide and the cards read. Index, token, icon, utility and page-shell resources were dropped: each duplicated a tool.
- **After R6:** `required: true` renders `aria-required`, and docs-only components (Notification Banner, Tabs, Nav) name the closest tool instead of leaving the model to invent classes.
- **Learned:**
  - **Check against the published CSS** (`npm pack @kern-ux/native`), not the sample's older copy. 2.8.2's `kern-grid` sets no gap and has 12 columns until a `cols` class applies, both against its own docs, and `.kern-container:has(> .kern-grid)` drops the container's padding, hence the `div`.
  - **A warning alone didn't stop Haiku** from hand-writing a grid straight into `<main>`; the renderer now wraps it.
  - **Resources aren't read on their own.** With Claude Code's resource tools, Haiku never listed resources or read a guide; it read a card only through `get_component_docs`'s `resource_link`. Guidance that matters has to be on the tool path.
  - Generated IDs made a card's bytes differ between processes; cards render inside `withStableIds`.

## R7: prompts

**Goal:** three workflows a user starts from the client: `create_input_form` (a wizard when given `steps`), `create_page_layout` and `review_kern_html`.

- Each prompt returns its guide embedded, links to the cards it uses, and the workflow last, ending with "answer with the final HTML verbatim". With the prompts, 12 of 12 answers were verbatim, against 3 of 12 without: that settled the long-standing problem of models describing long pages instead of pasting them.
- The prompts render with `strict: true` (the render tools' argument) and call `validate_html` only on changed or given HTML.
- The eval sends the rendered prompt text rather than a slash command, and compares each task with and without its prompt on the same commit.
- **Three `validate_html` rules** went into 2.0, since adding error rules later would fail HTML that passes today: a field without a label and a table without header cells (errors), a skipped heading level (a warning). The label rule caught our own `get_inputgroup`.
- `names.test.ts` checks that every tool name and `kern://` URI in descriptions, guides, cards and prompts exists.
- **A `summary` block kind**, so the wizard's review step doesn't paste `get_summary` HTML. That HTML had made inputs large and escape-heavy, and came with an empty fourth step in half the runs.
- **The full eval** (`r7-c`, `nested-r7-c`, `prompts-r7-c` and `-plain` on `214203d`, then `prompts-r7-c-fix`, `prompts-r7-summary`, `prompts-r7-checkbox`): base 96/96, nested 104/105, prompts 96/96, and the wizard in one call with no error, checkbox after the summary.
- **Learned, on writing for models:**
  - **Naming a mistake invites it.** "Never add a step for the submit button alone" made every run add one. "Exactly the steps given" worked.
  - **Quote the shape.** "One `section` block with a `headingText`" produced flat blocks in 3 of 3 runs; quoting `{ kind: "section", section: { headingText, contentBlocks } }` fixed it.
  - **Ask for a thing once.** A fix list asked for in a step and again in the answer was written before the work, as a plan.
  - **Say what comes after, not only what comes first.** "Start the review step with a summary" left the confirmation checkbox in the step before in two runs of three.
  - **Wording isn't always the lever.** Two rewordings didn't stop the empty fourth step; a block kind did.

## The release

- **Done (2026-10-06):** a scratch merge into `main` computed `2.0.0` with GitVersion, so the version config needs nothing.
- **To do:**
  - **The client check:** VS Code Copilot, Claude Code and Claude Desktop, over stdio and HTTP, on both protocol versions, with tools, resources and prompts; the `.mcpb` on Desktop with Node 24. It also confirms the README's prompt commands (`/mcp.kern-ux.create_input_form` in VS Code, `/mcp__kern-ux__create_input_form` in Claude Code).
  - **The docs:** the migration notes' "next alpha" sections become 2.0.0; the merge PR's description is the release notes, since GitHub generates them from PRs.
  - **The wiki** publishes from `main` and already describes 2.0.0: untagged packages and the `latest` image (2026-10-06). Run the release right after the merge, or the untagged commands install 1.1.2 until it's out. Its screenshots are still grey placeholders (listed on its Development page).
  - **Merge** `feat/v2-alpha` into `main` and run the release.
