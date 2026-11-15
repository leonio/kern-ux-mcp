# A1: the skills source

Status: kickoff, written on 2026-11-15; group 1 started the same day. Step A1 of the [2.1 roadmap](roadmap.md#5-steps), after [A0](a0-kickoff.md).

## The task

Write the first three skills as files in this repo, with what builds and checks them, and measure them against the prompts they come from:

- `kern-forms` from `create_input_form` and the forms guide;
- `kern-page-layout` from `create_page_layout` and the layout guide;
- `kern-review` from `review_kern_html` and the accessibility guide.

Nothing a client sees changes yet. A2 serves the skills over MCP, A3 makes the prompts return them, A4 ships them as files.

## What we start from

- **The prompts** ([packages/core/src/prompts](../../packages/core/src/prompts)) are code: a workflow of four to six numbered steps, filled in with the arguments (`purpose`, `fields`, `steps`, `sections`, `html`, `locale`). Each embeds its guide and links the component cards it uses, and ends with the answer it wants: the final HTML, verbatim. R7 measured that ending: 12 of 12 answers verbatim with the prompts, 3 of 12 without.
- **The guides** ([guides.ts](../../packages/core/src/resources/guides.ts)) are built from code and the bundle: what our tools do, an example rendered with stable IDs, and KERN's text quoted section by section. Their output is deterministic and already checked in as snapshots (`resources/__snapshots__/guides/`): forms 7,572 bytes, layout 6,896, accessibility 12,600.
- **Headless Claude Code loads skills from files**, checked on 2026-11-15 with Claude Code 2.1.293 and Haiku 4.5: with a skill in the working directory's `.claude/skills`, `--setting-sources project` and `--tools Skill,Read`, the model called `Skill` with `{ "skill": "kern-probe" }`, read the skill's reference file with `Read`, and answered from it, for $0.03. Two things to know:
  - `--disable-slash-commands`, which every eval run passes today, disables all skills ("Disable all skills" in `claude --help`), so the skills suite leaves it out.
  - Claude Code's own bundled skills (`verify`, `debug`, `code-review` and more) are listed next to ours. The check is whether the model picks ours.
- **The eval's reports** go to `docs/v2-migration/evals`, a path fixed in [run.ts](../../tools/eval/run.ts).

## The design

### The folder

```
skills/
  kern-forms/
    SKILL.md                  by hand
    references/forms.md       generated: the forms guide
  kern-page-layout/
    SKILL.md
    references/layout.md      generated: the layout guide
  kern-review/
    SKILL.md
    references/accessibility.md   generated: the accessibility guide
```

- **`SKILL.md` alone is enough to do the task right.** It carries the prompt's workflow, the answer it asks for and the language rule. The reference adds KERN's rules for depth, which the model reads when it needs them. That's R6's lesson: guidance that matters goes where the model will see it.
- **A reference is its guide, byte for byte.** `npm run skills:build` writes each one from the guide builder, so `kern://guides/forms` and `skills/kern-forms/references/forms.md` are the same text. A3 then serves the guide URIs from the files. The guides' snapshots go once the files are checked by the same test.
- **Components:** a skill names `get_component_docs` for a component's details, not the `kern://components/{id}` URIs the prompts link. A skill installed as files can't read a `kern://` URI; every client can call a tool.

### `SKILL.md`

The frontmatter, by the [Agent Skills specification](https://agentskills.io/specification):

| Field | Value |
|---|---|
| `name` | the folder's name |
| `description` | a routing rule: what the skill does, when to use it, and which skill to use for the next thing |
| `license` | `EUPL-1.2` |
| `compatibility` | "Needs the KERN UX MCP server (@leonio/kern-ux-mcp)." |

The descriptions to start from:

- **kern-forms:** "Builds accessible KERN forms and multi-step forms with the KERN UX MCP server's tools: field types, labels, hints, required and optional fields, errors with the error summary, and for several steps the step list, progress and a review step. Use it whenever a page needs a form or form fields. For the page around the form, use kern-page-layout with it."
- **kern-page-layout:** "Builds a whole KERN page with the KERN UX MCP server's render_page tool: the header with navigation, the main heading, sections with grids and cards, and the footer, on KERN's grid. Use it for any web page, start page or service page. For a form on the page, use kern-forms with it."
- **kern-review:** "Checks HTML against KERN's markup and accessibility rules with the KERN UX MCP server's validate_html, rebuilds it with the KERN tools, and lists the fixes by rule. Use it when someone gives you HTML to review, fix or move to KERN."

The body, in this order:
1. One line on what the skill makes, and that the tools are the KERN UX MCP server's, named without the prefix a client adds.
2. The workflow, numbered, from the prompt, with the arguments' parts written as what to take from the request. `kern-forms` keeps the single-page and the multi-step branch next to each other: "for a form on one page …", "for several steps …".
3. Language: the page's text in the user's language, German when it's unclear, with `locale: "de"` or `"en"` on the render call.
4. The answer, last: the prompts' sentence about the final HTML, verbatim in one `html` block (`kern-review`: the fix list first).
5. A line naming the reference file and `get_component_docs`.

Each `SKILL.md` stays under 150 lines.

### `skills:build` and the checks

- **`npm run skills:build`** (`tools/skills/build.ts`) writes every generated reference from the guide builder. `--check` exits non-zero when a file differs, for CI. It never touches a `SKILL.md`.
- **A test over the folder** (`packages/core/src/skills/skills.test.ts`):
  - `SkillsExtension.load(nodeSkillFiles("skills"), { strict: true })` loads it with no warning: the SDK's naming, frontmatter and limit checks, the ones a host will apply;
  - each skill has the four frontmatter fields, a description of at most 1,024 characters, and a `SKILL.md` under 150 lines;
  - each generated reference equals what the builder writes now, so a change to a guide that isn't rebuilt fails;
  - every relative link in a `SKILL.md` is a file of the skill.
- **`names.test.ts`** reads the skills too: every tool name and `kern://` URI in them exists.

### The eval

- **A `skills` suite** with the `prompts` suite's four scenarios (`contact-form`, `application-flow`, `service-page`, `fix-page`), sent in their own words. The runs copy `skills/` into the working directory as `.claude/skills`, add `Skill` and `Read` to `--tools` and `--allowedTools`, and leave out `--disable-slash-commands`.
- **A new check, `expectSkill`:** the run called `Skill` with that skill's name. The scenarios' checks stay as they are, the verbatim answer among them.
- **Compared on one commit:** `prompts`, `prompts --without-prompts` and `skills`, three runs each. About $3.
- **The reports** go to `docs/plan-v2.1/evals` ([decision A1.4](#decisions-to-confirm)).
- **What counts as good enough:** the skill is loaded in every run, and `skills` scores at least what `--without-prompts` does, and close to `prompts`. If it doesn't, the wording changes, at most twice; then the tool or the skill's shape changes instead (2.0's lesson).

## Decisions to confirm

Confirmed by the maintainer on 2026-11-15: the recommended column.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| A1.1 | Where the skills live | `skills/` at the repo's root, where plugins and install commands look (A4); A2 inlines them into the bundles from there | `packages/core/skills/` |
| A1.2 | What's generated | the references, from the guide builder, checked in, with `skills:build --check`; `SKILL.md` by hand | everything built at runtime, with no files in the repo |
| A1.3 | Components in a skill | named through `get_component_docs` | the `kern://components/{id}` URIs, as the prompts link them |
| A1.4 | The eval's reports for 2.1 | `docs/plan-v2.1/evals`, a constant in `run.ts`; 2.0's reports stay where they are | keep writing to `docs/v2-migration/evals` |
| A1.5 | The `compatibility` field | set, naming the server | left out |

## The plan

### Group 1: the source and its checks

- [ ] `chore: skills:build and the checks for the skills folder`: the script with `--check`, the npm script, the folder test, `names.test.ts` over `skills/`, and `skills:build --check` in CI's quality job.
- [ ] `feat: the kern-forms skill`
- [ ] `feat: the kern-page-layout skill`
- [ ] `feat: the kern-review skill`
- [ ] Typecheck, lint, `npm test`; the listing snapshots and the budget test unchanged.

Then pause for review of the three `SKILL.md` texts.

### Group 2: the measurement

- [ ] `test(eval): a skills suite`: the suite, the `expectSkill` check, the copied skills and the tools, and the report folder.
- [ ] Build, commit, and run `prompts`, `prompts --without-prompts` and `skills` on the same commit, three runs each.
- [ ] Wording fixes, if the numbers ask for them, one commit each and measured again.
- [ ] `docs:` record A1 here: the numbers, what changed, and what A2 needs to know.

Then pause for review, and write the A2 kickoff.
