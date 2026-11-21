# syntax=docker/dockerfile:1
#
# The Kern UX MCP HTTP server as a container: the fully inlined bundle
# (packages/http/standalone) on distroless Node 24, no node_modules, no shell.
# Build from the repository root:
#
#   docker build -f packages/http/Dockerfile -t kern-ux-mcp-http .
#   docker run --rm -p 127.0.0.1:3000:3000 -e KERN_ALLOWED_HOSTS=localhost kern-ux-mcp-http
#
# HOST is 0.0.0.0 in the image, so the server refuses to start without
# KERN_ALLOWED_HOSTS (the hostnames clients use). See README.md for all settings.

# The bundle is plain JavaScript, so it's built once on the build machine's platform.
FROM --platform=$BUILDPLATFORM node:24-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54 AS build
WORKDIR /repo

# pnpm at the version package.json's packageManager names, through Node's Corepack.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm

# Every workspace manifest, so the frozen lockfile matches; only the root's and
# http's dependencies are installed.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/stdio/package.json packages/stdio/
COPY packages/http/package.json packages/http/
COPY samples/basic-layout/package.json samples/basic-layout/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
	pnpm install --frozen-lockfile --ignore-scripts --store-dir /pnpm/store \
		--filter kern-ux-mcp-workspace --filter @leonio/kern-ux-mcp-http...

COPY tsconfig.json tsconfig.base.json ./
COPY tools/build tools/build
COPY packages/core/src packages/core/src
COPY packages/http/src packages/http/src

# The release passes its version; the server reports it and the bundle inlines it.
ARG VERSION
RUN if [ -n "$VERSION" ]; then pnpm --filter @leonio/kern-ux-mcp-http pkg set version="$VERSION"; fi \
	&& pnpm --filter @leonio/kern-ux-mcp-http run build

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:6abfcb367ebc291572c774c1592a986be2ab26a2486f73093401327495a5962a

LABEL org.opencontainers.image.source="https://github.com/leonio/kern-ux-mcp" \
	org.opencontainers.image.licenses="EUPL-1.2" \
	org.opencontainers.image.title="kern-ux-mcp-http" \
	org.opencontainers.image.description="Kern UX MCP server over Streamable HTTP: KERN UX component generation and strict accessibility validation."

WORKDIR /app
COPY --from=build /repo/packages/http/standalone/ ./
COPY LICENSE.md ./

ENV HOST=0.0.0.0 \
	PORT=3000 \
	NODE_ENV=production
EXPOSE 3000

# Distroless has no curl, so node probes /healthz itself.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD ["/nodejs/bin/node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/healthz`).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# The base image's entrypoint is node and its user is nonroot (65532).
CMD ["/app/index.js"]
