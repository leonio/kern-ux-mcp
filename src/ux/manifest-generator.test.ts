import { describe, expect, it } from "vitest";

import { loadRegistryFromManifest } from "./registry.js";

describe("manifest generator regression", () => {
	it("filters scanner artifacts and excluded ids", async () => {
		const registry = await loadRegistryFromManifest();
		const ids = new Set(registry.components.map((component) => component.id));

		expect(ids.has("check")).toBe(false);
		expect(ids.has("compose_stories_js")).toBe(false);
	});

	it("normalizes known alias ids to canonical ids", async () => {
		const registry = await loadRegistryFromManifest();
		const ids = new Set(registry.components.map((component) => component.id));

		expect(ids.has("description_list")).toBe(false);
		expect(ids.has("input_group")).toBe(false);
		expect(ids.has("task_list")).toBe(false);

		expect(ids.has("descriptionlist")).toBe(true);
		expect(ids.has("inputgroup")).toBe(true);
		expect(ids.has("tasklist")).toBe(true);
	});

	it("does not mark card as deprecated for modifier-level SCSS deprecations", async () => {
		const registry = await loadRegistryFromManifest();
		const card = registry.byId.get("card");

		expect(card).toBeDefined();
		expect(card?.status).not.toBe("deprecated");
	});

	it("keeps extracted docs lean while preserving reviewed overlay guidance", async () => {
		const registry = await loadRegistryFromManifest();

		const kopfzeile = registry.byId.get("kopfzeile");
		const inputDate = registry.byId.get("inputdate");
		const body = registry.byId.get("body");

		expect(kopfzeile?.docs?.excerpt).toContain("Kopfzeile");
		expect(kopfzeile?.docs?.excerpt).not.toContain("@author");
		expect(kopfzeile?.docs?.excerpt).not.toContain("@file");
		expect(kopfzeile?.reviewedGuidance?.status).toBe("reviewed");

		expect(inputDate?.reviewedGuidance?.summary.text.en).toContain(
			"single browser-native date field",
		);

		expect(inputDate?.docs).toBeUndefined();
		expect(body?.docs).toBeUndefined();
		expect(body?.reviewedGuidance).toBeUndefined();
	});
});
