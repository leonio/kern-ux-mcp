# Handover: R7 done, the release next (2026-10-05, updated 2026-10-06)

Start here in a new session. R7's plan, progress, evals and findings are in [r7-kickoff.md](r7-kickoff.md). What's left before 2.0.0 is in [roadmap.md](roadmap.md#closing-out-the-alpha).

## State

- **Branch:** `feat/v2-alpha`. Nothing is pushed since `d784040`.
- **R7 is done:** three prompts (`create_input_form` with `steps`, `create_page_layout`, `review_kern_html`), the eval's prompt support and `prompts` suite, the names test, three new `validate_html` rules, the docs, and a `summary` block kind.
- **Checks:** 2,274 tests pass. Biome, both typechecks, the build and the e2e tests pass.
- **The listing** is 119,420 of 120,000 characters.
- **The full eval** (`prompts-r7-c`, `-plain`, `r7-c`, `nested-r7-c` on `214203d`): with the prompts, 96/96 and 12 of 12 answers verbatim; without, 95/96 and 3 verbatim. Base 96/96, nested 104/105. Details in the kickoff.

## Do first

1. ~~**Measure the summary block**~~ Done 2026-10-06 ([prompts-r7-summary](r5-eval/prompts-r7-summary.json)): exactly three steps in every run, a summary block in the review step, one call each with no error, 27/27, 3 verbatim. But two runs put the confirmation checkbox before the review step (see the open findings).
2. **Release 2.0.0** ([roadmap.md](roadmap.md#release-200)):
   - The client check, which also confirms the README's prompt commands (`/mcp.kern-ux.create_input_form` in VS Code, `/mcp__kern-ux__create_input_form` in Claude Code).
   - The docs: the release notes; the migration notes are complete.
   - Merge `feat/v2-alpha` into `main`. A local merge in a scratch clone computes `2.0.0` with GitVersion (2026-10-06), so the version config needs nothing.

## Lessons

- **Naming a mistake invites it.** "Never add a step for the submit button alone" made every run add a fourth step. Say what to do ("exactly the steps given"), not what not to do.
- **Quote the shape.** "One `section` block … with a `headingText`" produced flat `section` blocks in 3 of 3 runs; quoting `{ kind: "section", section: { headingText, contentBlocks } }` fixed it.
- **Ask for a thing once.** A fix list asked for as a step and again in the answer ended up written before the work, as a plan.
- **Eval order:** the first runs of a session write the prompt cache; run the comparison suite first, or compare cost only on warm runs.

## Open findings

- **Listing room:** 580 characters. The next schema addition needs a trim first; the shared `strict` description (52 tools) is the biggest one left.
- **The confirmation checkbox before the review step:** in `prompts-r7-summary`, two of three runs ended the "Fahrzeug" step with it, so people confirm answers before seeing the summary. Before the summary block, one run left it out of the review step. The text says what the review step starts with, not what follows, and no check covers it.
- **Small misses** without a check: `get_summary` called without `mode` (twice, before the summary block; the wizard no longer calls it).
