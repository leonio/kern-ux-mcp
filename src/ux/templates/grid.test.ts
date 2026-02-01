import { describe, expect, it } from "vitest";
import { GridRenderSchema } from "../schemas/grid.js";
import { buildGrid } from "./grid.js";

describe("buildGrid", () => {
	it("builds grid with responsive column classes", () => {
		const result = buildGrid({ columns: 3 });
		expect(result.html).toContain("Spalte 3");
		expect(result.html).toContain('class="kern-row"');
		expect(result.html).toContain("kern-col-md-4");
		expect(result.html).toContain("kern-col-sm-12");
	});

	it("calculates correct column span for 2 columns", () => {
		const result = buildGrid({ columns: 2 });
		expect(result.html).toContain("kern-col-md-6");
		expect(result.html).toContain("kern-col-sm-12");
	});

	it("calculates correct column span for 4 columns", () => {
		const result = buildGrid({ columns: 4 });
		expect(result.html).toContain("kern-col-md-3");
	});

	it("includes a warning about the two layout systems", () => {
		const result = buildGrid({ columns: 2 });
		expect(result.warnings.length).toBeGreaterThan(0);
		expect(result.warnings[0]).toContain("12-column");
		expect(result.warnings[0]).toContain("CSS Grid");
	});

	it("rejects 5-column requests in the 12-column grid schema", () => {
		const parsed = GridRenderSchema.safeParse({ columns: 5 });
		expect(parsed.success).toBe(false);
	});

	it("supports fluid container and row alignment", () => {
		const result = buildGrid({
			columns: 2,
			containerFluid: true,
			rowAlignment: "center",
		});
		expect(result.html).toContain('class="kern-container-fluid"');
		expect(result.html).toContain('class="kern-row kern-align-items-center"');
	});

	it("supports configurable heading level", () => {
		const result = buildGrid({
			columns: 2,
			includeHeading: true,
			headingLevel: 3,
			headingText: "Titel",
		});
		expect(result.html).toContain('<h3 class="kern-heading-medium">Titel</h3>');
	});

	it("renders recursive column content including cards", () => {
		const result = buildGrid(
			{
				columns: 2,
				columnsContent: [
					[
						{
							kind: "card",
							card: {
								header: { title: "Karte im Grid" },
								contentBlocks: [{ kind: "text", text: "Inhalt" }],
							},
						},
					],
					[{ kind: "text", text: "Zweite Spalte" }],
				],
			},
			"de",
		);

		expect(result.html).toContain("Karte im Grid");
		expect(result.html).toContain("Inhalt");
		expect(result.html).toContain("Zweite Spalte");
		expect(result.html).toContain("kern-card");
	});
});
