import { describe, expect, it } from "vitest";
import { buildTypography } from "./typography.js";

describe("buildTypography", () => {
	it("renders heading with default level", () => {
		const result = buildTypography({ kind: "heading", text: "Titel" });

		expect(result.html).toContain('<h2 class="kern-heading-medium">Titel</h2>');
		expect(result.warnings).toEqual([]);
	});

	it("renders body with default text", () => {
		const result = buildTypography({ kind: "body" });

		expect(result.html).toContain('<p class="kern-body">Beispieltext</p>');
	});

	it("renders link with default href", () => {
		const result = buildTypography({ kind: "link", text: "Mehr" });

		expect(result.html).toContain('class="kern-link"');
		expect(result.html).toContain('href="#"');
		expect(result.html).toContain(">Mehr<");
	});

	it("renders ordered list when ordered=true", () => {
		const result = buildTypography({
			kind: "list",
			ordered: true,
			text: "Punkt",
		});

		expect(result.html).toContain('<ol class="kern-list">');
		expect(result.html).toContain("Punkt 1");
		expect(result.html).toContain("Punkt 2");
	});

	it("renders an unordered list by default", () => {
		const result = buildTypography({ kind: "list", text: "Punkt" });

		expect(result.html).toContain('<ul class="kern-list">');
		expect(result.html).not.toContain("<ol");
	});

	it("renders heading at the requested level", () => {
		const result = buildTypography({ kind: "heading", level: 4, text: "Titel" });

		expect(result.html).toBe('<h4 class="kern-heading-medium">Titel</h4>');
	});

	it("renders link with explicit href", () => {
		const result = buildTypography({
			kind: "link",
			text: "Mehr",
			href: "/mehr",
		});

		expect(result.html).toBe('<a class="kern-link" href="/mehr">Mehr</a>');
	});

	it.each([
		["body", '<p class="kern-body">Text</p>'],
		["label", '<label class="kern-label">Text</label>'],
		["preline", '<p class="kern-preline">Text</p>'],
		["subline", '<p class="kern-subline">Text</p>'],
		["title", '<h2 class="kern-title">Text</h2>'],
	] as const)("renders %s", (kind, expected) => {
		const result = buildTypography({ kind, text: "Text" });

		expect(result.html).toBe(expected);
		expect(result.warnings).toEqual([]);
	});

	it("rejects kinds outside the schema before reaching the renderer", () => {
		expect(() =>
			// @ts-expect-error unknown kind; this tests the schema guard.
			buildTypography({ kind: "banner", text: "Text" }),
		).toThrow();
	});
});
