---
name: component-update-workflow
description: "Use when updating a KERN UX component workflow in this repo: change a schema, template, tool builder, the notes about a tool, the KERN knowledge import or its ID map, or a focused validation path. Routes knowledge-only, tool-notes-only, runtime-only, and mixed component changes using bundled YAML references."
argument-hint: "Describe the component and whether the change touches rendering, tool notes, the knowledge import, or all of them"
---

# Component Update Workflow

Use this skill for the end-to-end contributor workflow when a change might touch component rendering, MCP tool wiring, the notes about a tool, or the KERN knowledge import.

## When To Use

- Change a component schema or template.
- Update tool-builder wiring or tool metadata.
- Update the reviewed notes about a tool in `packages/core/src/ux/tool-notes.ts`.
- Import a new KERN knowledge bundle, or change the ID map in `packages/core/src/ux/knowledge-map.ts`.
- Decide which focused validation steps to run for a mixed change.

## Workflow

1. Classify the change with [change-routing.yml](./references/change-routing.yml).
2. Load the ordered phases and stop conditions from [workflow-map.yml](./references/workflow-map.yml).
3. Gather checked-in evidence using [evidence-sources.yml](./references/evidence-sources.yml).
4. Apply the smallest local change in the owning runtime surface, tool notes or knowledge map.
5. Choose the narrowest validation path from [validation-matrix.yml](./references/validation-matrix.yml).
6. Keep human review as the final gate for reviewed guidance and mixed behavior changes.

## Rules

- Do not edit `packages/core/src/ux/registry.json` or `knowledge/` directly: `npm run knowledge:import` generates them.
- Keep KERN's guidance (from the bundle) separate from the notes about our tools (`reviewedGuidance`, from `tool-notes.ts`).
- Keep the public MCP contract stable unless the task explicitly requires change.

## References

- [workflow-map.yml](./references/workflow-map.yml)
- [change-routing.yml](./references/change-routing.yml)
- [evidence-sources.yml](./references/evidence-sources.yml)
- [validation-matrix.yml](./references/validation-matrix.yml)