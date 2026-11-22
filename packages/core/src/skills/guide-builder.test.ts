import { describe, expect, it } from "vitest";

import { getCatalog } from "../mcp/catalog.js";
import { byteLength } from "../resources/definition.js";
import { loadRegistryFromManifest } from "../ux/registry.js";
import { validateHtmlStrict } from "../ux/validate.js";
import { GENERATED_SKILL_FILES } from "./generated.js";
import { buildGuide, GUIDES, readGuideFoundations } from "./guide-builder.js";

const foundations = await readGuideFoundations();
const sources = {
	registry: loadRegistryFromManifest(),
	tools: getCatalog().tools,
	foundations,
};

/** A guide stays small enough to read whole. */
const GUIDE_BUDGET_BYTES = 16_000;

describe("the guide builder", () => {
	it.each(GUIDES.map((guide) => guide.name))(
		"keeps the %s guide within the budget, its HTML strict-valid, and the same every time",
		async (name) => {
			const text = await buildGuide(name, sources);

			expect(byteLength(text)).toBeLessThanOrEqual(GUIDE_BUDGET_BYTES);
			for (const [, html] of text.matchAll(/```html\n([\s\S]*?)\n```/g)) {
				expect(validateHtmlStrict(html).ok).toBe(true);
			}
			expect(await buildGuide(name, sources)).toBe(text);
		},
	);

	it("quotes only sections the knowledge bundle has", () => {
		for (const guide of GUIDES) {
			for (const { quotes } of guide.kern) {
				for (const quote of quotes) {
					const page = foundations.get(quote.page);
					expect(page, `${guide.name}: ${quote.page}`).toBeDefined();
					const ids = page?.sections.map((section) => section.id) ?? [];
					for (const id of quote.sections) {
						expect(ids, `${guide.name}: ${quote.page}#${id}`).toContain(id);
					}
				}
			}
		}
	});

	it("fails for a guide it doesn't have", async () => {
		await expect(buildGuide("composition", sources)).rejects.toThrow(
			"There's no guide composition.",
		);
	});

	// A guide's text is checked in as a skill's reference, and skills.test.ts
	// fails when that file differs from what the builder writes now.
	it.each(GUIDES.map((guide) => guide.name))(
		"keeps the %s guide in a skill",
		(name) => {
			expect(GENERATED_SKILL_FILES.map((file) => file.guide)).toContain(name);
		},
	);
});
