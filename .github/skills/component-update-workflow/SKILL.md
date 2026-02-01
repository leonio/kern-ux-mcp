---
name: component-update-workflow
description: "Use when updating a KERN UX component workflow in this repo: change a schema, template, tool builder, reviewed guidance, manifest input, or focused validation path. Routes overlay-only, runtime-only, and mixed component changes using bundled YAML references."
argument-hint: "Describe the component and whether the change touches rendering, guidance, manifest inputs, or all of them"
---

# Component Update Workflow

Use this skill for the end-to-end contributor workflow when a change might touch component rendering, MCP tool wiring, reviewed guidance, or the manifest build path.

## When To Use

- Change a component schema or template.
- Update tool-builder wiring or tool metadata.
- Update reviewed guidance in `docs/guidance-overlay.json`.
- Change manifest extraction or overlay validation logic.
- Decide which focused validation steps to run for a mixed change.

## Workflow

1. Classify the change with [change-routing.yml](./references/change-routing.yml).
2. Load the ordered phases and stop conditions from [workflow-map.yml](./references/workflow-map.yml).
3. Gather checked-in evidence using [evidence-sources.yml](./references/evidence-sources.yml).
4. Apply the smallest local change in the owning runtime or manifest surface.
5. Choose the narrowest validation path from [validation-matrix.yml](./references/validation-matrix.yml).
6. Keep human review as the final gate for reviewed guidance and mixed behavior changes.

## Rules

- Do not edit `src/ux/registry.json` or `dist/ux/registry.json` directly.
- Keep extracted guidance separate from `reviewedGuidance`.
- Keep the public MCP contract stable unless the task explicitly requires change.
- If the change is overlay-only, prefer the narrow drafting prompt in `../../prompts/draft-guidance-overlay-entry.prompt.md` for one-entry authoring.

## References

- [workflow-map.yml](./references/workflow-map.yml)
- [change-routing.yml](./references/change-routing.yml)
- [evidence-sources.yml](./references/evidence-sources.yml)
- [validation-matrix.yml](./references/validation-matrix.yml)