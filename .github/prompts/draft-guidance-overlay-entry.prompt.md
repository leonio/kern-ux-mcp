# Draft Guidance Overlay Entry

Draft or revise exactly one component entry in `docs/guidance-overlay.json` for this repo.

## Goal

Produce reviewed guidance that augments the generated manifest without replacing extracted source guidance.

The current workflow is intentionally lightweight:

- repo rules live in `.github/copilot-instructions.md`
- reviewed guidance source lives in `docs/guidance-overlay.json`
- extracted `guidance` and `guidanceSections` stay source-derived
- curated guidance is merged separately as `reviewedGuidance`

## Required Inputs

Before drafting, inspect the checked-in local sources for the target component in this order:

1. docs snapshots or curated docs exports if present
2. `kern-ux-plain` story files and related source files
3. local schema in `src/ux/schemas/`
4. local template in `src/ux/templates/`
5. local tests and validation rules
6. current audit notes in `docs/contributor-guide.md`

## Non-Negotiable Rules

- Update only `docs/guidance-overlay.json` unless explicitly asked to do more.
- Do not edit `src/ux/registry.json` directly.
- Do not replace extracted `guidance` or `guidanceSections`; the overlay is additive.
- Keep the reviewed overlay focused on stable, evidence-backed guidance rather than generic summaries.
- Every statement must include evidence.
- Prefer small, specific statements over broad summaries.
- Surface uncertainty explicitly instead of inventing guidance.
- Keep the current MCP implementation boundary visible when upstream KERN behavior is richer than this repo.

## Entry Shape Requirements

The component entry must satisfy `docs/guidance-overlay.schema.json` and include:

- `status`
- `summary`
- `primaryUseCases`
- `antiUseCases`
- `requiredA11yPractices`
- `semanticInvariants`
- `compositionPatterns`
- `authoringNotes`
- `migrationNotes`

Each statement must contain:

- localized `text.de` and `text.en`
- `confidence`
- at least one evidence reference

## Drafting Heuristics

- `summary`: explain the component's current MCP contract, especially if it is a simplification.
- `primaryUseCases`: when the current repo implementation is appropriate.
- `antiUseCases`: when the current implementation should not be treated as full parity with upstream.
- `requiredA11yPractices`: obligations that remain true even in simplified output.
- `semanticInvariants`: facts that should remain stable across wording changes.
- `compositionPatterns`: only include if there is clear evidence in local code or stories.
- `authoringNotes`: practical advice for future guidance authors or MCP users.
- `migrationNotes`: how this entry should evolve if the repo implementation grows later.

## Output Standard

Prefer one small reviewed batch at a time.

The expected runtime result is that `get_component_docs` continues to return extracted guidance separately from `reviewedGuidance`.

After editing, run:

```bash
npm run validate-guidance-overlay
npm run generate-manifest
npm test -- src/ux/manifest-generator.test.ts src/ux/tools.test.ts
```

Then summarize:

1. what changed in the overlay entry
2. which evidence sources were used
3. any uncertainty that still needs human review