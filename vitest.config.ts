import { defaultServerConditions } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// Workspace packages resolve to their TypeScript source, as in tsconfig.base.json.
	ssr: {
		resolve: { conditions: ["@leonio/source", ...defaultServerConditions] },
	},
	test: {
		// Persist transformed modules between runs (cache lives in node_modules and is keyed on file content).
		fsModuleCache: true,
		// A cold run with coverage (always the case in CI) builds every tool's JSON Schema
		// under instrumentation, which can pass the 5 s default.
		testTimeout: 15_000,
		// One project per workspace package plus the build tooling; all inherit this config.
		// Run one with `npx vitest run --project core`.
		projects: [
			{
				extends: true,
				test: { name: "core", include: ["packages/core/src/**/*.test.ts"] },
			},
			{
				extends: true,
				test: { name: "http", include: ["packages/http/src/**/*.test.ts"] },
			},
			{
				extends: true,
				test: { name: "tools", include: ["tools/**/*.test.ts"] },
			},
		],
		coverage: {
			provider: "v8",
			// Listing every source file keeps untested modules visible at 0% instead of silently omitted.
			include: ["packages/*/src/**/*.ts"],
			// Entry points only wire things up: core's re-exports, and the hosts' startup
			// (config, listen, signals). What they call is covered by the core and HTTP tests.
			exclude: [
				"packages/*/src/**/*.test.ts",
				"packages/*/src/**/*.e2e.ts",
				"packages/*/src/test-support/**",
				"packages/*/src/index.ts",
			],
			// text: console; html: local browsing (coverage/index.html); json-summary: CI job summary.
			reporter: ["text", "html", "json-summary"],
			// Floors ~1.5 points below the baseline (2026-09-27, stmts/branch/funcs/lines: 88.4 / 80.6 / 88.8 / 88.7). Raise as coverage improves.
			thresholds: {
				statements: 87,
				branches: 79,
				functions: 87,
				lines: 87,
			},
		},
	},
});
