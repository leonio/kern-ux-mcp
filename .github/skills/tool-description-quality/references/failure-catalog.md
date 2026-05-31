# Tool Description Failure Catalog

Running log of observed real-world agent failures. Each entry records the exact failing call, error, failure class, root cause, and the fix applied. Append new entries as they are discovered.

## Entry Format

```
### <date> — <short label>
Session context: <what the agent was trying to build>
Failure class: Wrong param name | Missing required arg | Bad component ID
Observed call: <tool>(<args>)
Error: <exact error text>
Root cause: <what in the description text led here>
Fix applied: <what was changed in src/ux/tools.ts>
```

---

## 2026-05-31 — Wohngeld Wizard (3 failures)

### 2026-05-31 — Wrong param name on get_component_docs

Session context: Agent building a Wohngeld (housing benefit) application wizard  
Failure class: Wrong param name  
Observed call: `get_component_docs({ "component": "button" })`  
Error: `MPC -32603: Invalid arguments for get_component_docs: - componentId: Invalid input: expected string, received undefined`  
Root cause: `componentId` `.describe()` text read `"Component id, z.B. 'button' oder 'dialog'."` — the phrase "Component id" may have prompted the agent to infer `component` as the key; no example showed the exact parameter name `componentId`  
Fix applied: Rewrote `componentId` describe() to include format rule, compound input examples (`inputtext`, `select`), and explicit discovery pointer to `list_components_by_category`

---

### 2026-05-31 — Missing required html argument on validate_html

Session context: Agent building a Wohngeld (housing benefit) application wizard  
Failure class: Missing required arg  
Observed call: `validate_html({})`  
Error: `MPC -32603: Invalid arguments for validate_html: - html: Invalid input: expected string, received undefined`  
Root cause: Tool description `"KERN UX: HTML strikt validieren (A11Y/BITV)."` gave no signal about what to pass; param describe() `"Das zu validierende HTML."` didn't say the value must be the full markup string (not a file path or context reference)  
Fix applied: Strengthened `html` param describe() to say "Der vollständige HTML-Markup-String … Den 'html'-Wert aus einem get_*-Tool-Ergebnis direkt übergeben (kein Dateipfad)". Also appended the same constraint to the tool-level description.

---

### 2026-05-31 — Unknown component ID 'form-input'

Session context: Agent building a Wohngeld (housing benefit) application wizard  
Failure class: Bad component ID  
Observed call: `get_component_docs({ "componentId": "form-input" })`  
Error: `MPC -32603: Unknown componentId: form-input`  
Root cause: Agent guessed a semantic, hyphenated ID. The `componentId` describe() only showed `button` and `dialog` as examples — both single-word, neither an input component. No format rule (squashed lowercase, no hyphens) was stated. No pointer to `list_components_by_category` as the discovery step. The agent had no way to know the correct IDs are `inputtext`, `inputemail`, `select`, etc.  
Fix applied: Same fix as wrong-param-name entry above — `componentId` describe() now includes format rule, compound examples, and discovery pointer. `list_components_by_category` description reframed as `"(Discovery): Alle Komponenten-IDs auflisten. Vor get_component_docs oder get_<id>-Tools aufrufen…"`
