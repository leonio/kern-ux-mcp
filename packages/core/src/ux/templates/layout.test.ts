import { describe, expect, it } from "vitest";
import { buildLayout } from "./layout.js";

describe("buildLayout", () => {
	it("renders container starter by default", () => {
		const result = buildLayout({});

		expect(result.html).toContain('class="kern-container"');
		expect(result.html).toContain("Inhalt");
		expect(result.warnings).toEqual([]);
	});

	it("renders container pattern with optional heading", () => {
		const result = buildLayout({
			pattern: "container",
			includeHeading: true,
			headingText: "Mein Abschnitt",
		});

		expect(result.html).toContain(
			'<h2 class="kern-heading-medium">Mein Abschnitt</h2>',
		);
	});

	it("clamps grid columns to max 6", () => {
		const result = buildLayout({ columns: 6 });

		expect(result.html).toContain("Inhalt");
		expect(result.html).not.toContain("Spalte");
	});
});
