import { describe, expect, it } from "vitest";
import { GridRenderSchema } from "../schemas/grid.js";
import { standaloneContext } from "./composition-renderer.js";
import { buildGrid } from "./grid.js";

describe("buildGrid", () => {
	it("renders equal columns on kern-grid, one column on small screens, in a div of its own inside the container", () => {
		const result = buildGrid({
			columns: 3,
			includeHeading: true,
			headingText: "Partner",
		});

		expect(result.html).toBe(
			[
				'<div class="kern-container">',
				'  <div class="kern-flex kern-flex-col kern-gap-lg">',
				'    <h2 class="kern-heading-medium">Partner</h2>',
				'    <div class="kern-grid kern-grid-cols-1 kern-grid-cols-3-md kern-gap-lg">',
				"      <div>",
				'        <p class="kern-body">Spalte 1</p>',
				"      </div>",
				"      <div>",
				'        <p class="kern-body">Spalte 2</p>',
				"      </div>",
				"      <div>",
				'        <p class="kern-body">Spalte 3</p>',
				"      </div>",
				"    </div>",
				"  </div>",
				"</div>",
			].join("\n"),
		);
		expect(result.warnings).toEqual([]);
	});

	it("needs no breakpoint class for one column", () => {
		expect(buildGrid({ columns: 1 }).html).toContain(
			'class="kern-grid kern-grid-cols-1 kern-gap-lg"',
		);
	});

	it.each([5, 7, 12])("takes %i columns", (columns) => {
		const result = buildGrid({ columns });

		expect(result.html).toContain(`kern-grid-cols-${columns}-md`);
		expect(result.html).toContain(`Spalte ${columns}<`);
	});

	it.each([0, 13, 2.5])("rejects %s columns", (columns) => {
		expect(GridRenderSchema.safeParse({ columns }).success).toBe(false);
	});

	it("takes the column count from columnsContent when columns is missing", () => {
		const column = [{ kind: "text" as const, text: "Logo" }];
		const result = buildGrid({ columnsContent: Array(3).fill(column) });

		expect(result.html).toContain("kern-grid-cols-3-md");
		expect(result.html.match(/>Logo</g)).toHaveLength(3);
		expect(result.warnings).toEqual([]);
	});

	it("renders two columns without columns or columnsContent", () => {
		expect(buildGrid({}).html).toContain("kern-grid-cols-2-md");
	});

	it("warns when columnsContent doesn't match columns", () => {
		const column = [{ kind: "text" as const, text: "Logo" }];
		const result = buildGrid({
			columns: 2,
			columnsContent: Array(3).fill(column),
		});

		expect(result.html.match(/>Logo</g)).toHaveLength(2);
		expect(result.warnings).toEqual([
			expect.stringContaining("columnsContent length does not match columns"),
		]);
	});

	it("rejects more than 12 columnsContent lists", () => {
		const column = [{ kind: "text" as const, text: "x" }];
		expect(
			GridRenderSchema.safeParse({ columnsContent: Array(13).fill(column) })
				.success,
		).toBe(false);
	});

	it("keeps the plain div inside a surrounding container, so the container keeps its padding", () => {
		const result = buildGrid({ columns: 2, containerFluid: true }, "de", {
			...standaloneContext("de"),
			inContainer: true,
		});

		expect(result.html).toMatch(
			/^<div>\n {2}<div class="kern-grid kern-grid-cols-1 kern-grid-cols-2-md kern-gap-lg">/,
		);
		expect(result.html).not.toContain("kern-container");
		expect(result.warnings).toEqual([
			"containerFluid is ignored: this grid already sits inside a container.",
		]);
	});

	it("supports fluid container and row alignment", () => {
		const result = buildGrid({
			columns: 2,
			containerFluid: true,
			rowAlignment: "center",
		});
		expect(result.html).toMatch(
			/^<div class="kern-container-fluid">\n {2}<div>/,
		);
		expect(result.html).toContain(
			'class="kern-grid kern-grid-cols-1 kern-grid-cols-2-md kern-gap-lg kern-align-items-center"',
		);
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
