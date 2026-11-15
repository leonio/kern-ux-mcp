# A0: the branch and the SDK

Status: kickoff, written on 2026-11-15. Not started. Step A0 of the [2.1 roadmap](roadmap.md#5-steps).

## The task

Bring the 2.1 branch, `feat/figma-designs` ([decision 7](roadmap.md#7-decisions)), up to date with `main`, and move it onto MCP SDK 2.4, so that A1 and A2 can build on `ext/skills`. Nothing a client sees changes.

## What a trial showed

On 2026-11-15, in a scratch worktree of `fb0235c`, with nothing committed:

- **`main` has three commits the branch lacks:** `1520fa8` (the distroless digest), `b91f794` (Renovate: `@modelcontextprotocol/client` 2.4.0, in the lock file only) and `2bb054e` (the Node image). They merge without conflicts.
- **The server is still at 2.1.0.** Renovate's lock update moved only the client. `@modelcontextprotocol/node` 2.1.2 needs the server at `^2.4.0`.
- **The ranges that give one SDK in the tree:** `@modelcontextprotocol/server` `^2.4.0` in core, stdio and http; `@modelcontextprotocol/node` `^2.1.2` in http; `@modelcontextprotocol/client` `^2.4.0` in the root's dev dependencies. `npm ls` then shows server, core and client at 2.4.0 and node at 2.1.2.
- **Nothing else changes:** typecheck, lint, 2,411 unit tests in 94 files, the build, and the e2e tests (18 passed, the 2 that always skip on Windows skipped) pass with no change to code or snapshots.
- **None of 2.4.0's upgrade notes apply to us:** `x-mcp-header` on `number` parameters, `outputSchema` from `.meta({ id })` on 2025-11-25, and `$id` values that fast-uri rejects.
- **Bundles:** the npm `dist/` is unchanged at 703,362 bytes, since the SDK stays external. The standalone bundles grow by about 30 KB (stdio 2,260,692 to 2,290,876 bytes) and 23 KB (http).
- **A spike for A2:** a test built a catalog with `SkillsExtension.load(memorySkillFiles(…))` and attached it to `createKernServer()` on both protocol eras. The server declared `io.modelcontextprotocol/skills`; `SkillsClient` listed the skill, got it, and read a reference file with its digest verified. `resources/list` had the `SKILL.md` after the cards and guides, and not the reference file. The 55 tools and the `kern://` reads were unchanged. So A2 is mostly wiring.

## Decisions

Confirmed by the maintainer on 2026-11-15:

| # | Decision | Confirmed |
|---|---|---|
| A0.1 | How `main` comes in | merge `origin/main` into the branch, since the branch is pushed |
| A0.2 | Pre-releases from the branch | an `alpha` label from the start, as 2.0's `v2-alpha` had, and an alpha release at the end of A0, so 2.1 can be tested from npm |
| A0.3 | The commit type for the SDK | `fix(deps):`, as Renovate writes it |

## The plan

### Group 1: the branch and the SDK

- [ ] Merge `origin/main` into `feat/figma-designs`.
- [ ] `fix(deps): the MCP SDK at 2.4, for the skills extension`: the four ranges and the lock file. The body says why the ranges move: `ext/skills` is new in 2.4.0, and `@modelcontextprotocol/node` 2.1.2 needs that server.
- [ ] `chore:` alpha pre-releases from the 2.1 branch: a GitVersion branch for `feat/figma-designs` with the `alpha` label, in place of 2.0's `v2-alpha`.
- [ ] Run typecheck, lint, `npm test`, the build and `npm run test:e2e`; the listing snapshots and the budget test stay unchanged. GitVersion computes `2.1.0-alpha.N`.

### Group 2: the alpha

- [ ] Push the branch, and run the release workflow on it as a dry run.
- [ ] Run it for real: `@leonio/kern-ux-mcp@alpha` and `-http@alpha` on npm, the `alpha` image, and a GitHub pre-release with the `.mcpb`. The maintainer approves the `release` environment and both npm versions.
- [ ] `docs:` record A0 here: what was done, the numbers, the alpha's version, and what A1 needs to know.

Then pause for review, and write the A1 kickoff.

## For A1

- `SkillsExtension.load(memorySkillFiles(files), options)` takes a record of paths under a folder of skills (`kern-forms/SKILL.md`, `kern-forms/references/forms.md`). esbuild can inline the files as text, so the record is built at import time, with no files on disk.
- `strict: true` turns the SDK's checks (naming, frontmatter, limits) into errors at load time. A test can load the real `skills/` folder with it.
- The client side, `SkillsClient` from `@modelcontextprotocol/client/ext/skills`, verifies size, digest and frontmatter on read. The e2e tests can use it as a conforming host would.
