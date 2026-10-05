import { describe, expect, it } from "vitest";

import { getCatalog } from "../mcp/catalog.js";
import { loadRegistryFromManifest } from "../ux/registry.js";
import { validateHtmlStrict } from "../ux/validate.js";
import { byteLength } from "./definition.js";
import { GUIDES, guides } from "./guides.js";

const registry = loadRegistryFromManifest();
const definition = guides(registry, getCatalog().tools);
const entries = await definition.entries();

/** A guide stays small enough to attach whole. */
const GUIDE_BUDGET_BYTES = 12_000;

describe("kern://guides/{name}", () => {
	it("lists the guides with their size", async () => {
		expect(entries.map((entry) => entry.uri)).toEqual([
			"kern://guides/forms",
			"kern://guides/layout",
		]);
		for (const entry of entries) {
			expect(entry.size).toBe(
				byteLength((await definition.read(entry.value)) ?? ""),
			);
		}
	});

	it.each(GUIDES.map((guide) => guide.name))(
		"keeps the %s guide within the budget, its HTML strict-valid, and the same every time",
		async (name) => {
			const text = (await definition.read(name)) ?? "";

			expect(byteLength(text)).toBeLessThanOrEqual(GUIDE_BUDGET_BYTES);
			for (const [, html] of text.matchAll(/```html\n([\s\S]*?)\n```/g)) {
				expect(validateHtmlStrict(html).ok).toBe(true);
			}
			expect(await guides(registry, getCatalog().tools).read(name)).toBe(text);
		},
	);

	it("quotes only sections the registry has", () => {
		for (const guide of GUIDES) {
			for (const { quotes } of guide.kern) {
				for (const quote of quotes) {
					const page = registry.foundations.get(quote.page);
					expect(page, `${guide.name}: ${quote.page}`).toBeDefined();
					const ids = page?.sections.map((section) => section.id) ?? [];
					for (const id of quote.sections) {
						expect(ids, `${guide.name}: ${quote.page}#${id}`).toContain(id);
					}
				}
			}
		}
	});

	it("serves nothing for a guide it doesn't have", async () => {
		expect(await definition.read("composition")).toBeUndefined();
	});

	it.each(GUIDES.map((guide) => guide.name))(
		"renders the %s guide",
		async (name) => {
			await expect(await definition.read(name)).toMatchFileSnapshot(
				`__snapshots__/guides/${name}.md`,
			);
		},
	);
});
