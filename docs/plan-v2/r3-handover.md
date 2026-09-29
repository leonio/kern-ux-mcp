# R3 handover: workspaces and hosts, released

As of 2026-09-29. Branch `feat/v2-alpha` at `1443719`, pushed, CI green. How R3 was planned and what was learned on the way is in [r3-kickoff.md](r3-kickoff.md); this file is the state to pick up from.

## Where R3 ended

R3 is done except for a few one-time settings on npmjs.com and GitHub (see [Next steps](#next-steps)). The first complete 2.0 alpha, **`2.0.0-alpha.69`**, is out everywhere:

| Channel | What's there |
|---|---|
| npm | `@leonio/kern-ux-mcp` and `@leonio/kern-ux-mcp-http`, dist-tag `alpha`, staged by CI and approved with 2FA, SLSA provenance |
| GitHub Packages | both packages |
| GHCR | `ghcr.io/leonio/kern-ux-mcp-http:2.0.0-alpha.69` and `:alpha`, amd64 and arm64, public, provenance and SBOM attestations |
| GitHub release | [`v2.0.0-alpha.69`](https://github.com/leonio/kern-ux-mcp/releases/tag/v2.0.0-alpha.69) (pre-release, tagged on `1443719`): both tarballs, `kern-ux-mcp-2.0.0-alpha.69.mcpb`, one CycloneDX SBOM per package; the `.mcpb` has provenance and SBOM attestations |

Checked on 2026-09-29: release run [36621251474](https://github.com/leonio/kern-ux-mcp/actions/runs/36621251474) succeeded; the image can be pulled anonymously; `gh attestation verify` passes for the image and the `.mcpb`, for both provenance and `--predicate-type https://cyclonedx.org/bom`; both npm versions report `https://slsa.dev/provenance/v1`.

### The earlier alphas are incomplete (expected)

Each failed attempt taught the pipeline something; see the fix commits `6dc0ace` and `1443719`, and `46b4beb` for staged publishing.

| Version | What exists | Why it stopped |
|---|---|---|
| `2.0.0-alpha.66` | `@leonio/kern-ux-mcp-http` on npm only, published by hand | The npm bootstrap (trusted publishing needs an existing package). It is also the http package's `latest` until 2.0.0. |
| `2.0.0-alpha.67` | `@leonio/kern-ux-mcp` on npm only (direct publish) | The http trusted publisher only allowed staged publishing |
| `2.0.0-alpha.68` | Both on npm (staged), GitHub Packages, GHCR image with provenance | `actions/attest` rejected the SBOM (no `serialNumber`); no GitHub release |

## What's where

| Path | Role |
|---|---|
| `packages/core` | `@leonio/kern-ux-core`: private, source only (`@leonio/source` export condition), never published. Domain in `src/ux`, MCP wiring in `src/mcp`, `invoke.ts`, `logging.ts`, `test-support/`. |
| `packages/stdio` | `@leonio/kern-ux-mcp`: stdio entry, `mcpb/manifest.json` (MCPB template) |
| `packages/http` | `@leonio/kern-ux-mcp-http`: `server.ts` (guards, CORS, rate limit, bearer token, probes, drain), `config.ts` (environment variables), `Dockerfile`, `compose.yaml` |
| `tools/build` | `bundle.ts` (`dist/` for npm, `standalone/` for MCPB and Docker, dependency checks), `mcpb.ts`, `sbom.ts` |
| `tools/manifest` | the in-repo registry generator (to be retired by R4b) |
| `.github/workflows` | `ci.yml` (quality, e2e on Linux and Windows, packed install, `.mcpb`, container), `release.yml` |

Day-to-day commands: `npm run build`, `npm test`, `npm run test:coverage`, `npm run build && npm run test:e2e`, `npm run typecheck`, `npx biome ci .`, `npm run dev` / `npm run dev:http`, `npm run pack:mcpb`, `npm run sbom`, `npm run docker:build`.

**Releasing** is described in [CONTRIBUTING.md](../../CONTRIBUTING.md#releasing): `gh workflow run release.yml --ref feat/v2-alpha -f dry-run=false`, approve the `release` environment, then approve both staged versions on npmjs.com within 60 minutes. Every step skips what already exists, so **Re-run failed jobs** finishes a partial release; npm won't stage a version twice, so approve or reject a leftover staged version first. A fix to `release.yml` itself needs a new commit, which means a new version.

## Next steps

### 1. Finish R3 (the maintainer, on npmjs.com and GitHub)

These are the leftovers of [release-bootstrap.md](../release-bootstrap.md). They can't be checked from the repo.

- [ ] `@leonio/kern-ux-mcp` trusted publisher: under **Allowed actions**, untick direct `npm publish`. It predates npm's staged-only default and still allows it; `2.0.0-alpha.67` went out that way.
- [ ] Both npm packages, **Settings → Publishing access**: require 2FA and disallow tokens.
- [ ] Revoke any npm access token created for the bootstrap (none is needed any more).
- [ ] GitHub Packages, npm package `kern-ux-mcp-http`: **Manage Actions access** gives `kern-ux-mcp` the **Write** role, and its visibility matches `kern-ux-mcp` (release-bootstrap section 3).
- [ ] Then tick R3's last box in [roadmap.md](roadmap.md) and section 3 of release-bootstrap.md.

### 2. Open items from earlier steps

- **R0 client matrix** (roadmap R0): VS Code Copilot, Codex CLI, Claude Code, Claude Desktop, ChatGPT and the Responses API, on both protocol eras. Real artifacts now exist: the npm packages, the `.mcpb` and the public image. The runbook is `spike/r0/CLIENT-MATRIX.md` (`git checkout 31110cf -- spike/r0`). The results gate R5's schema-shrink choice.
- **Claude Desktop runs the `.mcpb` on Node 24** (R0): install `kern-ux-mcp-2.0.0-alpha.69.mcpb` from the release.
- **MCPB icon:** add `packages/stdio/mcpb/icon.png`; `npm run pack:mcpb` picks it up.

### 3. The next roadmap step

- **R4, composition gaps**, is next in order and a prerequisite for the R7 prompts.
- **R4b, registry contract**, can start any time now that `registry.json` is a JSON import. It coordinates with the external generator (`kern-ux-scraper`, finding 22).

Either way, start the same way as R3: a kickoff file next to this one with the plan, checked with the maintainer before the first commit, one commit per roadmap checkbox, and a pause for review after each commit group.

### 4. Follow-ups found during R3 (not scheduled)

- **Dry runs can't test the publish job.** Both release failures (`./` tarball paths, the SBOM `serialNumber`) were in steps a dry run skips. A `--dry-run` of the npm stage loop in the verify job would have caught the first.
- **Pinned release tools that Renovate doesn't update:** `@anthropic-ai/mcpb@2.1.2` in `tools/build/mcpb.ts` and `@cyclonedx/cyclonedx-npm@6.0.1` in `tools/build/sbom.ts`. They run through `npm exec` to keep their dev-only advisories out of the lockfile. Bump by hand.
- **Approval scope:** the npm 2FA approval gates npm only. GitHub Packages and GHCR are gated by the `release` environment approval (they do run after the npm approval, but a changed workflow could skip it).
- **Coverage floors** are 87 / 79 / 87 / 87 against actual 95.7 / 89.0 / 95.8 / 95.7 (statements / branches / functions / lines). Worth raising.
- **`ubuntu-latest` becomes Ubuntu 26 from 2026-10-19** (GitHub notice). Watch the first CI run after that.
- **Deferred by decision:** OpenTelemetry for the HTTP host; the MCPB `default_locale` option (revisit with R5); renaming `invoke.ts`/`logging.ts` to `mcp/pipeline.ts`.
- **Docs:** [README.md](README.md) in this folder still describes the pre-R1 layout under "Where we are today"; [findings.md](findings.md) keeps links to files removed in R2 (`src/server.ts`, `src/server.mcp.test.ts`) on purpose, as a dated record.

## Environment notes (Windows), beyond r3-kickoff.md

- Docker Desktop has to be running for `npm run docker:build` and container checks. actionlint runs through Docker (`rhysd/actionlint`) or as the Windows binary from its GitHub releases.
- In Git Bash, `gh api` endpoints must not start with `/` (it becomes a Windows path), and `tar` needs a relative path or `--force-local` (a `C:` path reads as a remote host).
- The local `gh` token has no `read:packages` scope, so package settings can't be read through the API.
- `npm view @leonio/…` needs a forward slash; with a backslash npm looks for a folder.
