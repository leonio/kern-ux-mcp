# Figma designs, click dummies and themes: the design

Status: design, written on 2026-10-15. Nothing here is built yet. [Section 8](#8-decisions-2026-10-15) has the decisions confirmed with the maintainer, and [section 9](#9-open-questions) the questions still open.

## 1. The goal

Designers link the KERN Figma kit into their files and design there. They iterate on screens in HTML with this server. This work lets them also:

1. build a screen they composed with our tools in Figma, from the kit's own components;
2. turn a composed flow into a click dummy;
3. try another colour scheme, in light and dark, in the HTML and in Figma alike.

## 2. How it fits together

MCP servers don't call each other. The designer's assistant has both servers connected: ours plans, checks and themes; Figma's draws in the file.

```
designer ──prompt──▶ assistant ──▶ kern-ux-mcp   compose, validate, theme: the plan and KERN's rules
                         │
                         └───────▶ Figma MCP     use_figma, search_design_system: draws in the file
```

Our server stays as it is: stateless, with no network calls. Each feature below is a tool result, a resource or a prompt that tells the assistant what to do with Figma's tools.

## 3. What we start from

Findings in the discovery format: where, problem, proposal, risk.

### F1. Figma's MCP server can write to a file

- **Where:** Figma's remote MCP server and its skills ([figma/mcp-server-guide](https://github.com/figma/mcp-server-guide), read at `f278942`, 2026-10-15).
- **What it offers:**
  - `use_figma` runs Plugin API scripts: frames, auto layout, component instances, variables.
  - `search_design_system` finds a linked library's components, variables and styles.
  - `html_to_figma` turns a static HTML document into editable layers, and `generate_figma_design` captures a running page.
  - `send_code_to_figma` puts runnable HTML into a Figma code layer.
  - Its `figma-generate-design` skill builds a screen from library instances, one section per call, using the library's variables instead of fixed values.
- **Problem:** the skill finds components by searching the library and looking at existing screens. It doesn't know which KERN components a screen needs, how they nest, or KERN's rules for them.
- **Proposal:** we supply the what (components, options, nesting, KERN's rules); Figma's skills supply the how.
- **Risk:** writing is in beta, on the remote server only, needs a Full seat, and is to become a usage-based paid feature.

### F2. Our composition knowledge is in the tool schemas, not in data

- **Where:** the block tree of `render_composition` and `render_page` ([content-union.ts](../packages/core/src/ux/schemas/content-union.ts)): `section`, `grid`, `card`, `form`, `fieldset`, `field`, `disclosure`, `formFlow`, `summary`, `button`, `badge`, `text`, `html`. In the bundle, `anatomy` and `relations` are empty and the three patterns are stubs.
- **Problem:** nothing maps a block or a component option to a part of the Figma kit.
- **Proposal:** the composition tree a designer already iterates on is the plan, so there's no new format. A code-owned kit map ([F3](#f3-nothing-maps-our-components-to-the-kit)) translates each block into kit components.
- **Risk:** blocks that hold raw `html` have no kit equivalent. The prompt has to say what to do with them.

### F3. Nothing maps our components to the kit

- **Where:** every bundle component links to the KERN community Figma file (`links.figma`), and that's all. The packer stores only that link ([kern-ux-knowledge-packer](https://github.com/leonio/kern-ux-knowledge-packer), `internal/bundle/docs.go`).
- **Problem:** we don't know the kit's component names, variant properties, text properties or colour variables.
- **Proposal:** the maintainer sends the kit's names, which match the components on kern-ux.de. We keep the map in code, as [knowledge-map.ts](../packages/core/src/ux/knowledge-map.ts) keeps KERN's IDs, with a test against the bundle's `options`.
- **Risk:** the kit and the bundle can drift apart. The test catches it on our side, but only when the map is updated.

### F4. KERN's colours are themeable, and our HTML carries none

- **Where:** `@kern-ux/native` 2.8.2, `src/scss/core/tokens` and `layers`:
  - `primitives/_colors.scss`: 11 ramps (darkblue, lightblue, green, limette, turquois, violet, red, orange, yellow, grey, neutral), 20 steps each from 025 to 950, in OKLCH.
  - `_theme.scss`: 37 colour roles per mode, such as `--kern-color-action-default` pointing at `darkblue-700` in light and `darkblue-300` in dark. Hover and active shades are mixed from the action colour, so they follow it. Seven values, the state opacities and the overlay, are marked "Excluded from Theming".
  - `layers/_levels.scss`: 25 contextual variables per level, which the components read.
- **Facts:**
  - Components read only these variables. The one fixed colour is the Kopfzeile's white focus outline, and the Kopfzeile is the federal header, which no theme should touch.
  - Our templates write no colours, apart from the flag in the Kopfzeile.
  - KERN's themes README describes a custom theme as four blocks that override the roles: light and dark by system setting, and by `data-kern-theme` or `.kern-light`/`.kern-dark`.
  - Tested in headless Chromium: such a stylesheet, loaded after `kern.css`, re-colours buttons, links and buttons inside `kern-level-1`, in light and dark, with the markup unchanged.
- **Contrast:** KERN fixes the contrast of each step, not its lightness, so every ramp contrasts the same at the same step. Computed from the OKLCH values:

  | Step | Against | Range across the 11 ramps |
  |---|---|---|
  | 700 | white | 8.49 to 8.61 : 1 |
  | 600 | white | 6.00 to 6.05 : 1 |
  | 500 | white / black | 4.50 to 4.54 / 4.62 to 4.67 : 1 |
  | 400 | black | 6.96 to 7.01 : 1 |
  | 300 | black | 9.48 to 9.56 : 1 |

  So a role moved to another ramp at the same steps keeps its contrast.
- **Proposal:** theming needs no change to our markup. We add the theme itself and the checks ([section 4](#4-themes)).

### F5. The token data isn't in the bundle

- **Where:** `get_tokens` ([tools.ts](../packages/core/src/ux/tools.ts)) returns names only, carried over from the old registry. Seven of them no longer exist in KERN 2.8.2, and many real ones are missing, `--kern-metric-space-default` among them. The packer's code says "token values come with K4".
- **Problem:** a theme needs the ramps' values, the roles' light and dark mapping, and which roles may change. Without a list of KERN's variables, nothing can test that the variables we name exist: `get_utility_reference` named eight that don't (fixed on `fix/utility-reference-backgrounds`).
- **Proposal:** `foundations/tokens.json` in the packer ([section 7](#7-asks-for-the-packer)), then `get_tokens` from the bundle and a test over every `--kern-*` name in our source.

### F6. The listing has 580 characters of room

- **Where:** `tools/list` is 119,420 of its 120,000-character budget ([tools.budget.test.ts](../packages/core/src/ux/tools.budget.test.ts)).
- **Proposal:** prompts and resources first; they don't count against the listing. A new tool only where a deterministic result matters (the theme's contrast check), after a trim. The biggest trim left is the shared `strict` description, repeated in 52 tools.

### F7. A composed flow is nearly a click dummy already

- **Where:** `render_page` writes a whole document that loads KERN's CSS from jsDelivr ([page.ts](../packages/core/src/ux/templates/page.ts)). `formFlow` with `renderAllSteps` renders every step, the inactive ones hidden, "so a script can switch steps".
- **Problem:** no script ships with it, and nothing describes navigation between pages.
- **Proposal:** a `formFlow` is the first click dummy: one Figma frame per step, linked by its Back and Next buttons ([section 6](#6-click-dummies)).

## 4. Themes

### What a theme can change

Two kinds of change, both in light and dark:
1. **Roles moved to another KERN ramp at the same steps,** such as the action colour from `darkblue` to `violet` (`700` in light, `300` in dark). Contrast holds by construction ([F4](#f4-kerns-colours-are-themeable-and-our-html-carries-none)).
2. **Brand accents and backgrounds:** the decorative brand colour and the layout backgrounds, which KERN's branding guidance leaves free. Values are KERN ramp steps.

Out of scope: colours of one's own (new ramps), the typeface, spacing, the Kopfzeile, and the opacities KERN excludes from theming.

### The theme

A theme names a ramp per role group, and a step only where it departs from KERN's:

```json
{
  "name": "violet",
  "action": "violet",
  "brand": { "light": "red-600", "dark": "red-400" },
  "background": { "level-1": { "light": "violet-025", "dark": "violet-950" } }
}
```

`"action": "violet"` swaps the ramp of the action colour and keeps KERN's steps (`700` in light, `300` in dark), which is the safe default; its hover, active and state shades follow, since they're mixed from it. The visited and focus colours are roles of their own. The shape is a first sketch: the role groups and their roles come from `tokens.json`, and the shape settles in T1.

### The checks

Deterministic, from the OKLCH values, per mode:
- every value is a ramp step that exists;
- text (default and muted) on every background level and surface: 4.5:1;
- the action colour as link text on every background: 4.5:1;
- the button label (`action-on-default`) on the action colour: 4.5:1;
- the focus colour and form input borders on every background: 3:1;
- warnings, not errors: the action ramp is the visited ramp, or a feedback ramp (red, orange, turquois, lightblue), so its meaning could be mistaken. KERN's rule that colour never carries meaning alone still applies.

The decorative brand colour has no contrast requirement (KERN: "for ornament only"), but it must not be a background for text, which the guide says.

### What the server returns

- **CSS:** the four blocks of KERN's themes README, to load after `kern.css`.
- **Figma:** the same roles with their ramp steps per mode, for the assistant to apply with `use_figma` ([section 5](#5-figma-designs-from-composed-screens)).
- **`render_page`:** an optional theme, embedded as a `<style>` after KERN's stylesheets, so a previewed page shows it.

### Where it lives

- `kern://guides/theming`: how KERN's theming works, the role groups, the rules above. A resource, so it costs no listing.
- `create_theme`: a tool, because the contrast check must be computed, not estimated. It needs a listing trim first ([F6](#f6-the-listing-has-580-characters-of-room)).

### In Figma

If the kit's colours are variables, with semantic variables aliasing primitives in light and dark modes, a theme in Figma is the same change as in CSS: point the semantic variables at other primitives, per mode.

- A file that uses a linked library can't change the library's variables (to confirm in the test file). The theme goes into the designer's own file or an editable copy of the kit.
- Figma's skills recommend **extended collections** for brand themes: a collection based on another that overrides only some values, "just like inheritance and overrides in CSS". Whether the designers' plan has them is an open question.
- Today designers change colours in Figma's UI. The first step is instructions the assistant can run with `use_figma`, compared by hand with the UI.

## 5. Figma designs from composed screens

1. The designer iterates in HTML with `render_page` and `render_composition`, as today.
2. They ask for the screen in Figma. A prompt, `create_figma_design`, carries the workflow:
   - the final composition tree and the kit map;
   - then Figma's `figma-generate-design` workflow: a wrapper frame, one section per `use_figma` call, kit instances with their variant properties set from our options, text overrides, auto layout, and KERN's variables for spacing and colour.
3. Optionally in parallel, as Figma's skill recommends: `html_to_figma` or `generate_figma_design` on the same page, as a pixel reference to compare against and then delete.

What we build:
- **The kit map:** our component and option values to the kit's component, variant property and value, with its text properties. Code-owned, served as a resource the prompt links to, and tested against the bundle's `options`.
- **The prompt,** with cases in `prompts.test.ts`; `names.test.ts` checks the tools and URIs it names.
- **Later, if evals show the need:** a tool that flattens a composition into a list of frames, kit components, variant properties and texts, so the assistant transcribes instead of translating.

Risks: Figma's write access is in beta. One section per call is slow on big pages. `use_figma` can't fetch images; Figma's skill takes them from a capture of the page.

## 6. Click dummies

Two forms:

1. **A Figma prototype.** One frame per `formFlow` step, built as in [section 5](#5-figma-designs-from-composed-screens). Each step's Back and Next buttons get prototype links to the neighbouring frames (`setReactionsAsync` through `use_figma`); the summary step links back to each step it summarises. Figma's skills don't cover prototype links, so the prompt carries the steps.
2. **An HTML click dummy.** `render_page` with `formFlow` and `renderAllSteps`, plus a small script that switches steps. It has KERN's real CSS and behaviour and takes a theme. `send_code_to_figma` can put it into Figma as a runnable code layer.

Pages that aren't one form flow need navigation between screens, which our compositions don't describe. First, the prompt takes a list of screens and transitions ("the 'Weiter' button on screen 1 goes to screen 2"). A schema for flows waits until that proves useful.

## 7. Asks for the packer

`foundations/tokens.json` (K4 in the [knowledge-bundle design](v2-migration/knowledge-bundle.md#8-phases)), extracted from kern-ux-plain's SCSS:
- **primitives:** each ramp step with its OKLCH value;
- **roles:** each semantic colour role with its light and dark alias, its group (layout, action, form input, feedback, decorative), and whether KERN excludes it from theming;
- **contextual:** each contextual variable with the role it takes per level;
- **other variables:** spacing, sizes and typography, with their values;
- **the theme selectors** KERN's themes use, so a theme can be written against them.

Nothing in it names this repo's tools (bundle design rule 7).

## 8. Decisions (2026-10-15)

1. **For designers.** They link the KERN kit in Figma and design there, and they iterate in HTML with this server.
2. **Our server doesn't call Figma.** The assistant uses both servers: ours returns plans, rules, themes and checks; Figma's draws.
3. **Themes move roles to other KERN ramps at the same steps, and set brand accents and backgrounds.** Colours of one's own are out of scope.
4. **Themes cover light and dark.**
5. **Figma's colours:** designers change them in Figma's UI today. We try giving the assistant instructions to make the same change through Figma's MCP server.
6. **The kit's component names match those on kern-ux.de.** The maintainer sends the list.
7. **Not pursued: Angular Aria and React Aria.** Considered and dropped on the same day. KERN's CSS styles native elements (the checkbox's look is on the `<input>`, the accordion is `<details>`), while the aria libraries mostly cover widgets KERN has no CSS for, and React Aria's checkbox and select render markup KERN's CSS can't style. Retrofitting KERN onto them meant writing new CSS, not reusing knowledge.

## 9. Open questions

1. **The kit:** its component and variant property names, its text properties, and its colour variable collections with their names and modes. Do the semantic variables alias the primitives, as in CSS?
2. **Copy or linked library:** which do designers work in, and does their Figma plan have extended collections?
3. **Feedback colours** (danger, warning, success, info): fixed, or a role group a theme may move? Fixed is the proposal, since they carry meaning.
4. **The listing trim** for `create_theme`: the shared `strict` description is the candidate.
5. **Click dummies:** the Figma prototype, the HTML one, or both?
6. **Testing against Figma:** our eval runs headless Claude Code against our server only. Checking Figma output needs the remote server, a Full seat and a test file.
7. **`html_to_figma`:** does it take our page as it is, loading KERN's CSS from jsDelivr, or does it need the CSS inline? `kern.min.css` is 350 KB, too big to pass as a tool argument.

## 10. Order of work

Each step can be released on its own:

| Step | Repo | What | Needs |
|---|---|---|---|
| T0 | packer, then here | `tokens.json`; `get_tokens` from the bundle; a test that every `--kern-*` name in our source exists | — |
| T1 | here | `kern://guides/theming`, `create_theme` with its checks, the theme option of `render_page` | T0, a listing trim |
| F1 | here | The kit map and its test | the kit's names |
| F2 | here | `create_figma_design` | F1, a Figma test file |
| F3 | here | Click dummies: frames and prototype links; the HTML step script | F2 |
| F4 | here | Themes in Figma: the variable instructions | T1, the kit's variables |

T0 and F1 don't depend on each other and can run side by side.

## Sources

- KERN: `@kern-ux/native` 2.8.2 from npm (`src/scss/core/tokens`, `layers/_levels.scss`, `src/scss/themes/README.md`); the bundle's `foundations/branding-usage.json`, `colour-systematic.json` and `layering.json`.
- Figma: [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) (`skills/figma-generate-design`, `figma-use`, `figma-code-workflows`); [Guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server); [Write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/).
- The rejected aria route: `@angular/aria` 22.2.3 and `react-aria-components` 1.22.1 from npm; the [Angular Aria overview](https://github.com/angular/angular/blob/main/adev/src/content/guide/aria/overview.md).
