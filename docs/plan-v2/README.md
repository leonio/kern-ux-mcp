# Plan v2: the road to 2.0

This folder holds the plan for 2.0 and the record of how it's going. The work happens on the `feat/v2-alpha` branch, one roadmap step at a time, with a pause for review after each group of commits. There is no big-bang rewrite.

## What's here

| File | What it is |
|---|---|
| [roadmap.md](roadmap.md) | **Start here.** The status tracker (steps R0–R7, plus R4b and R5.1), the decisions, the target architecture and the details of each step. |
| [findings.md](findings.md) | The discovery write-ups (items 1–22) with file references. Roadmap steps point at them. |
| [r5-handover.md](r5-handover.md) | **The latest state.** R5 half done, what to do first, and the findings for the English areas. |
| [r5-kickoff.md](r5-kickoff.md), [r5-eval/](r5-eval/) | R5's plan, progress and lessons; the eval reports. |
| [r4b-kickoff.md](r4b-kickoff.md), [r4-handover.md](r4-handover.md) | R4b (groups A and B done; the rest waits on the knowledge bundle); where R4 ended and the 2026-10-02 review. |
| [post-alpha-work.md](post-alpha-work.md) | Unscheduled follow-ups: the context-budget research (tool discovery and sub-agent scoping, with verdicts) and a proposal for nested eval scenarios. |
| [knowledge-bundle.md](knowledge-bundle.md) | Draft: what the external generator (`kern-ux-scraper`) writes from its three sources, and how this repo builds tooling from it. Includes a brief for the generator repo. |
| [registry-requirements.md](registry-requirements.md) | What the server needs from `registry.json` today, and what's wrong with it. Partly superseded by the knowledge bundle. |
| [r3-kickoff.md](r3-kickoff.md), [r3-handover.md](r3-handover.md), [r4-kickoff.md](r4-kickoff.md) | Earlier steps: their plans, progress and lessons. |
| [../migration-2.0.md](../migration-2.0.md) | What changes for clients between 1.x and 2.0. Every contract change adds an entry. |

The current code layout is in [../codebase-guide.md](../codebase-guide.md).

## Ground rules

- Tool names stay stable. Input schemas and output shapes change only where [roadmap.md](roadmap.md#decisions) says so ("Contract"), each change in its own commit with the listing-snapshot diff reviewed and an entry in [../migration-2.0.md](../migration-2.0.md).
- One commit per roadmap checkbox, a pause for review after each group, and a trailing `docs:` commit that records progress in the step's kickoff file. Don't push without asking.
- English is the base language for model-facing text; German stays where it adds value (see the decisions table).
- The `tools.*.test.ts` files, the listing snapshots and the e2e suites are the safety net. Add characterisation tests first where they're missing.

## Findings tracker

Which roadmap step picks up each finding. The P0–P4 phases from before the roadmap are folded into it: P0 (TypeScript 7, Vitest 5, test hardening) is done, and P4 (the `McpServer` spike) was superseded by R0 and R2.

- [ ] 1. The entry-point and wiring overview. Context only.
- [ ] 2. Per-tool `normalize` and `errorHint` on the tool definition. → `defineTool()` migration
- [x] 3. Extract `invokeTool()` and `logging.ts`. → R1
- [x] 4. A single `ValidationResultSchema` and output schema. → R1
- [ ] 5. A generic `buildHtmlTool()` for section, card group, disclosure and composition. → `defineTool()` migration
- [ ] 6. A declarative interactive tool map instead of the set, the switch and the 26 small builders. → `defineTool()` migration
- [ ] 7. Remove the double routing in `createTools`. → R4b (code owns the tool list)
- [ ] 8. A `defineTool<I, O>()` helper; R5 lands its `examples` table first. → `defineTool()` migration
- [x] 9. `createCompositionRenderer(locale)`. → R4
- [x] 10. Read the server version from `package.json`. → R1
- [ ] 11. Check the registry against component IDs instead of parsing tool names. → R4b (code owns the tool list)
- [x] 12. Remove dead code; deduplicate `stories.ts` and `paths.ts`. → R1
- [x] 13. Type-check `tools/**` and `vitest.config.ts`. → R1
- [x] 14. `verbatimModuleSyntax` and an ES2024 target. → R3
- [x] 15. Spike `McpServer.registerTool`. → superseded by R0 and R2
- [x] 16. A single `formFlow` schema. → R1
- [ ] 17. SDK v2 migration facts. → R0 (the client matrix is still open, now a check before GA)
- [x] 18. Composition gaps and bugs. → R4
- [ ] 19. The context budget of `tools/list`. → R5
- [x] 20. GitVersion branch entry and typo. → R1
- [x] 21. Leaks and packaging: `sourceRoot`, `fast-glob`, unbounded `validate_html` input. → R1
- [ ] 22. The registry moves to an external generator; this repo owns the contract. → R4b
