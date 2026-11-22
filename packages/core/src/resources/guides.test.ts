import { describe, expect, it } from "vitest";

import { getCatalog } from "../mcp/catalog.js";
import { loadRegistryFromManifest } from "../ux/registry.js";
import { byteLength } from "./definition.js";
import { guides } from "./guides.js";

const definition = guides(loadRegistryFromManifest(), getCatalog().tools);
const entries = await definition.entries();

describe("kern://guides/{name}", () => {
	it("lists the guides with their size", async () => {
		expect(entries.map((entry) => entry.uri)).toEqual([
			"kern://guides/forms",
			"kern://guides/layout",
			"kern://guides/accessibility",
		]);
		for (const entry of entries) {
			expect(entry.size).toBe(
				byteLength((await definition.read(entry.value)) ?? ""),
			);
		}
	});

	it("serves nothing for a guide it doesn't have", async () => {
		expect(await definition.read("composition")).toBeUndefined();
	});
});
