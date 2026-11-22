# A3: the prompts from the skills

Status: kickoff written on 2026-11-22. Step A3 of the [2.1 roadmap](roadmap.md#5-steps), after [A2](a2-kickoff.md).

## The task

Give each workflow one source, the skill:

- **The prompts:** `create_input_form`, `create_page_layout` and `review_kern_html` return their skill's text, with the arguments filled in as the task. Their own workflow code goes.
- **The guides:** `kern://guides/{name}` serves the skills' reference files, and is deprecated in 2.1 and removed in 3.0 ([roadmap decision 3](roadmap.md#7-decisions)).

Nothing a 2.0 client uses goes away: the same prompts with the same arguments, the same guide URIs with the same text. `create_figma_design` has no skill yet; F6 writes `kern-figma-design` and then gives it the same treatment.

## What we start from

- **The prompts are code** ([packages/core/src/prompts](../../packages/core/src/prompts)):
  - each one embeds its guide as `kern://guides/{name}`;
  - `create_input_form` and `create_page_layout` link component cards (six, plus three with steps; five);
  - each ends with a text: the task from the arguments, "Work in this order:", four to six numbered steps, and the answer it wants.
- **The skills are the same workflows** ([A1](a1-kickoff.md#the-record)). Only what came from arguments changed:
  - "the steps asked for" for `steps`, the site and sections "from the request" for `purpose` and `sections`, "the HTML the person gives you" for `html`;
  - a language rule for `locale`: "the language the person writes in, German when it's unclear";
  - `get_component_docs` for the card links;
  - `kern-forms` keeps the one-page and the multi-step branch side by side, where the prompt picks one.
- **A reference is its guide, byte for byte.** `pnpm skills:build` writes each one from the guide builder, and `SKILL_FILES` carries them into the bundles (A2).
- **The guide builder runs in the server.** `guides()` builds each guide on first read: it quotes the registry's foundations pages and runs a tool for the example. Since A2 the same text is in `SKILL_FILES` too.
- **What A2 measured:** `a2-prompts`, with the server's instructions, scored 99/99 task checks and 12 of 12 verbatim answers. That's the bar ([A2's record](a2-kickoff.md#what-a3-needs-to-know)).
- **Where the guide URIs appear:** the [README](../../README.md#resources), [codebase-guide.md](../codebase-guide.md), [migration-2.0.md](../migration-2.0.md) (history, stays), `resources.test.ts`, `prompts.test.ts`, `guides.test.ts`, and the `names-in-text` snapshot.

## The design

### A prompt is its skill with a task

A prompt's messages, in this order:

1. **The reference, embedded** under its skill URI, `skill://kern-forms/references/forms.md`. Every host can read that URI: the skills' template is an ordinary resource template, read with `resources/read`.
2. **The card links,** as today, so a client that shows them still can.
3. **One text:**
   - the task from the arguments, as today: "Build a form with the kern tools: Kontaktformular des Bürgerbüros", "Fields: …", "Steps: …";
   - the language, named: "Write it in German, with `locale: "de"`.";
   - one line that says what follows: "The kern-forms skill below says how, and its reference is above; you don't need to load it.";
   - the `SKILL.md` body, without its frontmatter. Its relative links become the full `skill://` URI, so `references/forms.md` names the resource embedded above.

The body ends with the answer it wants, so that's still what the model reads last (R7).

- **A helper does it for all three:** `skillPrompt(name)` in `definition.ts` reads `SKILL_FILES` and throws if the skill or its reference is missing, so a renamed skill fails the build, not a client.
- **What goes:** each prompt's `workflow()`, `strictRender`, `NAVIGATION_LABELS` and `REVIEW_STEP`. The argument schemas, names, titles and descriptions stay.
- **The snapshots** in `prompts/__snapshots__` change. The review reads that diff: it's the prompt text the eval sends.

### The guides serve the skill files

- **`kern://guides/{name}`** reads from `SKILL_FILES` through `GENERATED_SKILL_FILES`: `forms` is `kern-forms/references/forms.md`, and so on. The listing, the sizes, completion and the not-found error stay as they are.
- **Deprecated in the description:** the template's description and each entry's say so, and name the file: "Deprecated, removed in 3.0: the same text as skill://kern-forms/references/forms.md." The text itself doesn't change, so it stays the file byte for byte.
- **The builder runs only in `pnpm skills:build` and the tests.** `GUIDES` and `buildGuide` move to `packages/core/src/skills/guide-builder.ts`, which `generated.ts` calls directly instead of going through the catalog. The server then builds nothing on first read and runs no tool for an example, and the bundles drop the builder. The record has the bundle size before and after.
- **The tests:**
  - the folder test already fails when a reference is stale against the builder;
  - `guides.test.ts` keeps the builder's checks (budget, strict-valid HTML, the quoted sections) and adds one: each guide URI serves its file byte for byte;
  - `resources.test.ts` checks the deprecation in the listing.

### The docs

- **README:** the guides are deprecated, with the skill each one moved to; each prompt returns its skill with the arguments as the task.
- **codebase-guide.md:** where the guides are built now.
- **Migration notes** for 2.1 are step R. A3 adds a line to a list in this record for R to pick up.

### The eval

One run: `prompts` on the prompts commit, three runs a scenario, about $0.90, against `a2-prompts`.

- **The bar:** 99/99 task checks and 12 of 12 verbatim, as in `a2-prompts`.
- **If it drops:** the prompt's own lines change first (the task, the line before the body), at most twice. `SKILL.md` stays as it is, since the `skills` suite measured it; a change to it means running `skills` again too.
- **Not rerun:** `skills` and `--without-prompts`, since neither sends the prompts and `SKILL.md` doesn't change.

### Risks

- **The model loads the skill again.** The instructions say to load a skill before building, and the prompt already holds it. "You don't need to load it" is there for that; the eval's prompts suite has no `Skill` tool, so only a real client shows it.
- **The language example.** `kern-forms` names "Zurück, Weiter and Absenden" whatever the language, where the prompt gave "Back, Next and Submit" for `en`. The task names the language, and no eval scenario has steps in English.
- **Both branches in a form prompt.** The prompt used to give one page or steps, and now shows both. The eval's `application-flow` has steps and `contact-form` doesn't.

## Decisions to confirm

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| A3.1 | What a prompt sends | the reference, the card links, then the task with the language and the `SKILL.md` body last | the body first and the task after it, so the answer line isn't last |
| A3.2 | The embedded reference's URI | `skill://<name>/references/<file>`, served by the catalog | `kern://guides/{name}`, which A3 deprecates |
| A3.3 | The card links | kept, as R7 and A2 measured them | dropped, so the prompt is exactly the skill and the task |
| A3.4 | How the guides say they're deprecated | in the template's and each entry's description | also a line at the top of each guide, which breaks byte-for-byte with the file |
| A3.5 | The guide builder | build time only, in `skills/guide-builder.ts`; the server serves `SKILL_FILES` | stays in the server, with a test that it matches the files |

## The plan

### Group 1: one source

- [ ] `refactor: the guides are built only for the skills`: `guide-builder.ts`, `kern://guides/{name}` from `SKILL_FILES` with the deprecation, the tests, the resource snapshots.
- [ ] `feat: the prompts return their skills`: `skillPrompt()`, the three prompts, `prompts.test.ts`, the prompt and `names-in-text` snapshots.
- [ ] `docs: the guides are deprecated, the prompts come from the skills`: README and codebase-guide.md.
- [ ] Typecheck, lint, `pnpm test`, the build with its size, e2e and `pack:mcpb`; then push for CI.

Then pause for review.

### Group 2: the measurement

- [ ] `prompts` on group 1's last commit, against `a2-prompts`.
- [ ] `docs:` record A3 here: the numbers, the bundle size, the lines for R's migration notes, and what F6 needs to know.

Then pause for review, and write the next kickoff.
