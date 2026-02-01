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
```

> `generate-manifest` is a **local-only** script. CI and release builds use the checked-in `src/ux/registry.json`. Run it whenever you pull changes that affect component stories or the guidance overlay.

## CI Checks (required before merge)

All PRs targeting `main` or `develop` must pass:

| Check | Workflow | What it validates |
|---|---|---|
| `quality` | `ci.yml` | Biome, TypeScript, Vitest |
| `branch-name` | `pr-lint.yml` | Branch prefix convention |
| `conventional-commit-title` | `pr-lint.yml` | PR title format |

## Releasing

Releases are triggered manually via **Actions → Release → Run workflow** on GitHub.

The workflow:
1. Computes the version from commit history (GitVersion)
2. Builds the project using the checked-in `registry.json`
3. Injects the computed version into `package.json`
4. Creates a GitHub Release with auto-generated release notes
5. Publishes `@leonio/kern-ux-mcp` to the [npm public registry](https://www.npmjs.com/package/%40leonio%2Fkern-ux-mcp) using npm trusted publishing
6. Publishes to [GitHub Packages](https://github.com/leonio/kern-mcp/packages)

Use the **dry-run** input to validate the build and version computation without publishing.

For npmjs, configure npm trusted publishing for package `@leonio/kern-ux-mcp` with:

1. GitHub user/org: `leonio`
2. Repository: `kern-mcp`
3. Workflow filename: `release.yml`
4. Allowed action: `npm publish`

No npm secret is required once trusted publishing is configured. GitHub Packages publishing uses the workflow `GITHUB_TOKEN`.

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
