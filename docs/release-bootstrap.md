# Release bootstrap: one-time steps for the 2.0 packages

These are the manual steps for the workspace split (roadmap step R3 in [plan-v2/roadmap.md](plan-v2/roadmap.md)). Do them once, before the first release that publishes the new HTTP package and container image. Everything after that runs from [release.yml](../.github/workflows/release.yml) without manual steps.

What gets published:

| Package | Where | Status |
|---|---|---|
| `@leonio/kern-ux-mcp` (stdio + `.mcpb`) | npm, GitHub Packages, GitHub release asset | Exists; trusted publishing is already configured |
| `@leonio/kern-ux-mcp-http` | npm, GitHub Packages | **New**: needs the bootstrap below |
| `ghcr.io/leonio/kern-ux-mcp-http` | GitHub Container Registry | **New**: needs the bootstrap below |
| `@leonio/kern-ux-core` | nowhere | Private; must never be published |

## 0. Before any of this

- [ ] `feat/v2-alpha` is pushed and CI is green, including the **Packed Install**, **MCP Bundle** and **Container Image** jobs.
- [ ] A Release run with `dry-run: true` on `feat/v2-alpha` passes. Its `release-assets` artifact should hold two tarballs, the `.mcpb` and two `.cdx.json` SBOMs.

## 1. Keep core private

Check all of these before the first release from the workspace layout:

- [x] `packages/core/package.json` has `"private": true`.
- [x] `packages/stdio` and `packages/http` list `@leonio/kern-ux-core` under `devDependencies`, not `dependencies`. The core is inlined by esbuild at build time.
- [x] `release.yml` packs only stdio and http (`npm pack -w packages/stdio -w packages/http`) and publishes only those tarballs. It never uses `-ws`, which would also try the private core.
- [ ] The CI packed-install smoke test passes. It installs the stdio and http tarballs into an empty directory where core isn't available, and fails if core got installed.
- [x] `npm view @leonio/kern-ux-core` returns `404`, so nothing was published by accident (checked 2026-09-28).

## 2. First publish of `@leonio/kern-ux-mcp-http` to npm

npm trusted publishing (OIDC) can only be configured for a package that already exists, so the first version is published by hand. Publish the real pre-release version of the commit you're about to release. The Release workflow then skips that version on npm (it skips every version that already exists) and publishes the rest.

1. On `feat/v2-alpha`, set the version GitVersion computes, then build and pack (PowerShell, from the repo root, where `dotnet-gitversion` finds `.git`):

   ```powershell
   npm ci
   $version = dotnet-gitversion /showvariable SemVer   # e.g. 2.0.0-alpha.64
   npm pkg set version=$version --workspaces
   npm run build -w packages/http
   npm pack -w packages/http
   git checkout -- packages   # drop the version change again
   ```

2. Log in with the account that owns the `@leonio` scope (2FA on):

   ```bash
   npm login
   ```

3. Publish under the pre-release dist-tag:

   ```powershell
   npm publish "./leonio-kern-ux-mcp-http-$version.tgz" --access public --tag alpha
   ```

   Provenance can only be generated in CI, so leave out `--provenance` for this one publish. On a package's first publish, npm may also point `latest` at that version whatever `--tag` says. Check with `npm view @leonio/kern-ux-mcp-http dist-tags`. If it did, `latest` stays on this alpha until the first stable release moves it.
4. On npmjs.com, open the package, then **Settings**, then **Trusted publishing**. Add a GitHub Actions publisher:
   - Organization or user: `leonio`
   - Repository: `kern-ux-mcp`
   - Workflow filename: `release.yml`
   - Environment: `release`, the default of the workflow's `publish_environment` input. It must match exactly.
5. In the same settings, set publishing access to require 2FA and disallow tokens, once you've confirmed the OIDC publish works (step 7).
6. If you created a granular access token for the bootstrap, revoke it.
7. Verify with the Release workflow on `feat/v2-alpha` (`dry-run: false`):
   - On the commit you bootstrapped, the npm step skips `@leonio/kern-ux-mcp-http@<version>` (already there) and publishes `@leonio/kern-ux-mcp` through OIDC. GitHub Packages, the image and the GitHub release follow.
   - On the next release, from a later commit, the http package goes through OIDC too. Check that the step succeeds with no `NPM_TOKEN` secret and that the new version shows a provenance badge on npmjs.com.

For reference, `@leonio/kern-ux-mcp` should keep the same trusted-publisher settings: same workflow filename, same environment. Moving the publish steps inside `release.yml` doesn't change them, but renaming the file would.

Trusted publishing needs npm CLI 11.5.1 or newer. The release job runs Node 24, which ships npm 11.

## 3. GitHub Packages (`npm.pkg.github.com`)

The workflow already publishes to GitHub Packages with `GITHUB_TOKEN`. The first workflow run creates `@leonio/kern-ux-mcp-http` there and links it to the repo. After that first run:

- [ ] Under **Package settings**, then **Manage Actions access**, confirm `kern-ux-mcp` has the **Write** role.
- [ ] Set the visibility to match `@leonio/kern-ux-mcp`.

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
- [ ] The `release` environment still requires approval before publishing.

Note: `@leonio/kern-ux-mcp`'s `alpha` dist-tag still points at `1.1.0-alpha.4` from before 2.0. The first 2.0 alpha release moves it.
