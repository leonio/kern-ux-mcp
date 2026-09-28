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
FROM --platform=$BUILDPLATFORM node:24-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/stdio/package.json packages/stdio/
COPY packages/http/package.json packages/http/
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --no-audit --no-fund

COPY tsconfig.json tsconfig.base.json ./
COPY tools/build tools/build
COPY packages/core/src packages/core/src
COPY packages/http/src packages/http/src

# The release passes its version; the server reports it and the bundle inlines it.
ARG VERSION
RUN if [ -n "$VERSION" ]; then npm pkg set version="$VERSION" -w packages/http; fi \
	&& npm run build -w packages/http

FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:bb6b03d81066993293a10feda7250e8e1cc034035fe9b61cfceededa7c8bf04d

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
