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
});
