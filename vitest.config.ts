import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts"],
		// Persist transformed modules between runs (cache lives in node_modules and is keyed on file content).
		fsModuleCache: true,
	},
});
