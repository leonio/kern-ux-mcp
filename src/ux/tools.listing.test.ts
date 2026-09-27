import { describe, expect, it } from "vitest";

import { loadRegistryFromManifest } from "./registry.js";
import { createTools } from "./tools.js";

/**
 * Contract snapshot of everything MCP clients see from tools/list: tool names,
 * descriptions and JSON input schemas, built from the checked-in registry.json.
 *
 * A diff here means clients will see a change. If it is intended, update with
 * `npx vitest run -u src/ux/tools.listing.test.ts` and review the JSON diff in the PR.
 * CI never writes snapshots, so a missing or stale snapshot fails the build.
 */
describe("tool listing contract", () => {
	it("matches the published tools/list snapshot", async () => {
		const registry = await loadRegistryFromManifest();
		const listing = createTools(registry).listTools();

		await expect(`${JSON.stringify(listing, null, 2)}\n`).toMatchFileSnapshot(
			"__snapshots__/tools-list.json",
		);
	});
});
