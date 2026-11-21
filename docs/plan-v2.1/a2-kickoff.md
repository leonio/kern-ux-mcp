# A2: skills over MCP

Status: kickoff, written on 2026-11-21; group 1 started the same day. Step A2 of the [2.1 roadmap](roadmap.md#5-steps), after [A1](a1-kickoff.md).

## The task

Serve the three skills from A1 over MCP's Skills extension, from every host (stdio, HTTP, the `.mcpb` and the container), and point models to them:

- the server's `instructions`, which every client gets, name the skills;
- since A1 showed that a description alone gets a skill loaded only about half the time, the tools a model calls when it skips the skill name it too, if the eval says it helps.

The prompts and the guide URIs don't change; A3 does them. The skills as files (the plugin and the release zips) are A4.

## What we start from

- **The SDK is 2.4.0** since A0, on both sides:
  - `SkillsExtension.load(files, { prefix, cacheHint, strict, onWarning })` is **async**. It returns a `SkillCatalog` with the digests and sizes.
  - `catalog.attach(mcp)` is sync, must run before the server connects, and is marked experimental. It registers the `skill://{+path}` template, whose list puts each `SKILL.md` in `resources/list`, plus `skills/list`, `skills/get` and `resources/directory/read`, and it declares the capability.
  - One catalog can be attached to any number of servers.
  - The cache fields (`ttlMs`, `cacheScope`) go out on `2026-07-28` only.
  - On the client side, `SkillsClient` (`@modelcontextprotocol/client/ext/skills`) lists, gets, and reads files. A read checks the file against its digest and throws `SkillVerificationError` on a mismatch.
- **Our server:**
  - `createKernServer` is sync. It's called per connection on stdio and per request on HTTP (`createMcpHandler`).
  - `getCatalog()` builds the tools, resources and prompts once.
  - Each list method has `RELEASE_CACHE_HINT` (an hour, public).
  - **There are no `instructions` today.**
- **The files live at the repo root, in `skills/`:**
  - six files, 36,853 bytes;
  - outside `packages/core`;
  - not in any bundle.
  
  The bundles inline code. The standalone bundle (the `.mcpb` and the container) has no `node_modules` and no files beside it.
- **The listing** is 119,401 of 120,000 characters, so 599 are left. `render_page`'s description is 290 characters, `validate_html`'s 177 and `render_composition`'s 2,642.
- **What A1 measured:**
  - The right skill loaded in 4 to 8 runs of 12.
  - In the 18 runs that loaded it, the answer was verbatim every time.
  - Claude Code's own system prompt didn't help.
  - Still unknown: whether Claude Code passes a server's `instructions` to the model when the eval replaces the system prompt.

## The design

### The files in the bundle

`pnpm skills:build` writes one more file:

- **The file:** `packages/core/src/skills/files.generated.ts`.
- **What's in it:** `SKILL_FILES`, every file of `skills/` keyed by its path (`kern-forms/SKILL.md`, …), as strings.
- **The check:** the folder test already fails when a reference is stale, and it fails the same way when this module is.

Tests, `tsx`, `dist/` and the standalone bundle then all serve the same bytes, with no loader and no file reads.

The bundle carries the guides' text twice until A3, about 31 KB: once from the guide builder, once in the files. A3 serves the guide URIs from the files.

### Loading and attaching

- **`loadKernSkills()`** goes in `packages/core/src/skills/catalog.ts`. It runs `SkillsExtension.load(memorySkillFiles(SKILL_FILES), { strict: true, cacheHint: RELEASE_CACHE_HINT })` once and keeps the promise.
- **The hosts await it at startup, next to `getCatalog()`:**
  - stdio before `serveStdio`;
  - HTTP before it listens.
  
  A broken skill then fails the start, not the first request.
- **`createKernServer({ version, skills })`** attaches the catalog. `skills` is required, so a host can't leave it out; the tests get it from a helper.
- **No prefix:** the URIs are `skill://kern-forms/SKILL.md` and so on ([roadmap decision 5](roadmap.md#7-decisions)).

### The instructions

A short text, built from the skills folder, that names each skill with its URI. The draft:

> KERN UX: tools that render KERN UX markup and check it strictly. Before you build, load the matching skill: kern-forms for a form or a multi-step form, kern-page-layout for a whole page (with kern-forms for a form on it), kern-review for HTML to check or fix. Over MCP they're skill://kern-forms/SKILL.md, skill://kern-page-layout/SKILL.md and skill://kern-review/SKILL.md; where they're installed as files, use those.

- **Names, not only URIs:** a name works whichever way the skill reached the client. The URIs serve hosts that read resources.
- **`names.test.ts`** covers it: every skill and URI it names exists.

### Pointers in the tools

Each pointer is one sentence, added to a tool's description:

| Tool | Sentence |
|---|---|
| `render_page` | "For a whole page, load the kern-page-layout skill first, if your client has it." |
| `render_composition` | "For a form, load the kern-forms skill first, if your client has it." |
| `validate_html` | "To check and fix given HTML, load the kern-review skill first, if your client has it." |

- **What they cost:** about 250 characters of the 599 left.
- **Kept only if they help:** the `skills` suite has to improve on the instructions alone, and `prompts` has to keep its 12 of 12.
- **Risk:** a client without skills reads a name it can't load. "If your client has it" says so.

### The checks

- **`create-server.test.ts`:**
  - the capability under `extensions`;
  - `skills/list` with the three skills;
  - every file read through `SkillsClient`, which checks its digest;
  - the three `SKILL.md` in `resources/list` and the template in `resources/templates/list`;
  - the cache fields on `2026-07-28` only.
- **e2e for stdio and HTTP:** the same over the wire, on both eras, against the built bundle. CI runs it in the packed install too.
- **The snapshots:**
  - the resource listings and `server/discover` change, and the review reads that change;
  - the tool listing changes only with the pointers.
- **By hand, recorded in A2's record:**
  - the MCP Inspector's skill view;
  - VS Code Insiders with `chat.agentHost.mcpSkills.enabled`, if the maintainer has it: the first real host.

### The eval

1. **A probe first:** does the model see the server's `instructions` in the eval's setup?
   - How: one run that asks the model to quote them, once with the eval's system prompt and once with `--append-system-prompt`.
   - Cost: about $0.05.
   - If it doesn't see them, the suite can't measure them in Claude Code, and the record says so.
2. **`skills` on the instructions commit**, against `a1-skills-fix2`. The eval's skills still come from files; the instructions name them, so this measures the pointer, not delivery over MCP.
3. **`skills` and `prompts` on the pointers commit.**

That's three runs a scenario each time, about $3 in all.

**The bar:** the right skill loads in every run, as in A1. If it doesn't, the record says how close the runs got and which pointer helped; nothing that doesn't help stays.

## Decisions to confirm

Confirmed by the maintainer on 2026-11-21: the recommended column.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| A2.1 | How the files reach the bundles | a generated module, `files.generated.ts`, written by `skills:build` and checked for staleness | esbuild's text loader, with file reads in tests and `tsx` |
| A2.2 | The async load | `loadKernSkills()` awaited at each host's start; `createKernServer` takes the catalog as a required option | entries computed at build time and a sync `SkillSource` of our own, which repeats what the SDK's catalog does |
| A2.3 | What the instructions name | each skill by name and URI, built from the folder | the URIs only, as the roadmap's S1 put it |
| A2.4 | Pointers in tool descriptions | one sentence each on `render_page`, `render_composition` and `validate_html`, kept only if the eval says so | none in 2.1; the instructions only |
| A2.5 | Cache hints for skills | `RELEASE_CACHE_HINT`, as for the lists | the SDK's default (`0`, private) |

## The plan

### Group 1: serve the skills

- [ ] `feat: the skills' files in core`: `files.generated.ts`, `skills:build` writes it, and the folder test checks it.
- [ ] `feat: skills over MCP`: `loadKernSkills()`, the `skills` option, both hosts, `create-server.test.ts` and the snapshots.
- [ ] `feat: the server's instructions name the skills`: the text, its builder, `names.test.ts` and the `server/discover` snapshot.
- [ ] `test(e2e): skills on both eras`: stdio and HTTP, each file checked against its digest.
- [ ] Typecheck, lint, `pnpm test`, the build, e2e and `pack:mcpb`; then push for CI, which builds the container and runs the packed install.

Then pause for review.

### Group 2: the pointers and the measurement

- [ ] The instructions probe, in both setups.
- [ ] `skills` on group 1's last commit, against `a1-skills-fix2`.
- [ ] `feat: the render and validate tools name their skills`: the three sentences, `listing:sizes`, the listing snapshots; then `skills` and `prompts` on that commit. Reverted if the numbers don't ask for it.
- [ ] By hand: the MCP Inspector, and VS Code Insiders if it's available.
- [ ] `docs:` record A2 here: the numbers, the hand checks, and what A3 needs to know.

Then pause for review, and write the A3 kickoff.
