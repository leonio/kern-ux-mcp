---
name: tool-description-quality
description: "KERN UX MCP: Triage and fix agent-facing tool description issues. Use when an agent called a tool with the wrong parameter name, passed an empty argument object, or used an unknown component ID. Covers the shift-left investigation loop: classify failure class, read current z.describe() text in src/ux/tools.ts, check emitted JSON Schema, find canonical IDs in registry.json, write tighter descriptions. WHEN: agent used wrong param name (e.g. 'component' instead of 'componentId'), agent called tool with empty args {}, agent guessed hyphenated component ID (e.g. 'form-input', 'input-text'), MPC -32603 Invalid arguments error, Unknown componentId error, improve tool ergonomics, add discovery hints to tool descriptions, shift-left feedback loop, real agent failure to tool fix."
argument-hint: "Paste the failing MCP tool call and error message from the agent session"
---

# Tool Description Quality

This skill packages the shift-left feedback loop: observe a real agent failure → classify it → fix the `.describe()` string or tool description that caused it → verify the emitted JSON Schema. Use it whenever a real agent session surfaces a tool misuse pattern worth hardening.

## When to Use

- An agent session shows `MPC -32603: Invalid arguments for <tool>: - <param>: Invalid input: expected string, received undefined`
- An agent session shows `MPC -32603: Unknown componentId: <value>`
- An agent passes `{ "component": "..." }` instead of `{ "componentId": "..." }` (wrong parameter name)
- An agent calls `validate_html({})` with no arguments
- An agent guesses a hyphenated or compound ID like `form-input`, `input-text`, `input-email`
- You want to add a discovery hint so agents call `list_components_by_category` before guessing IDs

## Failure Classes

| Class | Symptom | Root Cause Location |
|---|---|---|
| **Wrong param name** | Agent sends `{ component: "button" }` | `z.describe()` on the param in `src/ux/tools.ts` doesn't reinforce the key name |
| **Missing required arg** | Agent calls tool with `{}` | Tool `description` field doesn't say what to pass; param describe() is too vague |
| **Bad component ID** | `Unknown componentId: form-input` | `componentId` describe() shows only simple examples; no format rule; no discovery pointer |

## Investigation Procedure

### Step 1 — Classify the failure

Read the error message:
- `Invalid input: expected string, received undefined` at `<param>` → **Missing required arg** or **Wrong param name**
- `Unknown componentId: <value>` → **Bad component ID**

### Step 2 — Read the current description text

In [src/ux/tools.ts](../../../../src/ux/tools.ts), find the offending tool builder function (e.g. `buildValidateHtmlTool`, `buildDocsTool`, `buildListComponentsByCategoryTool`).

Check:
- The `z.describe()` string on the problematic parameter
- The `description:` string on the returned `ToolDef` object

### Step 3 — Verify what the agent actually receives

The `toolInputSchemaToJsonSchema` function in [src/ux/json-schema.ts](../../../../src/ux/json-schema.ts) serializes Zod schemas to draft-07 JSON Schema. Zod's `.describe()` becomes the `"description"` property on each field in the emitted schema. Agents read the `description` on the `inputSchema` properties node — so whatever text is in `.describe()` is agent-visible.

### Step 4 — For ID failures: look up canonical IDs

Component IDs in [src/ux/registry.json](../../../../src/ux/registry.json) follow a strict convention:
- Squashed lowercase, no hyphens, no underscores
- `inputtext` not `input-text`; `inputemail` not `input-email`
- Tool name is always `get_<id>` (e.g. `get_inputtext`)
- `form-input` is not a valid ID — use specific input type IDs (`inputtext`, `inputnumber`, etc.)

Call `list_components_by_category` (no arguments) to get the full current list at runtime.

## Fix Patterns

### Pattern A — Wrong param name (reinforce the key)

Add the literal key name to the `.describe()` text. Example:

```diff
- componentId: z.string().describe("Component id, z.B. 'button' oder 'dialog'."),
+ componentId: z.string().describe(
+   "Komponenten-ID aus list_components_by_category, z.B. 'button', 'inputtext', 'select', 'checkbox'. " +
+   "IDs sind kleingeschrieben ohne Bindestriche – 'inputtext' nicht 'input-text'. " +
+   "Unbekannte ID: zuerst list_components_by_category aufrufen.",
+ ),
```

### Pattern B — Missing required arg (clarify what to pass)

Make the param describe() say what the value IS and where it comes from. For `html`:

```diff
- html: z.string().describe("Das zu validierende HTML."),
+ html: z.string().describe(
+   "Der vollständige HTML-Markup-String, der validiert werden soll. " +
+   "Den 'html'-Wert aus einem get_*-Tool-Ergebnis direkt übergeben (kein Dateipfad, kein Dateiname – nur der Markup-String).",
+ ),
```

Also strengthen the tool-level `description` to reinforce the expectation:

```diff
- description: "KERN UX: HTML strikt validieren (A11Y/BITV).",
+ description: "KERN UX: HTML strikt validieren (A11Y/BITV). Der Parameter 'html' erwartet den vollständigen Markup-String – keinen Dateipfad. Den 'html'-Wert aus einem get_*-Tool direkt übergeben.",
```

### Pattern C — Add discovery routing to tool description

For tools that accept IDs, append a discovery hint to the tool `description`:

```diff
- description: "KERN UX: Dokumentation zu einer Komponente lesen.",
+ description: "KERN UX: Dokumentation zu einer Komponente lesen. Gültige IDs liefert list_components_by_category – bei unbekannter ID dieses Tool zuerst aufrufen.",
```

For the discovery tool itself, make its role explicit:

```diff
- description: "Listet Komponenten nach Kategorie und Strategie (manifestbasiert).",
+ description: "KERN UX (Discovery): Alle Komponenten-IDs auflisten. Vor get_component_docs oder get_<id>-Tools aufrufen, wenn die Komponenten-ID unbekannt ist. Liefert id, title, category und strategy für jede Komponente.",
```

## Change Boundaries

**Allowed:**
- Edit `.describe()` call text on parameters in `src/ux/tools.ts`
- Edit `description:` strings on `ToolDef` objects in `src/ux/tools.ts`
- Append entries to `references/failure-catalog.md`

**Not allowed:**
- Rename parameters — this breaks the public MCP contract
- Add new tools or remove existing ones — breaking contract change
- Edit `src/ux/registry.json` or `dist/ux/registry.json` directly — generated artifact
- Edit schemas, templates, or tool-builders for description-only fixes

## Verification

1. Run `pnpm test` — description strings are not under test; no failures expected
2. Optionally build and inspect `listTools()` output to confirm the new description text appears in the emitted JSON Schema `"description"` field for the changed parameters
3. Re-run the failing agent session scenario — the agent should now call `list_components_by_category` before attempting component-specific tools

## References

- [Failure catalog](./references/failure-catalog.md) — running log of observed real-world agent failures
- [src/ux/tools.ts](../../../../src/ux/tools.ts) — all tool builder functions and description strings
- [src/ux/json-schema.ts](../../../../src/ux/json-schema.ts) — Zod-to-JSON-Schema serialization (confirms `.describe()` propagates)
- [src/ux/registry.json](../../../../src/ux/registry.json) — canonical component IDs
