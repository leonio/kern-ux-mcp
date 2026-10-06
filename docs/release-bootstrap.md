# Release bootstrap: one-time steps for the 2.0 packages

These are the manual steps for the workspace split (step R3 in [v2-migration/history.md](v2-migration/history.md#r3-workspaces-and-hosts)). Do them once, before the first release that publishes the new HTTP package and container image. Everything after that runs from [release.yml](../.github/workflows/release.yml) without manual steps.

What gets published:

| Package | Where | Status |
|---|---|---|
| `@leonio/kern-ux-mcp` (stdio + `.mcpb`) | npm, GitHub Packages, GitHub release asset | Exists; trusted publishing is already configured |
| `@leonio/kern-ux-mcp-http` | npm, GitHub Packages | **New**: needs the bootstrap below |
| `ghcr.io/leonio/kern-ux-mcp-http` | GitHub Container Registry | **New**: needs the bootstrap below |
| `@leonio/kern-ux-core` | nowhere | Private; must never be published |

## 0. Before any of this

- [x] `feat/v2-alpha` is pushed and CI is green, including the **Packed Install**, **MCP Bundle** and **Container Image** jobs.
- [x] A Release run with `dry-run: true` on `feat/v2-alpha` passes. Its `release-assets` artifact should hold two tarballs, the `.mcpb` and two `.cdx.json` SBOMs.

## 1. Keep core private

Check all of these before the first release from the workspace layout:

- [x] `packages/core/package.json` has `"private": true`.
- [x] `packages/stdio` and `packages/http` list `@leonio/kern-ux-core` under `devDependencies`, not `dependencies`. The core is inlined by esbuild at build time.
- [x] `release.yml` packs only stdio and http (`npm pack -w packages/stdio -w packages/http`) and publishes only those tarballs. It never uses `-ws`, which would also try the private core.
- [x] The CI packed-install smoke test passes. It installs the stdio and http tarballs into an empty directory where core isn't available, and fails if core got installed.
- [x] `npm view @leonio/kern-ux-core` returns `404`, so nothing was published by accident (checked 2026-09-28).

## 2. First publish of `@leonio/kern-ux-mcp-http` to npm

**Done 2026-09-28** (`2.0.0-alpha.66`, published by hand). Kept for reference, and for any new package.

npm trusted publishing (OIDC) can only be configured for a package that already exists, so the first version is published by hand. Publish the tarball of a Release dry run: it's exactly what the workflow would publish.

1. Run the Release workflow with `dry-run: true`, then download its tarballs (PowerShell):

   ```powershell
   gh run download <run-id> -n release-assets -D $env:TEMP\kern-release
   cd $env:TEMP\kern-release
   ```

2. Log in with the account that owns the `@leonio` scope (2FA on), and publish under the pre-release dist-tag:

   ```powershell
   npm login
   npm publish .\leonio-kern-ux-mcp-http-<version>.tgz --access public --tag alpha --provenance=false
   npm view @leonio/kern-ux-mcp-http dist-tags   # forward slash: a backslash makes npm look for a folder
   ```

   `--provenance=false` is required: the package's `publishConfig` asks for provenance, which npm can only create in CI. On a package's first publish npm also points `latest` at that version, whatever `--tag` says. It moves with the first stable release.
3. On npmjs.com, open the package, then **Settings**, then **Trusted publishing**. Add a GitHub Actions publisher:
   - Organization or user: `leonio`
   - Repository: `kern-ux-mcp`
   - Workflow filename: `release.yml`
   - Environment: `release`, the default of the workflow's `publish_environment` input. It must match exactly.
   - **Allowed actions:** leave direct `npm publish` **unticked**. `npm stage publish` is always allowed, and the Release workflow only stages: each version goes live when a maintainer approves it with 2FA. (Publishers created since 2026-09-03 start this way. Older ones, such as `@leonio/kern-ux-mcp`'s, allow direct publishing: untick it there too.)
4. In the same settings, set publishing access to require 2FA and disallow tokens.
5. If you created a granular access token for the bootstrap, revoke it.
6. Verify with the Release workflow (`dry-run: false`): after the `release` environment approval, the job stages the packages and waits. Approve them on npmjs.com (**Staged Packages**), and check that the new versions show a provenance badge.

Trusted publishing needs npm CLI 11.5.1 or newer, and staged publishing 11.15.0 or newer. The release job runs Node 24 (npm 11.19 with Node 24.21) and checks the version before staging.

## 3. GitHub Packages (`npm.pkg.github.com`)

The workflow already publishes to GitHub Packages with `GITHUB_TOKEN`. The first workflow run creates `@leonio/kern-ux-mcp-http` there and links it to the repo. After that first run:

- [x] Under **Package settings**, then **Manage Actions access**, confirm `kern-ux-mcp` has the **Write** role.
- [x] Set the visibility to match `@leonio/kern-ux-mcp`.

## 4. GHCR image `ghcr.io/leonio/kern-ux-mcp-http`

Already in place (R3):
- [x] [packages/http/Dockerfile](../packages/http/Dockerfile) sets `org.opencontainers.image.source` and `org.opencontainers.image.licenses`, so GHCR links the image to the repo.
- [x] The publish job has `packages: write`, `id-token: write` and `attestations: write`, and logs in with `docker/login-action` using `GITHUB_TOKEN`.
- [x] Each image is tagged `<semVer>` plus its npm dist-tag (`alpha` or `latest`), built for amd64 and arm64, and gets a GitHub provenance attestation and an SBOM attestation (the http package's CycloneDX SBOM). The release skips the push if `<semVer>` already exists.

After the first push:
1. New GHCR packages start **private**. Open the package settings, change the visibility to **Public**, and confirm "Inherit access from source repository".
2. Verify, logged out:

   ```bash
   docker pull ghcr.io/leonio/kern-ux-mcp-http:<version>
   gh attestation verify oci://ghcr.io/leonio/kern-ux-mcp-http:<version> --owner leonio
   ```

   The `.mcpb` on the GitHub release is attested the same way: `gh attestation verify kern-ux-mcp-<version>.mcpb --owner leonio`.

## 5. Versioning check before the first alpha

- [x] `gitversion.yml` has a `feat/v2-alpha` branch entry with a pre-release label (roadmap R1). It needs its own `mode: ContinuousDelivery`: the global `ContinuousDeployment` mode drops the label, and the branch would publish as `latest`.
- [x] The first R2 commit is marked breaking, with `feat!:` or a `BREAKING CHANGE:` footer. GitVersion then computes `2.0.0-<label>.N` rather than `1.1.x`. (`73e3233 feat!: serve over MCP SDK v2 with protocol 2026-07-28`.)
- [x] `dotnet-gitversion /showvariable SemVer` on the branch prints the expected pre-release version: `2.0.0-alpha.64` on 2026-09-28, label `alpha`.
- [x] The "Compute npm dist-tag" step turns the label into the npm dist-tag, and the image tag reuses it.
- [x] The `release` environment still requires approval before publishing.

Note: `@leonio/kern-ux-mcp`'s `alpha` dist-tag still points at `1.1.0-alpha.4` from before 2.0. The first 2.0 alpha release moves it.
