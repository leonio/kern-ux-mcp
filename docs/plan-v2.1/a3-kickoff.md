# A3: the skills replace the prompts and the guides

Status: kickoff written on 2026-11-22, and rewritten the same day after the maintainer's decision to remove the prompts and the guides in 2.1. Step A3 of the [2.1 roadmap](roadmap.md#5-steps), after [A2](a2-kickoff.md).

## The task

Make the skills the only workflows:

- **The prompts go:** `create_input_form`, `create_page_layout`, `review_kern_html` and `create_figma_design`. The server no longer declares the prompts capability.
- **The guides go:** `kern://guides/{name}`. The same text is each skill's reference, at `skill://kern-forms/references/forms.md` and so on.
- **What stays:** the tools, the 48 component cards at `kern://components/{id}` (the reference data a model discovers through `get_component_docs`), the skills over MCP, and the server's instructions.

Released as 2.1. Removing a prompt or a resource breaks semver, but 2.1 has no known users who depend on them; the release notes say what went and what replaces it.

## Why

- **Decided by the maintainer on 2026-11-22:** skills over MCP are where MCP is going, and reference files a model reads when it needs them are the token-cheap way to progressive discovery. Prompts the user has to start by name, and guides nobody reads on their own ([S5](roadmap.md#s5-resources-arent-read-on-their-own-skills-do-that-job)), don't fit that.
- **What A2 measured:** with the skills installed as files, the instructions got the right skill loaded in 12 of 12 runs, with every answer verbatim, as with the prompts.
- **What it costs:** a client that has neither MCP skills nor the skill files gets the instructions and the tools, which A2 measured at 5 of 12 verbatim answers. A4 makes installing the files the documented path, and both target clients are bringing MCP skills ([S3](roadmap.md#s3-our-target-clients-dont-load-mcp-skills-yet)).

## What we start from

- **The prompts:** [packages/core/src/prompts](../../packages/core/src/prompts), built in [catalog.ts](../../packages/core/src/mcp/catalog.ts) and registered in [create-server.ts](../../packages/core/src/mcp/create-server.ts), with `prompts: { listChanged: false }` and a cache hint for `prompts/list`. Tested in `prompts/prompts.test.ts` with eight snapshots and in `mcp/prompts.test.ts`; `names.test.ts` checks their text. The e2e tests don't use them.
- **The guides:** [guides.ts](../../packages/core/src/resources/guides.ts) builds each one on first read, quoting the registry's foundations pages and running a tool for the example. `pnpm skills:build` writes the skills' references from the same builder, through the catalog's guides resource. Tested in `guides.test.ts` and `resources.test.ts`.
- **The eval:** the `prompts` suite renders each scenario's MCP prompt (`promptName` in [scenarios.ts](../../tools/eval/scenarios.ts), [prompt-text.ts](../../tools/eval/prompt-text.ts)); `--without-prompts` sends the task's own words instead. The `skills` suite sends those same words with the skills installed as files.
- **The `create_figma_design` workflow** has no skill yet. F6 writes `kern-figma-design` from the prompt's text, which stays in git at this kickoff's commit.
- **Where they're named:** the [README](../../README.md#resources) (Resources and Prompts), [How-It-Works](../wiki/How-It-Works.md), [codebase-guide.md](../codebase-guide.md), [figma-and-theming.md](../figma-and-theming.md) (section 5 and the F2 row), and the roadmap. [migration-2.0.md](../migration-2.0.md) and the 2.0 history stay as they are.

## The design

### The server

- **`catalog.ts`** builds the tools and the component cards. No prompts, no guides.
- **`create-server.ts`** registers no prompts and declares no prompts capability. `prompts/list` leaves the cache hints.
- **Removed:** `packages/core/src/prompts/` whole, with its snapshots, and `mcp/prompts.test.ts`.
- **`names.test.ts`** checks the tool descriptions, the cards, the skills and the instructions. Its snapshot drops the prompts' entries.
- **The snapshots** of the capabilities, `server/discover` and the resource listings change; the review reads that diff.

### The guide builder

- **`GUIDES` and `buildGuide`** move to `packages/core/src/skills/guide-builder.ts`, which `generated.ts` calls directly. Only `pnpm skills:build` and the tests run it, so the server builds nothing on first read and the bundles drop the builder. The record has the bundle size before and after.
- **`guides.test.ts`** becomes `guide-builder.test.ts`: the budget, strict-valid HTML in the examples, the quoted sections that exist, the same text every time. The folder test still fails when a reference is stale.
- **The name "guide"** stays in the builder, since it builds a skill's reference from our code and KERN's text. Only the resource goes.

### The eval

- **One suite for the workflows:** `skills`, with `--without-skills` for a client that has only the server, which is what `--without-prompts` measured.
- **Removed:** the `prompts` suite, `promptName`, `prompt-text.ts` and its test, and `--without-prompts`. The old reports stay in `evals/` for the record.
- **`compare.ts`** reads the old reports as before.

### The docs

- **README:**
  - Resources lists only the component cards.
  - A short Skills section replaces Prompts: the three skills, what each is for, and that the server serves them over MCP. A4 adds how to install them as files.
- **How-It-Works, codebase-guide.md:** the same.
- **figma-and-theming.md:** `kern-figma-design` (F6) carries the Figma workflow, where it said the prompt does.
- **The roadmap:** decisions 2 and 3 as changed, with the date; sections 1, 3.2, 4 and 5 to match.
- **The release notes for 2.1** are step R. This record keeps the list for it.

### The measurement

What a model sees doesn't change: the tools, the instructions and the skill files are the same. So there's no question for the eval, only the harness to check after its change:

- **`skills` and `skills --without-skills`** on group 1's last commit, three runs a scenario, about $1.60, against `a2-instructions` and `a2-without-prompts`.
- **The bar:** the same results within noise: 12 of 12 with the skills, around 5 or 6 of 12 without.

## Decisions

The maintainer's on 2026-11-22: remove the prompts and the guides in 2.1, no deprecation, and keep the component cards. What's left to confirm:

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| A3.1 | The guide builder | build time only, in `skills/guide-builder.ts` | keep it in the server's code, unused at runtime |
| A3.2 | The eval's suites | `skills` and `--without-skills`; the `prompts` suite and its code go | keep the `prompts` suite's code for the old reports |
| A3.3 | The measurement | the two runs above, to check the harness, about $1.60 | none, since what the model sees doesn't change |
| A3.4 | The README | a short Skills section now; installing them is A4's | nothing about skills until A4 |

## The plan

### Group 1: remove

- [x] `refactor: the guide builder runs only for the skills` (`59a5dd8`): `guide-builder.ts`, `generated.ts` calls it, its test.
- [x] `test(eval): one suite for the workflows` (`a636569`): `--without-skills`, the `prompts` suite's code removed.
- [x] `feat: the skills replace the prompts and the guides` (`22b2833`): the catalog, `create-server.ts`, the removed files and tests, `names.test.ts` and the snapshots. Not `feat!:`: [GitVersion.yml](../../GitVersion.yml) bumps the major on a `!`, and this ships as 2.1.
- [x] `docs: the skills replace the prompts and the guides` (`ac64160`): README, How-It-Works, codebase-guide.md, figma-and-theming.md, the roadmap.
- [x] Typecheck, lint, `pnpm test` (2,360 tests in 93 files), the build, e2e (22 tests) and `pack:mcpb`; then push for CI.

Then pause for review.

Group 1 was done on 2026-11-22:
- **Changed from the plan:**
  - the eval commit comes before the removal, so each commit passes its tests: the prompts suite's test needed the prompts;
  - `resources.test.ts` now checks that `kern://guides/forms` fails with -32602, and reads the forms guide at its skill URI.
- **The bundles,** before (`f92bbf4`) and after:

  | Bundle | Before | After |
  |---|---|---|
  | stdio `dist/index.js` | 742,749 | 712,683 |
  | stdio `standalone/index.js` | 2,395,627 | 2,365,648 |
  | http `dist/index.js` | 752,749 | 722,680 |
  | http `standalone/index.js` | 2,487,936 | 2,457,954 |

  About 30 KB less in each, as A2 estimated. The builder isn't in them.
- **The `names-in-text` snapshot** loses what only the prompts named: the cards they linked, the guide URIs, and the Figma tools only `create_figma_design` mentioned.
- **The tool listing** is unchanged: 119,401 of 120,000.
- **Added after review:** the registry carried KERN's foundations pages (`GUIDE_FOUNDATIONS`) only for the guide builder, so the server bundled text it no longer read. The maintainer chose to trim it: nothing on the roadmap needs those pages at runtime, and `knowledge/` keeps all 24 in the repo.
  - [x] `refactor: the guide builder reads the foundations from knowledge/`: `readGuideFoundations()`, `projectFoundation` exported, `foundations` out of the registry, its schema and `Registry`; the contract to 2.2.0; `registry.json` regenerated. The three references came out byte for byte the same, and the import still fails when the bundle lacks a page the guides quote.
  - The bundles lost another 45 KB: stdio `dist/index.js` 667,811, `standalone/index.js` 2,320,776; http `dist/index.js` 677,808, `standalone/index.js` 2,413,082. Against `f92bbf4`, 75 KB less in each.
  - A later skill that quotes a foundations page, such as `kern-theme` with the colour pages, adds its ID to `GUIDE_FOUNDATIONS` and a guide to the builder; the registry doesn't change.

### Group 2: the check

- [ ] `skills` and `skills --without-skills` on group 1's last commit.
- [ ] `docs:` record A3 here: the numbers, the bundle size, the list for the 2.1 release notes, and what F6 needs to know.

Then pause for review, and write the next kickoff.
