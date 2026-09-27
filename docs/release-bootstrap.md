# Release bootstrap: one-time steps for the 2.0 packages

These are the manual steps for the workspace split (roadmap step R3 in [plan-v2/roadmap.md](plan-v2/roadmap.md)). Do them once, before the first release that publishes the new HTTP package and container image. Everything after that runs from [release.yml](../.github/workflows/release.yml) without manual steps.

What gets published:

| Package | Where | Status |
|---|---|---|
| `@leonio/kern-ux-mcp` (stdio + `.mcpb`) | npm, GitHub Packages, GitHub release asset | Exists; trusted publishing is already configured |
| `@leonio/kern-ux-mcp-http` | npm, GitHub Packages | **New**: needs the bootstrap below |
| `ghcr.io/leonio/kern-ux-mcp-http` | GitHub Container Registry | **New**: needs the bootstrap below |
| `@leonio/kern-ux-core` | nowhere | Private; must never be published |

## 1. Keep core private

Check all of these before the first release from the workspace layout:

- [ ] `packages/core/package.json` has `"private": true`.
- [ ] `packages/stdio` and `packages/http` list `@leonio/kern-ux-core` under `devDependencies`, not `dependencies`. The core is inlined by esbuild at build time.
- [ ] `release.yml` names each package explicitly (`-w packages/stdio -w packages/http`) for `npm pack` and `npm publish`. It doesn't use `-ws`, which would also try the private core.
- [ ] The CI packed-install smoke test passes. It installs the stdio and http tarballs into an empty directory where core isn't available.
- [ ] `npm view @leonio/kern-ux-core` returns `404`, so nothing was published by accident.

## 2. First publish of `@leonio/kern-ux-mcp-http` to npm

npm trusted publishing (OIDC) can only be configured for a package that already exists, so the first version is published by hand.

1. On the R3 branch, build and pack:

   ```bash
   npm ci
   npm run build -ws
   npm pack -w packages/http
   ```

2. Log in with the account that owns the `@leonio` scope (2FA on):

   ```bash
   npm login
   ```

3. Publish under the pre-release dist-tag, so the bootstrap build never becomes `latest`:

   ```bash
   npm publish ./leonio-kern-ux-mcp-http-<version>.tgz --access public --tag alpha
   ```

   Provenance can only be generated in CI, so leave out `--provenance` for this one publish.
4. On npmjs.com, open the package, then **Settings**, then **Trusted publishing**. Add a GitHub Actions publisher:
   - Organization or user: `leonio`
   - Repository: `kern-ux-mcp`
   - Workflow filename: `release.yml`
   - Environment: `release`, the default of the workflow's `publish_environment` input. It must match exactly.
5. In the same settings, set publishing access to require 2FA and disallow tokens, once you've confirmed the OIDC publish works (step 7).
6. If you created a granular access token for the bootstrap, revoke it.
7. Verify: run the Release workflow on `feat/v2-alpha` with `dry-run: false`. Then check:
   - the publish step succeeds with no `NPM_TOKEN` secret
   - the new version on npmjs.com shows a provenance badge

For reference, `@leonio/kern-ux-mcp` should keep the same trusted-publisher settings: same workflow filename, same environment. Moving the publish steps inside `release.yml` doesn't change them, but renaming the file would.

Trusted publishing needs npm CLI 11.5.1 or newer. The release job runs Node 24, which ships npm 11.

## 3. GitHub Packages (`npm.pkg.github.com`)

The workflow already publishes to GitHub Packages with `GITHUB_TOKEN`. The first workflow run creates `@leonio/kern-ux-mcp-http` there and links it to the repo. After that first run:

- [ ] Under **Package settings**, then **Manage Actions access**, confirm `kern-ux-mcp` has the **Write** role.
- [ ] Set the visibility to match `@leonio/kern-ux-mcp`.

## 4. GHCR image `ghcr.io/leonio/kern-ux-mcp-http`

1. In the `Dockerfile`, add a source label so GHCR links the image to the repo and inherits its permissions:

   ```dockerfile
   LABEL org.opencontainers.image.source="https://github.com/leonio/kern-ux-mcp"
   LABEL org.opencontainers.image.licenses="EUPL-1.2"
   ```

2. Give the image job these permissions: `contents: read`, `packages: write`, `id-token: write` and `attestations: write`. Log in with `docker/login-action`, using `GITHUB_TOKEN`.
3. Tag each image with `<semVer>`, plus the dist-tag it was published under: `alpha` for pre-releases, `latest` for stable releases. This mirrors npm.
4. After the first push, new GHCR packages start **private**. Open the package settings, change the visibility to **Public**, and confirm "Inherit access from source repository".
5. Verify, logged out:

   ```bash
   docker pull ghcr.io/leonio/kern-ux-mcp-http:<version>
   gh attestation verify oci://ghcr.io/leonio/kern-ux-mcp-http:<version> --owner leonio
   ```

## 5. Versioning check before the first alpha

- [x] `gitversion.yml` has a `feat/v2-alpha` branch entry with a pre-release label (roadmap R1). It needs its own `mode: ContinuousDelivery`: the global `ContinuousDeployment` mode drops the label, and the branch would publish as `latest`.
- [ ] The first R2 commit is marked breaking, with `feat!:` or a `BREAKING CHANGE:` footer. GitVersion then computes `2.0.0-<label>.N` rather than `1.1.x`.
- [ ] `dotnet-gitversion /showvariable SemVer` on the branch prints the expected pre-release version.
- [ ] The existing "Compute npm dist-tag" step turns the label into the npm dist-tag. No workflow change is needed for that.
- [ ] The `release` environment still requires approval before publishing.
