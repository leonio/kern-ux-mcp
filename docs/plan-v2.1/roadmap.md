# 2.1: skills, and the server as the KERN tooling between Figma and code

Status: discovery and roadmap, written on 2026-11-15. The decisions in [section 7](#7-decisions) were confirmed the same day as recommended. The first step is [A0](a0-kickoff.md); [section 8](#8-open-questions) has the questions still open.

## 1. The goal

1. **Skills.** The server's workflows become [Agent Skills](https://agentskills.io/specification): served over MCP's Skills extension, and shipped as files for the clients that don't load MCP skills yet. In a client with skills, the assistant picks the KERN workflow itself ("build a form for …", "put this screen in Figma"), where today the user has to start a prompt by name.
2. **Figma and code.** The server is the KERN tooling in both directions: code to Figma (built on `feat/figma-designs`), and Figma back to KERN HTML (new). Web Components start as a skill on top of the HTML.
3. **A minor release.** Nothing a 2.0 client uses goes away in 2.1. What skills make redundant is deprecated in 2.1 and removed in 3.0 ([section 4](#4-what-goes-and-what-stays)).

## 2. What we start from

Findings in the discovery format: where, problem or facts, proposal, risk.

### S1. Skills over MCP is a finished extension, at Beta

- **Where:** [SEP-2640](https://modelcontextprotocol.io/seps/2640-skills-extension), Final on 2026-09-13; the spec in [ext-skills](https://github.com/modelcontextprotocol/ext-skills), `specification/beta/skills.mdx`, moved from "stable" to "beta" on 2026-10-29 with no change on the wire.
- **Facts:**
  - Each file of a skill is an ordinary resource at `skill://<skill-path>/<file-path>`. The last segment of the skill path is the skill's `name`.
  - A server that declares `io.modelcontextprotocol/skills` implements `skills/list` and `skills/get`. An entry carries the `SKILL.md` frontmatter verbatim and every file of the skill with its `sha256:` digest and size. `resources/directory/read` is optional, behind `directoryRead`.
  - Limits per skill: 512 files, 16 MiB. On `2026-07-28` the results carry `ttlMs` and `cacheScope`.
  - Hosts fetch files only when needed, verify each against its digest, show which server a skill came from, ignore `allowed-tools` from an MCP skill unless the user grants it, and never let an MCP skill shadow a local one of the same name.
  - A server may point at skill URIs from its `instructions`, which needs nothing from the host.
- **Proposal:** serve our skills through it. They don't count against the tool listing.
- **Risk:** Beta allows breaking changes, logged in the extension's decision log.

### S2. The SDK has it since 2.4.0, and we're on 2.1.0

- **Where:** `@modelcontextprotocol/server` 2.4.0 (2026-10-23), subpaths `ext/skills` and `ext/skills/node`; [package.json](../../packages/core/package.json) asks for `^2.1.0`, and the lock file has the server at 2.1.0. On `main`, Renovate moved only the client to 2.4.0 (`b91f794`).
- **Facts:**
  - `SkillsExtension.load(memorySkillFiles(files), { prefix, cacheHint, strict })` builds a catalog with digests and sizes from an in-memory record. `catalog.attach(server)` registers the `skill://` template, `skills/list`, `skills/get` and `resources/directory/read`, and declares the capability. `attach` is marked experimental.
  - One catalog serves any number of servers. That fits [catalog.ts](../../packages/core/src/mcp/catalog.ts), built once per process, and the HTTP host's server per request.
  - Its catalogs put only each `SKILL.md` in `resources/list`. It serves `2025-11-25` and `2026-07-28`.
- **Proposal:** update the SDK to 2.4 as a step of its own, then build the catalog from `memorySkillFiles` over files esbuild inlines. stdio, the `.mcpb` and the container then serve the same bytes, with no skill files on disk.
- **Risk:** `attach` can change in a minor release. One file of ours calls it.

### S3. Our target clients don't load MCP skills yet

- **Where:** the [extension client matrix](https://modelcontextprotocol.io/extensions/client-matrix); [microsoft/vscode#338300](https://github.com/microsoft/vscode/issues/338300); the [Claude Code changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) up to 2.1.325, read on 2026-11-15.
- **Facts:**
  - **VS Code:** in Insiders since 2026-11-04 (milestone 1.146), behind `chat.agentHost.mcpSkills.enabled`, and only in Copilot's agent host sessions. Regular Chat is tracked separately.
  - **Claude Code and Claude Desktop:** not in the changelog. Secondhand, from a third-party issue: "very soon", said at MCPCon NA on 2026-10-22. Claude Code reads MCP resources with its resource tools, but doesn't register them as skills ([anthropics/claude-code#38253](https://github.com/anthropics/claude-code/issues/38253)).
  - **Both load Agent Skills from files today:** Claude Code from `.claude/skills` and plugins; VS Code from `.github/skills` and `.claude/skills`; Claude Desktop and claude.ai from an uploaded skill.
- **Proposal:** one source, three deliveries ([section 3.2](#32-one-source-three-deliveries)).
- **Risk:** served only over MCP, the skills would reach no user of 2.1.

### S4. Figma does this already, and expects design-system skills on top

- **Where:** Figma's MCP server, its instructions and the `get_figma_skill` tool's schema, read on 2026-11-15 without a call; Figma's help: [Create Skills for the Figma MCP server](https://help.figma.com/hc/en-us/articles/42495326765591-Create-Skills-for-the-Figma-MCP-server), [Use skills with the Figma MCP server](https://help.figma.com/hc/en-us/articles/39287396773399-Use-skills-with-the-Figma-MCP-server); [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide).
- **Facts:**
  - Figma serves its skills as `skill://figma/<name>/SKILL.md` with an index at `skill://index.json`, plus a tool, `get_figma_skill`, that reads them for clients without resource reading. Its instructions say to prefer the skills of the Figma plugin and fall back to the ones its server serves.
  - `figma-use` is to be loaded before every `use_figma` call. `use_figma` takes `skillNames` for logging, with `resource:` in front of a skill loaded over MCP.
  - Figma's advice for custom skills: work alongside `figma-use`, search the team's libraries first, use the library's variables and real components, make skills with big changes manual-only (`disable-model-invocation`), and test on a copy of the file.
- **Proposal:** our Figma skills are such design-system skills, for the KERN kit. They name Figma's skills and tools and don't copy them.
- **Risk:** in a host that follows the spec, a skill from our server can't read Figma's skill resources without the user's approval (a read across servers). Ours tells the model to load `figma-use` through Figma's plugin or `get_figma_skill`.

### S5. Resources aren't read on their own: skills do that job

- **Where:** [history.md](../v2-migration/history.md), R6: "Resources aren't read on their own"; [guides.ts](../../packages/core/src/resources/guides.ts), [component-cards.ts](../../packages/core/src/resources/component-cards.ts).
- **Facts:** with Claude Code's resource tools, Haiku never listed resources or read a guide. It read a card only through `get_component_docs`'s `resource_link`. A guide reaches a model only when a prompt embeds it or a person attaches it.
- **Proposal:** the guides' content becomes reference files of the skills, read when the skill needs them. The component cards stay resources: reference data per component, reached through the tool path that works.
- **Risk:** removing the guide URIs breaks a user's saved `@`-mention; hence a deprecation first.

### S6. The prompts are the workflows; skills are the same workflows, chosen by the model

- **Where:** [packages/core/src/prompts](../../packages/core/src/prompts): `create_input_form`, `create_page_layout`, `review_kern_html`, `create_figma_design`. R7: with the prompts 12 of 12 answers were verbatim, against 3 of 12 without.
- **Problem:** a prompt only works when the user starts it, by name and with arguments. "Put this in Figma" doesn't start `create_figma_design`.
- **Proposal:** each prompt's workflow becomes a skill. The prompt stays, and returns its skill's text with the arguments filled in, so each workflow has one source.
- **Risk:** wording that works when the user starts it may not work when the model chooses to load it. The eval decides ([section 6](#6-measuring)).

### S7. The listing has 599 characters of room, and skills won't make more

- **Where:** `pnpm listing:sizes` on 2026-11-15: 119,401 of 120,000 characters in 55 tools, of which descriptions are 12,636 and input schemas 103,607.
- **Facts:** skills cost nothing in the listing. Moving guidance out of descriptions into skills would save little, since nine tenths of the listing are schemas.
- **Proposal:** no tool for skills. A skill-reading tool like Figma's `get_figma_skill` only if the eval shows models missing the skills in clients without them, and after a trim. New Figma tools need a trim first too.

### S8. Figma back to KERN HTML is missing, and it's the half a View seat can test

- **Where:** [packages/core/src/ux/figma](../../packages/core/src/ux/figma): HTML to a kit plan to a `use_figma` script, built and not yet run in a real file. That run (F2b in [figma-and-theming.md](../figma-and-theming.md#10-order-of-work)) needs a Full seat. Reading with `use_figma` works with the maintainer's View seat, at 20 calls a month.
- **Problem:** a designer's screen in Figma comes back only through Figma's `get_design_context`, which writes generic code, not KERN's markup or our blocks.
- **Proposal:** the reverse of `plan_figma_design`. A read-only `use_figma` script walks a frame and returns each kit instance's component name, variant and properties, with the text, as JSON. The kit map in reverse ([kit.ts](../../packages/core/src/ux/figma/kit.ts)) turns that into `render_page` blocks, which render and validate as usual. One `use_figma` call per frame.
- **Risk:** detached instances and layers that aren't from the kit become placeholders or `html` blocks.

### S9. Code Connect would make Figma's own output speak KERN, on an Organization plan

- **Where:** [Code Connect](https://developers.figma.com/docs/code-connect), its [HTML guide](https://developers.figma.com/docs/code-connect/html) (HTML, Web Components, Angular, Vue); available on Organization and Enterprise plans with a Full or Dev seat.
- **Proposal:** later, and not in 2.1: generate Code Connect HTML templates for the kit's components from `kit.ts` and our templates, for teams on those plans. Then `get_design_context` returns KERN HTML for kit instances.

### S10. KERN has a community Web Components kit

- **Where:** [`@kern-ux-annex/webc`](https://gitlab.opencode.de/kern-ux/community/kern-webcomponents-light-kit) 3.5.0 (2026-11-05, EUPL-1.2), the "KERN WebComponents-Light-Kit": over 100 `kern-*` elements in Lit, shadow DOM, styles from `@kern-ux/native` 2.8.2, and a `kern-editor-manifest.json`. A community project: the KERN team isn't responsible for it. Also KoliBri, the federal web components, with `@public-ui/theme-kern` 4.5.0. `@dataport/kern-ux-web-components` stopped at 0.1.0 in 2025.
- **Problem:** "Web Components" can mean three things: our HTML inside the user's own custom elements, markup for the webc kit, or markup for KoliBri. The second and third are third-party libraries, which by our decisions come from the packer as a source and get tools of their own, as K5 plans for React.
- **Proposal:** 2.1 does the first, as a skill: KERN HTML in a custom element, in the light DOM, or in a shadow root with KERN's stylesheet adopted, checked with `validate_html`. The webc kit as an output target is a packer source and a later step, if wanted ([decision 6](#7-decisions)).
- **Risk:** a shadow root shuts KERN's global CSS out. The skill has to say that first.

## 3. The design

### 3.1 The skills

| Skill | Made from | Use it to | Our tools | Other servers |
|---|---|---|---|---|
| `kern-forms` | `create_input_form`, the forms guide | build a form or a multi-step wizard | `render_composition`, `render_page`, `validate_html` | |
| `kern-page-layout` | `create_page_layout`, the layout guide | build a whole page | `render_page` | |
| `kern-review` | `review_kern_html`, the accessibility guide | check and fix given HTML | `validate_html`, the render tools | |
| `kern-figma-design` | `create_figma_design` | build a screen in Figma from the kit | `plan_figma_design` | Figma: `search_design_system`, `use_figma`, `get_screenshot` |
| `kern-from-figma` | new ([S8](#s8-figma-back-to-kern-html-is-missing-and-its-the-half-a-view-seat-can-test)) | turn a Figma frame into KERN HTML | `render_page`, `validate_html` | Figma: `use_figma` (read only) |
| `kern-web-components` | new ([S10](#s10-kern-has-a-community-web-components-kit)) | put KERN HTML into custom elements | the render tools, `validate_html` | |

Later: `kern-theme` with T1, instead of the `kern://guides/theming` resource [figma-and-theming.md](../figma-and-theming.md#where-it-lives) planned, and `kern-click-dummy` with F3.

The source, at the repo's root:

```
skills/
  kern-forms/
    SKILL.md              written by hand: when to use it, the workflow, the answer
    references/forms.md   generated: what our tools do, and KERN's rules (today's guide)
  kern-from-figma/
    SKILL.md
    references/kit-map.md       generated from kit.ts: kit component to block kind and fields
    references/read-frame.js    the read-only use_figma script
  …
```

- **Frontmatter:** `name`, a `description` written as a routing rule (when to use it, and what to use instead), `license: EUPL-1.2`. Every skill can be chosen by the model; whether `kern-figma-design` should be manual-only is [open question 7](#8-open-questions).
- **Tools by bare name** (`render_page`), "from the KERN UX MCP server": the prefix a client adds depends on the name the user gave the server.
- **Generated references** come from code and the bundle with `pnpm skills:build`, checked in so changes arrive as diffs, with a test that fails when they're stale. KERN's text still comes only from the bundle, as for the guides today.
- **Checks:** `names.test.ts` covers the skills: every tool name and `kern://` URI exists, and every relative link is a file of the skill. A test holds each skill to the Agent Skills naming rules and the extension's limits.
- **No arguments:** the page's text follows the user's language, German when it's unclear, as the prompts' `locale` does.

### 3.2 One source, three deliveries

1. **Over MCP:** `skill://kern-forms/SKILL.md` and its files, from the SDK's catalog, attached in [create-server.ts](../../packages/core/src/mcp/create-server.ts) with the release cache hint. A host with the extension lists them next to our tools. Hosts without it still see each `SKILL.md` in `resources/list`, so VS Code's context picker offers it.
2. **As files:** the same folder as
   - a Claude Code plugin with a marketplace in this repo, which installs the server and the skills together, as Figma's plugin does;
   - a zip per skill on each GitHub release, for Claude Desktop and claude.ai;
   - for VS Code, a copy into `.github/skills`, or an install command if one works with our layout ([section 8](#8-open-questions)).
3. **Without skills:** the prompts, generated from the skills ([S6](#s6-the-prompts-are-the-workflows-skills-are-the-same-workflows-chosen-by-the-model)), and a short `instructions` text that names each skill's URI and says to prefer the plugin's copy, as Figma's does. Claude Code can read those URIs with its resource tools.

### 3.3 Figma: our server plans, Figma's draws, and back

Decision 2 of [figma-and-theming.md](../figma-and-theming.md#8-decisions-2026-10-15) holds: our server never calls Figma.

- **Code to Figma:** the `kern-figma-design` skill, with `plan_figma_design` as built. The skill tells the model to load `figma-use` first and name it in `skillNames`.
- **Figma to code:** the `kern-from-figma` skill ([S8](#s8-figma-back-to-kern-html-is-missing-and-its-the-half-a-view-seat-can-test)). It starts without a tool: the read script and the kit map in reverse are skill files, which cost no listing. If the model maps unreliably, a deterministic tool takes the script's JSON and returns blocks, after a listing trim. The script runs in Figma's plugin sandbox, not on the user's machine.
- **Themes and click dummies:** T0, T1, F3 and F4 as [planned](../figma-and-theming.md#10-order-of-work), with their guidance as skills.
- **Writing to a real file** is still gated by F2b, which needs a Full seat. Reading can be tried with the View seat: one call per frame.

### 3.4 HTML and Web Components

- HTML stays the output every tool writes.
- 2.1: the `kern-web-components` skill ([S10](#s10-kern-has-a-community-web-components-kit)).
- Later, if decision 6 says so: the webc kit or KoliBri as a target, a packer source first, then tools.

## 4. What goes and what stays

| Today | 2.1 | 3.0 |
|---|---|---|
| `kern://components/{id}`, 48 cards | stays; `get_component_docs` and the skills link to it | stays |
| `kern://guides/forms`, `/layout`, `/accessibility` | the content moves into the skills' `references/`; the URIs serve the same files, with "deprecated" in their description | removed |
| 4 prompts | stay; generated from the skills, each returns its skill with the arguments | looked at again, by how many clients load skills by then |
| the planned `kern://guides/theming` | not built; `kern-theme` instead | |
| tools | unchanged; no skill tool | candidates: `get_tokens` (its names are stale, [F5](../figma-and-theming.md#f5-the-token-data-isnt-in-the-bundle)), and the fallback tools of docs-only components (`get_layers`, `get_search`, `get_details`, `get_pattern`), whose guidance fits a card or a skill |

Removing a resource, prompt or tool is a breaking change, so each 2.1 deprecation gets an entry in the migration notes, and 3.0 does the removals.

## 5. Steps

Each step ends in a state that could be released. Each step starts with a kickoff in this folder: [A0](a0-kickoff.md) first.

| Step | What | Needs | Measured by |
|---|---|---|---|
| **A0** | The branch ([decision 7](#7-decisions)); the SDK to 2.4; nothing a client sees changes | | e2e on both protocol eras, the listing snapshots unchanged |
| **A1** | The skills source: `skills/`, `skills:build`, the tests; `kern-forms`, `kern-page-layout` and `kern-review` from the prompts and guides | A0 | the eval's new `skills` suite against `prompts`, on the same commit |
| **A2** | Skills over MCP: the catalog in `createKernServer`, cache hints, the `instructions` pointer | A1 | e2e for `skills/list`, `skills/get` and `resources/read` against the digests, on both eras; the MCP Inspector's skill check |
| **A3** | Prompts from the skills; the guide URIs serve the skill files, deprecated | A1 | the `prompts` suite against the `prompts-r7-*` reports |
| **A4** | Skills as files: the plugin and marketplace, the release zips, the README and a wiki page | A1 | the client check: Claude Code plugin, VS Code `.github/skills` and the Insiders flag, a Claude Desktop upload |
| **F6** | `kern-figma-design` from `create_figma_design` | A1 | the prompt's tests; no Figma in the eval |
| **F7** | Figma to KERN: the read script, the reverse kit map, `kern-from-figma` | A1; a few View-seat calls | the eval on recorded frames |
| **W1** | `kern-web-components` | A1 | an eval scenario: a Lit element with a KERN form |
| **R** | The release: migration notes for 2.1, the client check, then condense this folder | the steps chosen | |

F2b, T0 to F4 and K-F stay as [planned](../figma-and-theming.md#10-order-of-work). The proposal for 2.1.0: A0 to A4, F6, W1 and the Figma work already on the branch. F7 if the View-seat test works out, otherwise 2.2.

## 6. Measuring

- **A `skills` suite** in [tools/eval](../../tools/eval): the `prompts` suite's tasks in their own words, with `skills/` copied into the run's project as `.claude/skills`. The runs need the `Skill` tool, and without `--disable-slash-commands`, which may turn skills off. Check that first.
- **Compared on one commit:** `prompts`, `skills`, and `--without-prompts`. New checks: the skill was loaded, the answer is verbatim, the HTML is strictly valid.
- **When Claude Code loads MCP skills:** the same suite with the skills served only by the server.
- **Figma:** recorded read-script output as fixtures for F7. A live Figma run stays a manual check (open question 6 of [figma-and-theming.md](../figma-and-theming.md#9-open-questions)).

## 7. Decisions

Confirmed by the maintainer on 2026-11-15: the recommended column.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| 1 | How skills reach users | over MCP and as files, both in 2.1 ([S3](#s3-our-target-clients-dont-load-mcp-skills-yet)) | over MCP only, and wait for the clients |
| 2 | The prompts | stay in 2.1, generated from the skills | remove them in 2.1 |
| 3 | The guide resources | deprecated in 2.1, removed in 3.0 | removed in 2.1, called out in the release notes |
| 4 | A skill-reading tool, like `get_figma_skill` | none, unless the eval asks for it | one now, after a listing trim |
| 5 | Names and URIs | `kern-*` names, `skill://kern-forms/SKILL.md`, no prefix | a prefix: `skill://kern-ux/kern-forms/SKILL.md` |
| 6 | Web Components in 2.1 | the `kern-web-components` skill only | the webc kit, or KoliBri, as an output target (packer first) |
| 7 | The branch | build 2.1 on `feat/figma-designs` and release once; `plan_figma_design` ships documented as not yet run in a real file | release the Figma work alone as 2.1, skills as 2.2; or hold the Figma tool back until F2b |
| 8 | Figma to KERN | a skill with the read script and the reverse kit map; a tool only if the eval asks for one | a tool from the start |

## 8. Open questions

1. When Claude Code serves MCP skills, does it list a skill twice when the plugin has the same one? The `instructions` say to prefer the plugin's copy; a client check after its release.
2. Does an install command such as `npx skills add` work with a `skills/` folder at our root, and does VS Code install Claude Code plugins? Both to verify in A4.
3. Can an `.mcpb` carry skills for Claude Desktop? If not, the release zip is the way.
4. Does the `instructions` pointer change what a model does in Claude Code and VS Code? Measure in A2.
5. Which account runs F2b ([figma-and-theming.md](../figma-and-theming.md#9-open-questions), question 6)? Still open.
6. The extension is Beta and the SDK's `attach` experimental: who watches the decision log? Renovate brings the SDK; the e2e tests catch the wire.
7. Figma advises manual-only skills (`disable-model-invocation`) for big changes to a file. `kern-figma-design` only adds a frame, replacing one of the same name, and the model choosing it is the point of a skill. Manual-only would make it a prompt again.

## Sources

- MCP: [SEP-2640](https://modelcontextprotocol.io/seps/2640-skills-extension); [ext-skills](https://github.com/modelcontextprotocol/ext-skills) and its [implementations list](https://github.com/modelcontextprotocol/ext-skills/blob/main/docs/implementations.md); the [extension client matrix](https://modelcontextprotocol.io/extensions/client-matrix); [typescript-sdk#3047](https://github.com/modelcontextprotocol/typescript-sdk/pull/3047) and the 2.4.0 type definitions; API Evangelist: [Skills over MCP is now officially Beta](https://apievangelist.com/2026/10/29/skills-over-mcp-is-now-officially-beta/).
- Clients: [microsoft/vscode#338300](https://github.com/microsoft/vscode/issues/338300); [anthropics/claude-code#38253](https://github.com/anthropics/claude-code/issues/38253) and the [Claude Code changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md).
- Figma: [Create Skills for the Figma MCP server](https://help.figma.com/hc/en-us/articles/42495326765591-Create-Skills-for-the-Figma-MCP-server); [Use skills with the Figma MCP server](https://help.figma.com/hc/en-us/articles/39287396773399-Use-skills-with-the-Figma-MCP-server); [figma-use](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-use/SKILL.md); [Code Connect](https://developers.figma.com/docs/code-connect) and its [HTML guide](https://developers.figma.com/docs/code-connect/html).
- KERN: `@kern-ux-annex/webc` 3.5.0's README; `npm search @kern-ux` on 2026-11-15.
- This repo: [figma-and-theming.md](../figma-and-theming.md), [v2-migration/README.md](../v2-migration/README.md), [history.md](../v2-migration/history.md), `pnpm listing:sizes`.
