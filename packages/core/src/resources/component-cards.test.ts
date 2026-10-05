import { describe, expect, it } from "vitest";

import { getCatalog } from "../mcp/catalog.js";
import { loadRegistryFromManifest } from "../ux/registry.js";
import { validateHtmlStrict } from "../ux/validate.js";
import { componentCards } from "./component-cards.js";
import { byteLength } from "./definition.js";

const registry = loadRegistryFromManifest();
const cards = componentCards(registry, getCatalog().tools);
const entries = await cards.entries();
const texts = new Map(
	await Promise.all(
		entries.map(
			async (entry) =>
				[entry.value, (await cards.read(entry.value)) ?? ""] as const,
		),
	),
);

/** Each card stays small enough to attach whole. */
const CARD_BUDGET_BYTES = 8_000;

describe("kern://components/{id}", () => {
	it("has a card for every registry component, sorted by ID", () => {
		const ids = entries.map((entry) => entry.value);

		expect(ids).toEqual(registry.components.map((c) => c.id).sort());
		expect(entries[0]).toMatchObject({
			uri: "kern://components/accordion",
			value: "accordion",
			title: "KERN Accordion",
		});
	});

	it("reports each card's size in bytes", () => {
		for (const entry of entries) {
			expect(entry.size, entry.value).toBe(
				byteLength(texts.get(entry.value) ?? ""),
			);
		}
	});

	it.each(entries.map((entry) => entry.value))(
		"keeps the %s card within the budget, and its HTML strict-valid",
		(id) => {
			const text = texts.get(id) ?? "";

			expect(byteLength(text)).toBeLessThanOrEqual(CARD_BUDGET_BYTES);
			for (const [, html] of text.matchAll(/```html\n([\s\S]*?)\n```/g)) {
				expect(validateHtmlStrict(html).ok).toBe(true);
			}
		},
	);

	it("builds the same cards every time, so every server process serves the same bytes", async () => {
		const again = componentCards(registry, getCatalog().tools);

		for (const entry of entries) {
			expect(await again.read(entry.value), entry.value).toBe(
				texts.get(entry.value),
			);
		}
	});

	it("serves nothing for an ID the registry doesn't have", async () => {
		expect(await cards.read("nope")).toBeUndefined();
		expect(await cards.read("input-text")).toBeUndefined();
	});

	it("leaves out the sections a component has nothing for", () => {
		const tabs = texts.get("tabs") ?? "";

		expect(tabs).toContain("doesn't implement it");
		expect(tabs).not.toContain("## When to use");
		expect(tabs).not.toContain("## The tool");
	});

	it.each(["button", "checkbox", "dropdown", "grid", "pattern", "tabs"])(
		"renders the %s card",
		async (id) => {
			await expect(texts.get(id)).toMatchFileSnapshot(
				`__snapshots__/cards/${id}.md`,
			);
		},
	);
});
