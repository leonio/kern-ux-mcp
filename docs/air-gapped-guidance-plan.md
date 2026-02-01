# Air-Gapped Guidance Plan (Historical)

Status: Historical design context. The baseline workflow is implemented; use [contributor-guide.md](contributor-guide.md) and [guidance-overlay-workflow.md](guidance-overlay-workflow.md) for current operations.

## Goal

Preserve the current strengths of `kern-ux-plain` ingestion for implementation facts, while introducing a higher-quality, reviewable knowledge layer for MCP guidance that can run in sovereign, air-gapped environments.

The runtime must stay deterministic, local, and trustworthy:

- no model calls at MCP runtime
- no dependency on live docs availability
- no hidden network fetches
- all runtime knowledge comes from checked-in artifacts

## Decision Summary

We will keep source-driven manifest generation for implementation facts.

We now have a separate, curated guidance layer generated with human-in-the-loop authoring assistance.

We do not automate triggering. A human runs the workflow when semantic changes in the library justify updating guidance.

## Current Implemented Baseline

The current repo already includes the core offline workflow:

- overlay contract in [guidance-overlay.schema.json](guidance-overlay.schema.json)
- reviewed payload in [guidance-overlay.json](guidance-overlay.json)
- standalone validation via `npm run validate-guidance-overlay`
- build-time merge in [tools/manifest/build-manifest.ts](tools/manifest/build-manifest.ts)
- merged runtime artifact in [src/ux/registry.json](src/ux/registry.json)
- runtime docs exposure through `get_component_docs`
- repo-local authoring support in [.github/prompts/draft-guidance-overlay-entry.prompt.md](.github/prompts/draft-guidance-overlay-entry.prompt.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md)

## Why This Split Exists

`kern-ux-plain` is still useful and should remain in the build pipeline for:

- component inventory
- story-derived canonical HTML
- token snapshots
- class/modifier/deprecation extraction
- other implementation-level facts that change with the library

It is not sufficient as the only source for MCP knowledge guidance because usage guidance, accessibility obligations, and stable semantics do not consistently live in extractable source comments or stories.

## Target Architecture

### 1. Implementation Manifest

Keep `tools/manifest/build-manifest.ts` as the build-time generator for implementation facts.

This layer should remain responsible for fields such as:

- component ids
- category
- strategy
- status
- story-backed `htmlCanonical`
- token snapshot
- source file references
- implementation warnings/deprecation hints

This artifact remains generated from `kern-ux-plain` and copied into the runtime as part of the existing build.

### 2. Guidance Overlay

Add a second checked-in artifact that contains reviewed language-facing guidance.

This layer should be the source of truth for:

- component purpose
- when to use
- when not to use
- accessibility obligations
- semantic invariants
- composition guidance
- migration notes
- confidence and evidence references

This guidance is authored with agent assistance, then reviewed and committed by humans.

### 3. Runtime Registry

At build time, merge the implementation manifest and the guidance overlay into the runtime registry consumed by the MCP server.

The MCP runtime continues to load local JSON only.

## Operating Model

### Human Trigger

There is no automatic trigger in this phase.

A human decides that guidance regeneration is needed, typically after one or more of the following:

- significant upstream component changes
- semantic changes visible in stories, SCSS, or docs snapshots
- additions or removals of component options
- accessibility or composition changes
- large refactors that alter how components should be described to MCP users

The operator then updates the overlay manually, optionally with help from the repo-local drafting prompt.

### Agent Role

The agent is a build-time authoring assistant, not a runtime dependency.

Its job is to synthesize and normalize source material into clean, evidence-backed guidance.

The agent must not silently overwrite trusted runtime knowledge without review.

### Review Requirement

Every regenerated guidance change is reviewed by a human before merge.

That review should focus on:

- correctness against source material
- prose quality and consistency
- accessibility obligations
- semantic stability
- evidence sufficiency

## Guidance Overlay Shape

The contract is now fixed as a checked-in JSON artifact keyed by component id and validated by [guidance-overlay.schema.json](guidance-overlay.schema.json).

Per component, the overlay stores:

- `status`
- `summary`
- `primaryUseCases`
- `antiUseCases`
- `requiredA11yPractices`
- `semanticInvariants`
- `compositionPatterns`
- `authoringNotes`
- `migrationNotes`

Each field is a structured statement with:

- localized text (`de` and `en`)
- a confidence level (`high`, `medium`, `low`)
- one or more evidence references

`evidence` references concrete inputs such as:

- upstream docs snapshots
- story files
- SCSS files
- local schemas
- local templates
- relevant tests

The chosen storage format is intentionally strict and diffable:

- one JSON overlay file for the repo
- entries keyed by manifest component id
- no runtime fetches or generation
- human review status stored per component entry

## Authoring Expectations

Any authoring assistance should generate trustworthy guidance rather than generic summaries.

It should:

- prefer checked-in local inputs over live sources
- distinguish implementation facts from usage guidance
- preserve stable semantics across wording changes
- surface uncertainty explicitly instead of inventing guidance
- attach evidence for non-trivial claims
- produce normalized, concise prose suitable for MCP consumption

It should not:

- call remote services at runtime
- emit unsupported claims without evidence
- infer policy or accessibility guarantees that are not grounded in source material
- replace human review

## Source Priority

When the overlay is updated, use sources in this order:

1. checked-in docs snapshots or curated docs exports
2. `kern-ux-plain` stories and source files
3. local schemas and templates in this repo
4. local tests and validation rules
5. git diff or commit history when evaluating semantic drift

If the live doc site is unavailable, the workflow must still function using checked-in inputs.

## Recommended Artifacts

The following artifact split is the intended direction:

- generated implementation manifest: existing `src/ux/registry.json` pipeline
- curated guidance overlay: checked-in `docs/guidance-overlay.json`
- merged runtime registry: output consumed by the MCP server

The storage-format decision is now JSON plus JSON Schema validation. The key requirement remains that it is diffable, reviewable, and mergeable offline.

## Suggested Manual Workflow

1. Human decides semantic regeneration is needed.
2. Human gathers local evidence, optionally starting from the repo-local drafting prompt.
3. Human or Copilot drafts updated guidance overlay content in [guidance-overlay.json](guidance-overlay.json).
4. Human reviews and edits as needed.
5. Run `npm run validate-guidance-overlay`.
6. Run `npm run generate-manifest`.
7. Run focused tests to validate registry shape and MCP docs behavior.

## Implementation Phases

### Phase 1 — Design the Overlay Contract

- define the overlay file format and schema
- define which fields remain source-generated versus curated
- define how evidence references are stored

Phase 1 output now exists as [guidance-overlay.schema.json](guidance-overlay.schema.json).

### Phase 2 — Add the Merge Path

- extend build logic to merge implementation manifest plus guidance overlay
- keep runtime loading local and unchanged in spirit
- add validation for missing or malformed overlay content

Phase 2 output now exists in [tools/manifest/build-manifest.ts](../tools/manifest/build-manifest.ts), which validates [guidance-overlay.json](guidance-overlay.json) against [guidance-overlay.schema.json](guidance-overlay.schema.json) and merges the reviewed guidance into [src/ux/registry.json](../src/ux/registry.json) under a dedicated `reviewedGuidance` field.

### Phase 3 — Add Lightweight Authoring Support

- provide a manual operator prompt for drafting one entry
- provide repo-local instructions for evidence and review rules
- keep heavier agent or skill work optional until the prompt loop proves insufficient

Phase 3 is implemented in the lightweight form: `get_component_docs` surfaces reviewed guidance separately from the raw extracted excerpt and sections, and the repo now includes both [.github/prompts/draft-guidance-overlay-entry.prompt.md](.github/prompts/draft-guidance-overlay-entry.prompt.md) and [.github/copilot-instructions.md](.github/copilot-instructions.md).

### Phase 4 — Seed Initial Guidance

- start with high-value components first
- review and commit the overlay in small batches
- verify `get_component_docs` quality against the approved guidance

Phase 4 is started with seed entries for `kopfzeile`, `inputdate`, and `dropdown` in `docs/guidance-overlay.json`.

## Non-Goals

Not in scope for this plan:

- runtime model calls
- fully automated trigger detection
- live-doc scraping as a runtime dependency
- unreviewed AI-authored knowledge entering production artifacts

## Open Questions For Later Execution

- whether docs snapshots should live in-repo and in what format
- how strict the evidence requirement should be for every field over time
- whether confidence should be surfaced in MCP responses or remain build-time metadata
- whether a dedicated skill is worth adding once more components have reviewed overlay entries

## Success Criteria

The plan is successful when:

- the MCP runtime remains fully offline and deterministic
- source-driven implementation facts continue to update with library changes
- guidance quality is materially better than raw-source extraction alone
- guidance regeneration is cheap enough to run manually when needed
- all approved knowledge is reviewable and committed in the repo