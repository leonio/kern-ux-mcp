import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts", "tools/**/*.test.ts"],
		// Persist transformed modules between runs (cache lives in node_modules and is keyed on file content).
		fsModuleCache: true,
		coverage: {
			provider: "v8",
			// Listing every source file keeps untested modules visible at 0% instead of silently omitted.
			include: ["src/**/*.ts"],
			// index.ts only wires stdio; createServer() is covered end-to-end by server.mcp.test.ts.
			exclude: ["src/**/*.test.ts", "src/test-support/**", "src/index.ts"],
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
