import { defineConfig } from "vitest/config";

// End-to-end tests of the built hosts (the *.e2e.ts files in packages/*/src):
// they spawn dist/ and standalone/, so run `npm run build` first. Kept out of
// vitest.config.ts so `npm test` needs no build.
export default defineConfig({
	test: {
		include: ["packages/*/src/**/*.e2e.ts"],
		// Each suite starts real processes; SDK clients on 2026-07-28 also spawn a discovery process.
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
