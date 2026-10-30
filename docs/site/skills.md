# Skills

The server offers skills through the MCP Skills extension (`io.modelcontextprotocol/skills`). A client that supports it shows the model each skill's name and description, and the model loads the skill when a task needs it. Unlike a [resource](./resources.md) or a [prompt](./prompts.md), nobody has to bring it in.

| Skill | What it does |
|---|---|
| `kern-ux-forms` | Builds a form with the tools: the field type for each input, labels, required and optional fields, fieldsets, the error summary, and multi-step forms with a step list, progress and a step for checking the answers. It also has KERN's rules for the text of a form, which the tools can't check. |

## What a skill is made of

A skill is a `SKILL.md` and the reference files it links, under `skill://<name>/`. `kern-ux-forms` has:

| File | Has |
|---|---|
| `skill://kern-ux-forms/SKILL.md` | When to use it, the workflow, the steps of a multi-step form, and KERN's rules for labels, hints and error messages |
| `references/inputs.md` | Which field type to use for which data, with KERN's guidance for each input and our notes where a tool differs from KERN, such as the date field, which is one browser-native input |
| `references/steps.md` | KERN's guidance for the step list, the progress bar and the summary of a multi-step form |
| `references/forms-guide.md` | The same text as the `kern://guides/forms` resource |

`kern-ux-forms` follows the same workflow as the `create_input_form` prompt, which you start yourself.

## Clients without the extension

A client that doesn't support the extension still lists each `SKILL.md` among the resources, so you can attach it like any other resource.

The files only change with a release and are the same in every server process, since clients check each file against the size and digest the server lists. On protocol `2026-07-28` they're marked cacheable for an hour.
