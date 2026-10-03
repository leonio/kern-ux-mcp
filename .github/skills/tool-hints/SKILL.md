---
name: tool-hints
description: "KERN UX MCP: Decide and write the one-line hints that tool descriptions carry from KERN's guidance in the knowledge bundle. Use when knowledge:import or the tool-hints test lists a stale hint, when a component tool is added, or when a tool's description changes. Reads the component's bundle document and the tool's description, applies the rule, and writes or removes one entry in packages/core/src/ux/tool-hints.ts with its source's inputHash."
argument-hint: "Name the tool(s), or say 'stale' to work through the hints knowledge:import listed"
---

# Tool hints

Tool descriptions are API text: what the tool renders and its parameters. A hint adds one line of KERN's guidance, and only where it changes which tool a model picks or how it uses it. The listing is loaded on every request and is budgeted. Every component's full guidance is in `get_component_docs` anyway.

## The rule

Write a line only when one of these holds:

1. **The name doesn't say what the component is**: preline, details, layers.
2. **A look-alike exists**, and the line tells them apart: button and link; checkbox, radio and select; loader and progress.
3. **The status changes how to use it**, and the banner in the tool's output isn't enough.

Otherwise, record nothing. Never restate what the description already says.

## The line

- **Shape:** one English sentence of at most 80 characters, saying what the component is for and what to use instead. For example: "For actions; to navigate to another page, use get_link."
- **Source:** the bundle's text only (`knowledge.summary`, `whenToUse`, `whenNotToUse`, `donts`, `similar`). Add no KERN facts the bundle doesn't state.
- **Tool names:** the line may name our tools (`get_textarea`). That's why this skill lives here and not in the packer, which must never know our tools.

## Steps

1. Read the tool's description in `packages/core/src/ux/__snapshots__/tools-list.json`.
2. Read the source document in `knowledge/`, usually `components/<kernId>.json`. `knowledge-map.ts` maps our IDs to KERN's. A tool without a component names its document in the table (`get_layers`: `foundations/layering.json`).
3. Apply the rule. If no line is needed, remove the tool's entry, if any, and stop.
4. Write the entry in `packages/core/src/ux/tool-hints.ts`: the text, the source document, and that document's `provenance["knowledge.summary"].inputHash`.
5. Run `npm test -- packages/core/src/ux/tool-hints.test.ts tools/knowledge`, then the listing tests. Update the snapshots (`npx vitest run -u`) and read the diff.
6. Hints are model-facing: run the eval (`npm run eval`) before and after a batch of changes, and compare with `npm run eval:compare`.

## When a hint goes stale

`knowledge:import` lists the hints whose source text changed, and `tools/knowledge/bundle-files.test.ts` fails until each one is handled. Re-read the source, then do one of these:
- rewrite the line
- keep it and record the new `inputHash`
- remove it
