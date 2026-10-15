# Figma designs, click dummies and themes: the design

Status: design, written on 2026-10-15. Nothing here is built yet. [Section 8](#8-decisions-2026-10-15) has the decisions confirmed with the maintainer, and [section 9](#9-open-questions) the questions still open. F8 to F11 come from reading the kit itself the same day, through Figma's MCP server and a capture of the file. They answer most of the open questions and change the order of work.

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

### F8. The kit is two community libraries, and each team publishes its own copy

- **Where:** "KERN 2 Design-Kit (Community)" 2.4.0 ([file](https://www.figma.com/design/UcsH2HANhmoU2OvwJkN7mI/KERN-2-Design-Kit--Community-)), read with `use_figma` on 2026-10-15; its pages "Erste Schritte" and "Variablen-Collections".
- **Facts:**
  - The kit holds the components, 53 text styles and the docs. A second file, "KERN 2 Foundations (Community)", holds all the variables; the kit has none of its own.
  - Its setup guide has a team duplicate both files into a team project, publish the Foundations, point the kit at that copy and publish the kit. Designers then link both into their work files. So every team owns an editable copy of the Foundations. Publishing libraries needs a paid plan.
  - Components are named as on kern-ux.de, in kebab case: `button-primary`, `input-text`, `card-small-interactive`, `summary-group`, `task-list`, `kopfzeile`. Header, Footer, Tabs and Search are marked as in progress or in the backlog.
  - Property names carry an ID (`✏️ label#10307:96`). Text properties start with ✏️ and instance swaps with ↳.
- **Consequence:** component keys differ in each team's copy. A kit map names components and properties, and the assistant finds them in the designer's libraries.

### F9. Figma's variables are KERN's CSS variables, layer for layer

- **Where:** the variables the kit's components bind, followed through their aliases, compared with kern-ux-plain's `primitives/_colors.scss`, `_theme.scss` and `layers/_levels.scss`.
- **Facts:**

  | Collection | Modes | Holds | In CSS |
  |---|---|---|---|
  | `01_Fidelity` | High, Low | primitives `color/<ramp>/<step>`, font sizes, the typeface | `primitives/_colors.scss` |
  | `02_Device` | Mobile, Desktop | `metric/space/*`, `metric/dimension/*`, radii, borders, typography | the metric and typography tokens |
  | `03_Theme-Mode` | Dachmarke-Light, Dachmarke-Dark | 37 colour roles, the state opacities | `_theme.scss` |
  | `04_Level` | Level-0, Level-1, Level-2 | the `*-contextual` variables | `layers/_levels.scss` |

  - A Figma name is the CSS name with `/` for `-`: `color/action/state/indicator/tint` is `--kern-color-action-state-indicator-tint`. Names with 👁️ are hidden drafts.
  - The values match: `color/darkblue/700` is `#2044aa`, the sRGB of KERN's `oklch(42.84% 0.1689 265.02)`.
  - 34 of the 37 colour roles alias the same primitive as in CSS, in light and in dark. The exceptions: `decorative/brand/default` is `darkblue-800`/`darkblue-300` in Figma and `neutral-700`/`neutral-300` in CSS, and `action/focus/inside` and `action/focus/outside` exist only in Figma.
  - Components bind the contextual layer. The primary button's fill is `color/action/default-contextual`, which aliases `color/action/default`, which aliases `color/darkblue/700`.
  - Low fidelity swaps the primitives for greys and the typeface for Flow Circular, for wireframes. It exists only in Figma.
  - KERN has tried themes as modes of `03_Theme-Mode`. The kit still caches older versions of the collection with the modes Brand-Light, Brand-Dark, "❌ Rosenheim Test" and "❌ Baden Württemberg", and its docs say more themes can be added ("Weitere Themes können bei Bedarf ergänzt werden").
- **Proposal:** a theme in Figma is two new modes of `03_Theme-Mode` in the team's Foundations, each role aliased to the primitive the theme names. The theme of [section 4](#4-themes) translates by name, with no lookup table.
- **Risk:** the kit file caches only the variables its components use, so a theme on another ramp needs the Foundations' own list, which we haven't read yet. Aside: KERN's level-0 block misspells one variable, `--kern-color-color-action-state-indicator-default-contextual`.

### F10. Figma's MCP server limits reading too

- **Where:** this session, with a View seat on a Starter plan; Figma's [rate limits](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/).
- **Facts:**
  - `use_figma` read the community kit with a View seat: pages, components with their properties, and variables with their aliases.
  - View and Collab seats get 20 calls a month; Dev and Full seats get about 200 a day. Reading the kit takes one call per page, and the month's budget ran out with 11 of the 26 component pages unread.
  - `html_to_figma` and `generate_figma_design` weren't offered to this account.
- **Proposal:** the kit's inventory comes from a capture, not from the MCP server ([F11](#f11-a-kiwi-capture-is-a-full-offline-snapshot)). Our prompts save the designer's calls for drawing: they name the kit components, so the assistant searches only for their keys.

### F11. A kiwi capture is a full offline snapshot

- **Where:** the maintainer's capture of Figma's web socket, decoded with `figma_kiwi` on 2026-10-10.
- **Facts:**
  - The capture `fDPttmdh80n5MARCJu8Pyh` is the KERN 2 Design-Kit: the same 35 pages, 717 cached variables, and every component with its variant axes.
  - The decoded output lacks the text, boolean and instance-swap properties, and doesn't descend into nested instances. `input-text`, for example, is a single instance, `form`, whose label and hint we can't see yet.
  - The capture `D6e102ZZEd4Xf1tfCmhYZc` is another file. It uses an older KERN library (`kern-button-primary` with `icon position`, fixed hex fills, collections such as `Dachmarke-Semantic-Test`), so it isn't a source for the map.
- **Proposal:** the packer takes a capture of both libraries as a fourth source and writes the kit's components and variables into the bundle ([section 7](#7-asks-for-the-packer)). The decoder needs to add the property definitions and nested instances.

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

The kit's colours work as in CSS ([F9](#f9-figmas-variables-are-kerns-css-variables-layer-for-layer)), so a theme is the same change. It adds two modes to `03_Theme-Mode` in the team's Foundations, one light and one dark. Each role the theme moves aliases another primitive of `01_Fidelity`, and the other roles alias what Dachmarke-Light and Dachmarke-Dark alias. The designer picks the theme's mode on a page or frame, and the kit's components follow, since they bind only contextual variables.

- `create_theme` returns, per mode, each role's Figma name and its primitive's, such as `color/action/default` → `color/violet/700`. The assistant applies them with `use_figma` in the Foundations file, and the designer publishes the library update.
- Low fidelity keeps working, since the new modes alias primitives and the primitives switch with `01_Fidelity`.
- How many modes a collection may have depends on the plan. **Extended collections**, which Figma's skills recommend for brand themes, would let a work file override the Foundations without a copy, but they're Enterprise only. Modes in the team's copy work on any plan that publishes libraries.
- The brand role differs between Figma and CSS today. A theme sets it explicitly, so the two agree.

## 5. Figma designs from composed screens

1. The designer iterates in HTML with `render_page` and `render_composition`, as today.
2. They ask for the screen in Figma. A prompt, `create_figma_design`, carries the workflow:
   - the final composition tree and the kit map;
   - then Figma's `figma-generate-design` workflow: a wrapper frame, one section per `use_figma` call, kit instances with their variant properties set from our options, text overrides, auto layout, and KERN's variables for spacing and colour.
3. Optionally in parallel, as Figma's skill recommends: `html_to_figma` or `generate_figma_design` on the same page, as a pixel reference to compare against and then delete.

What we build:
- **The kit map:** our component and option values to the kit's component, variant property and value, with its text properties. Code-owned, served as a resource the prompt links to, and tested against the bundle's `options` and the kit's components in the bundle ([F11](#f11-a-kiwi-capture-is-a-full-offline-snapshot)).
- **The prompt,** with cases in `prompts.test.ts`; `names.test.ts` checks the tools and URIs it names.
- **Later, if evals show the need:** a tool that flattens a composition into a list of frames, kit components, variant properties and texts, so the assistant transcribes instead of translating.

Risks: Figma's write access is in beta. One section per call is slow on big pages, and every call counts against the designer's budget ([F10](#f10-figmas-mcp-server-limits-reading-too)). `use_figma` can't fetch images; Figma's skill takes them from a capture of the page.

### The kit map, first draft

Drafted from the kit's components ([F8](#f8-the-kit-is-two-community-libraries-and-each-team-publishes-its-own-copy)). Property names are given without their IDs.

| Block | Kit component | Set from our options |
|---|---|---|
| `button` | `button-{variant}`, plus `-{size}` unless the size is default | `state=default`; `icon`: `left` or `right`, `only` when the label is sr-only, otherwise `none`; `✏️ label`; `↳ icon-type` |
| `badge` | `badge` | `type`; `✏️ label`; `icon` |
| `field` (text, email, tel, url, password, number, date, file, select, textarea) | `input-text`, `input-e-mail`, `input-tel`, `input-url`, `input-password`, `input-number`, `input-date`, `input-file`, `input-select`, `input-textarea` | `error`; the label and hint sit in a nested `form` instance, not read yet |
| `field` (radio, checkbox group) | `input-radios`, `input-radios-horizontal`, `input-checkboxes` | `✏️ legend`, `✏️ hint`, `✏️ error`, `optional`, `legend-type` |
| `fieldset` | `fieldset` | the same, with `component` as the slot |
| `card` | `card-{size}`, plus `-interactive` with an `href` | `✏️ preline`, `✏️ title`, `✏️ subline` and their booleans; `media`; `action bar`; `stretch`; `surface` |
| `summary` | `summary-group` of `summary` | `number` |
| `formFlow` | `task-list`, `progress`, buttons | `task-list` `type=aufgabengruppe`, or `zusammenfassung` for the summary step |
| `grid` | `row` | `layout`, one of 13 fixed splits (`12`, `6-6`, `4-8`, …), and `device`; only some equal splits exist |
| `section` | `section` | none |
| `text` | `body-default` | `weight` |
| `disclosure` | none yet: the Accordion page has only `accordion-group` and a prototype | |
| `html` | `placeholder` | |
| the page | `page`, `kopfzeile` | `device`; `fluid` |

## 6. Click dummies

Two forms:

1. **A Figma prototype.** One frame per `formFlow` step, built as in [section 5](#5-figma-designs-from-composed-screens). Each step's Back and Next buttons get prototype links to the neighbouring frames (`setReactionsAsync` through `use_figma`); the summary step links back to each step it summarises. Figma's skills don't cover prototype links, so the prompt carries the steps.
2. **An HTML click dummy.** `render_page` with `formFlow` and `renderAllSteps`, plus a small script that switches steps. It has KERN's real CSS and behaviour and takes a theme. `send_code_to_figma` can put it into Figma as a runnable code layer.

The Figma prototype also comes as a wireframe: with `01_Fidelity` set to Low on its frames, it turns grey and uses the wireframe typeface. The kit recommends that for early user tests ([F9](#f9-figmas-variables-are-kerns-css-variables-layer-for-layer)).

Pages that aren't one form flow need navigation between screens, which our compositions don't describe. First, the prompt takes a list of screens and transitions ("the 'Weiter' button on screen 1 goes to screen 2"). A schema for flows waits until that proves useful.

## 7. Asks for the packer

`foundations/tokens.json` (K4 in the [knowledge-bundle design](v2-migration/knowledge-bundle.md#8-phases)), extracted from kern-ux-plain's SCSS:
- **primitives:** each ramp step with its OKLCH value;
- **roles:** each semantic colour role with its light and dark alias, its group (layout, action, form input, feedback, decorative), and whether KERN excludes it from theming;
- **contextual:** each contextual variable with the role it takes per level;
- **other variables:** spacing, sizes and typography, with their values;
- **the theme selectors** KERN's themes use, so a theme can be written against them.

`figma/` documents from a capture of the two Figma libraries, the Design-Kit and the Foundations, as a fourth source ([F11](#f11-a-kiwi-capture-is-a-full-offline-snapshot)):
- **components:** name, page, description, variant axes, and the text, boolean and instance-swap properties, including those of nested instances;
- **variables:** collection, modes, name, scopes, and per mode a value or an alias;
- **text styles;**
- **the library version**, such as 2.4.0, so a test can name the kit it checks against.

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

1. **The kit:** mostly answered by F8 to F11. Its names follow kern-ux.de, and its semantic variables alias the primitives as in CSS. Still open: the labels and hints inside the fields' nested instances, which `row` layouts our equal columns map to, and the Foundations' full list of variables. If confirmed, decision 6 changes: the list comes from a capture of the kit, not from the maintainer.
2. **Copy or linked library:** both. Teams publish their own copy of each library and link those ([F8](#f8-the-kit-is-two-community-libraries-and-each-team-publishes-its-own-copy)). Extended collections are Enterprise only, so a theme becomes modes in the team's Foundations. Still open: do teams let designers add modes there?
3. **Feedback colours** (danger, warning, success, info): fixed, or a role group a theme may move? Fixed is the proposal, since they carry meaning.
4. **The listing trim** for `create_theme`: the shared `strict` description is the candidate.
5. **Click dummies:** the Figma prototype, the HTML one, or both?
6. **Testing against Figma:** our eval runs headless Claude Code against our server only. Checking Figma output needs the remote server, a test file, and a Full or Dev seat on a paid plan: a View seat's 20 calls a month don't cover even one read of the kit ([F10](#f10-figmas-mcp-server-limits-reading-too)). Which account?
7. **`html_to_figma`:** does it take our page as it is, loading KERN's CSS from jsDelivr, or does it need the CSS inline? `kern.min.css` is 350 KB, too big to pass as a tool argument. Not offered to the account used so far, so untested.
8. **The brand colour:** Figma's `decorative/brand/default` is darkblue, CSS's is neutral. Which counts as KERN's default for us, and do we tell the KERN team about it and about the level-0 typo?

## 10. Order of work

Each step can be released on its own:

| Step | Repo | What | Needs |
|---|---|---|---|
| K-F | packer | The Figma capture as a source: `figma/` components and variables ([section 7](#7-asks-for-the-packer)) | a capture of both libraries; the decoder's property definitions and nested instances |
| T0 | packer, then here | `tokens.json`; `get_tokens` from the bundle; a test that every `--kern-*` name in our source exists | — |
| T1 | here | `kern://guides/theming`, `create_theme` with its checks and its Figma modes, the theme option of `render_page` | T0, a listing trim |
| F1 | here | The kit map and its test against the bundle's `figma/` | K-F |
| F2 | here | `create_figma_design` | F1, a test account with a Full seat |
| F3 | here | Click dummies: frames and prototype links, the low-fidelity variant; the HTML step script | F2 |
| F4 | here | Themes in Figma: the modes from `create_theme` applied in a Foundations copy, and a test that every Figma name `create_theme` returns exists | T1, K-F, a test account |

K-F and T0 don't depend on each other and can run side by side. A test account is needed only from F2 on.

## Sources

- KERN: `@kern-ux/native` 2.8.2 from npm (`src/scss/core/tokens`, `layers/_levels.scss`, `src/scss/themes/README.md`); the bundle's `foundations/branding-usage.json`, `colour-systematic.json` and `layering.json`.
- Figma: [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) (`skills/figma-generate-design`, `figma-use`, `figma-code-workflows`); [Guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server); [Write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/); [Rate limits and access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/); [Modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables).
- The kit: [KERN 2 Design-Kit (Community)](https://www.figma.com/design/UcsH2HANhmoU2OvwJkN7mI/KERN-2-Design-Kit--Community-) 2.4.0, read with `use_figma` on 2026-10-15; the maintainer's kiwi capture of it from 2026-10-10.
- The rejected aria route: `@angular/aria` 22.2.3 and `react-aria-components` 1.22.1 from npm; the [Angular Aria overview](https://github.com/angular/angular/blob/main/adev/src/content/guide/aria/overview.md).
