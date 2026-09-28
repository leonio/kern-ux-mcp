import { describe, expect, it } from "vitest";
import { buildUtilityReference } from "./utility-reference.js";

describe("buildUtilityReference", () => {
	it("returns all sections when category is 'all'", () => {
		const result = buildUtilityReference({ category: "all" });
		expect(result.sections).toHaveLength(7);
		const ids = result.sections.map((s) => s.id);
		expect(ids).toEqual([
			"flex",
			"css-grid",
			"gap",
			"spacing",
			"surface",
			"stack",
			"alignment",
		]);
	});

	it("returns all sections when category is omitted", () => {
		const result = buildUtilityReference({});
		expect(result.sections).toHaveLength(7);
	});

	it("filters to a single category", () => {
		const result = buildUtilityReference({ category: "flex" });
		expect(result.sections).toHaveLength(1);
		expect(result.sections[0].id).toBe("flex");
		expect(result.sections[0].entries.length).toBeGreaterThan(0);
	});

	it("returns gap section with expected class names", () => {
		const result = buildUtilityReference({ category: "gap" });
		const names = result.sections[0].entries.map((e) => e.className);
		expect(names).toContain("kern-gap-md");
		expect(names).toContain("kern-gap-xl");
	});

	it("returns spacing section with margin and padding classes", () => {
		const result = buildUtilityReference({ category: "spacing" });
		const names = result.sections[0].entries.map((e) => e.className);
		expect(names).toContain("kern-m-{none|xxs|xs|sm|md|lg|xl}");
		expect(names).toContain("kern-p-{none|xxs|xs|sm|md|lg|xl}");
	});

	it("returns alignment section with all align/justify classes", () => {
		const result = buildUtilityReference({ category: "alignment" });
		const names = result.sections[0].entries.map((e) => e.className);
		expect(names).toContain("kern-align-items-center");
		expect(names).toContain("kern-justify-content-between");
		expect(names).toContain("kern-align-self-end");
	});

	it("includes examples where available", () => {
		const result = buildUtilityReference({ category: "stack" });
		const stackEntry = result.sections[0].entries[0];
		expect(stackEntry.example).toBeDefined();
		expect(stackEntry.example).toContain("kern-stack");
	});

	it("includes bilingual descriptions", () => {
		const result = buildUtilityReference({ category: "css-grid" });
		const section = result.sections[0];
		expect(section.titleDe).toBeTruthy();
		expect(section.titleEn).toBeTruthy();
		expect(section.entries[0].de).toBeTruthy();
		expect(section.entries[0].en).toBeTruthy();
	});
});
