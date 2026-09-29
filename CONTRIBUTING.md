# Contributing to kern-ux-mcp

## Branch Naming

All branches must follow this pattern:

| Prefix | When to use |
|---|---|
| `feature/` | New component, tool, schema, or feature |
| `fix/` | Bug fixes |
| `hotfix/` | Urgent fixes targeting `main` directly via PR |
| `chore/` | Dependency updates, tooling, housekeeping |
| `docs/` | Documentation and guidance overlay changes |
| `refactor/` | Code restructuring with no functional change |
| `ci/` | Workflow, pipeline, and release configuration |
| `release/` | Release preparation branches (version bump, changelog) |

Examples:
```
feature/add-stepper-component
fix/checkbox-validation-error
chore/update-biome-2.5
ci/add-release-workflow
docs/guidance-overlay-button
release/1.2.0
```

Branches named `main` and `develop` are the two long-lived branches and are protected.

## Commit Messages & PR Titles

This repo uses [Conventional Commits](https://www.conventionalcommits.org/). Every **PR title** must follow the format:

```
<type>[optional scope]: <description>
```

The PR title becomes the squash-merge commit message on `main`/`develop` — this is what drives automated versioning.

### Allowed types

| Type | Version bump | When to use |
|---|---|---|
| `feat` | minor | New capability, component, or tool |
| `fix` | patch | Bug fix |
| `perf` | patch | Performance improvement |
| `build` | patch | Build system or dependency changes |
| `revert` | patch | Reverting a previous commit |
| `chore` | — (no bump) | Maintenance, housekeeping |
| `docs` | — | Documentation only |
| `style` | — | Formatting, whitespace |
| `refactor` | — | Code restructure without behaviour change |
| `test` | — | Adding or fixing tests |
| `ci` | — | CI/CD workflow changes |

### Breaking changes

Append `!` after the type (or any type) to trigger a **major version bump**:

```
feat!: redesign tool contract for MCP 2.0
fix!: drop Node 22 support
```

Or add `BREAKING CHANGE: <description>` in the PR body.

### Examples

```
feat: add stepper component schema and template
fix: resolve checkbox validation crash on empty list
chore: update @biomejs/biome to 2.5.0
ci: add dry-run input to release workflow
feat(dialog)!: remove deprecated `size` prop
```

## How Versions Are Computed

Versions are computed automatically by [GitVersion](https://gitversion.net/) from the commit history on `main`. You never set the version manually.

| Branch | Label | Increment |
|---|---|---|
| `main` | _(none)_ | Patch per merge (unless type overrides) |
| `develop` | `alpha` | Minor per merge |
| `release/*` | `beta` | None (frozen) |

Version examples:
- Merge `fix:` PR to `main` → `1.0.1`
- Merge `feat:` PR to `main` → `1.1.0`
- Merge `feat!:` PR to `main` → `2.0.0`
- CI build on `develop` → `1.1.0-alpha.3`

## Workflow Overview

```
feature/* ──► develop (alpha) ──► release/* (beta) ──► main (stable)
fix/*     ──►                                      ──► main
hotfix/*  ──────────────────────────────────────────► main
```

## Local Development

```sh
# First-time: install and generate the manifest (needs kern-ux-plain as sibling)
npm install
npm run generate-manifest

# Start the dev loop (TypeScript watch + MCP inspector)
npm run loop:start

# Run full dev loop with tests and sample
npm run loop:full

# Run tests once
npm test

# Run Biome lint + format check
npx @biomejs/biome ci .

# TypeScript type check only
npx tsc --noEmit

# Type check the tooling (tools/, vitest.config.ts), which tsx and Vitest run unchecked
npx tsc -p tsconfig.tools.json

# Generate a CycloneDX SBOM locally
npm run sbom:generate

# Generate an SBOM and scan it with Grype
npm run scan:vulns

# Build and inspect the published package contents, including the SBOM
npm run pack:inspect
```

> `generate-manifest` is a **local-only** script. CI and release builds use the checked-in `packages/core/src/ux/registry.json`. Run it whenever you pull changes that affect component stories or the guidance overlay.

> `sbom:generate` and `scan:vulns*` expect local `syft` and `grype` binaries on `PATH`.

## CI Checks (required before merge)

All PRs targeting `main` or `develop` must pass:

| Check | Workflow | What it validates |
|---|---|---|
| `quality` | `ci.yml` | Biome, TypeScript, build, Vitest with coverage |
| `e2e` | `ci.yml` | The built stdio and HTTP servers as processes, on Linux and Windows |
| `packed-install` | `ci.yml` | The npm tarballs installed into an empty directory, without the private core |
| `mcpb` | `ci.yml` | The MCP Bundle validates and packs |
| `container` | `ci.yml` | The image builds for amd64 and arm64, becomes healthy and passes the HTTP e2e tests |
| `branch-name` | `pr-lint.yml` | Branch prefix convention |
| `conventional-commit-title` | `pr-lint.yml` | PR title format |

## Releasing

Releases are triggered manually: **Actions → Release → Run workflow**, or `gh workflow run release.yml --ref <branch> -f dry-run=false`. A release needs two approvals from a maintainer.

1. **Verify** (no approval). GitVersion computes the version; a pre-release label such as `alpha` becomes the npm dist-tag. The job sets the version on all workspaces, builds, runs the unit and e2e tests, writes one CycloneDX SBOM per package, and packs the stdio and http tarballs and the `.mcpb`. With **dry-run** it stops here.
2. **Approve the `release` environment** (**Review deployments** on the run). The publish job starts.
3. **Approve on npm.** The job stages both packages with `npm stage publish` (trusted publishing, with provenance). Nothing is live yet: approve each staged version on npmjs.com with 2FA (**Staged Packages → Approve**, or `npm stage list <package>` and `npm stage approve <stage-id>`). The job summary lists them, and the job waits up to 60 minutes.
4. Once both versions are live, the job publishes to [GitHub Packages](https://github.com/leonio/kern-ux-mcp/packages), pushes `ghcr.io/leonio/kern-ux-mcp-http:<version>` and `:<dist-tag>` (amd64 and arm64) with provenance and SBOM attestations, attests the `.mcpb`, and creates the GitHub release with the tarballs, the `.mcpb` and the SBOMs.

Every step skips what already exists, so after a failure, or an npm approval later than 60 minutes, use **Re-run failed jobs**. npm won't stage the same version twice, so approve or reject a version an earlier attempt staged before re-running.

npm trusted publishing is configured for both `@leonio/kern-ux-mcp` and `@leonio/kern-ux-mcp-http`: user/org `leonio`, repository `kern-ux-mcp`, workflow filename `release.yml`, environment `release`. Under **Allowed actions**, direct `npm publish` stays unticked, since staging is always allowed. No npm secret is needed; GitHub Packages and GHCR use the workflow's `GITHUB_TOKEN`. One-time setup for a new package: [docs/release-bootstrap.md](docs/release-bootstrap.md).

For consumer installs from GitHub Packages, users still need to configure `.npmrc` with:

```ini
@leonio:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=PERSONAL_ACCESS_TOKEN
```

Use npmjs as the default install path in MCP client docs because it works without extra registry authentication.

## GitHub Branch Protection (repository admin)

After merging the first CI/PR-lint workflow run, configure branch protection on both `main` and `develop`:

1. Go to **Settings → Branches → Add rule**
2. Set branch name pattern: `main` (repeat for `develop`)
3. Enable:
   - **Require a pull request before merging**
   - **Require status checks to pass before merging** → add: `quality`, `branch-name`, `conventional-commit-title`
   - **Require branches to be up to date before merging**
   - **Dismiss stale pull request approvals when new commits are pushed**
4. Disable **Allow force pushes** and **Allow deletions**
