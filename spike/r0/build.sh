#!/usr/bin/env bash
# R0 spike (throwaway): fully inlined stdio + HTTP bundles and the .mcpb.
# Run from the repo root: bash spike/r0/build.sh
set -euo pipefail
BANNER="import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);"
build() {
	npx esbuild "$1" --bundle --platform=node --format=esm --target=node24 \
		--outfile="$2/index.js" --banner:js="$BANNER" --log-level=warning
	cp src/ux/registry.json "$2/"
}
build spike/r0/stdio.ts spike/r0/mcpb/server
build spike/r0/http.ts spike/r0/mcpb-http
npx -y @anthropic-ai/mcpb@2.1.2 validate spike/r0/mcpb/manifest.json
npx -y @anthropic-ai/mcpb@2.1.2 pack spike/r0/mcpb spike/r0/kern-ux-r0-spike.mcpb
