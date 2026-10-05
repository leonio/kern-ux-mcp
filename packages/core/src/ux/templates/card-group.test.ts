import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";
import { buildCardGroup } from "./card-group.js";

describe("buildCardGroup", () => {
	it("produces a grid with multiple cards", () => {
		const result = buildCardGroup(
			{
				cards: [
					{ header: { title: "Card 1" }, body: "Body 1" },
					{ header: { title: "Card 2" }, body: "Body 2" },
					{ header: { title: "Card 3" }, body: "Body 3" },
				],
			},
			"de",
		);

		const root = parse(result.html);
		const grid = root.querySelector(".kern-container > div > .kern-grid");

		expect(grid?.getAttribute("class")).toBe(
			"kern-grid kern-grid-cols-1 kern-grid-cols-3-md kern-gap-lg",
		);
		// The cards are the grid's items, so a row's cards share one height.
		expect(grid?.querySelectorAll(":scope > article.kern-card")).toHaveLength(
			3,
		);
		// A kern-grid right inside kern-container takes its padding away.
		expect(root.querySelector(".kern-container > .kern-grid")).toBeNull();
		expect(result.html).toContain("Card 1");
		expect(result.html).toContain("Card 2");
		expect(result.html).toContain("Card 3");
		expect(result.html).toContain("kern-card");
	});

	it("respects explicit column count", () => {
		const result = buildCardGroup(
			{
				cards: [
					{ header: { title: "A" } },
					{ header: { title: "B" } },
					{ header: { title: "C" } },
					{ header: { title: "D" } },
				],
				columns: 2,
			},
			"de",
		);

		expect(result.html).toContain("kern-grid-cols-2-md");
	});

	it("auto-calculates columns from card count", () => {
		const result = buildCardGroup(
			{
				cards: [
					{ header: { title: "A" } },
					{ header: { title: "B" } },
					{ header: { title: "C" } },
				],
			},
			"de",
		);

		expect(result.html).toContain("kern-grid-cols-3-md");
	});

	it("caps auto columns at 4", () => {
		const result = buildCardGroup(
			{
				cards: [
					{ header: { title: "1" } },
					{ header: { title: "2" } },
					{ header: { title: "3" } },
					{ header: { title: "4" } },
					{ header: { title: "5" } },
				],
			},
			"de",
		);

		expect(result.html).toContain("kern-grid-cols-4-md");
	});

	it("includes optional heading above cards", () => {
		const result = buildCardGroup(
			{
				heading: { text: "Unsere Angebote", level: 3 },
				cards: [{ header: { title: "Card" } }],
			},
			"de",
		);

		expect(result.html).toContain(
			'<div class="kern-flex kern-flex-col kern-gap-lg">\n    <h3 class="kern-heading-medium">Unsere Angebote</h3>',
		);
	});

	it("supports card header title levels", () => {
		const result = buildCardGroup(
			{
				cards: [{ header: { title: "Card", titleLevel: 4 } }],
			},
			"de",
		);

		expect(result.html).toContain('<h4 class="kern-title">Card</h4>');
	});

	it("takes any column count up to one per card", () => {
		const cards = ["1", "2", "3", "4", "5"].map((title) => ({
			header: { title },
		}));

		expect(buildCardGroup({ cards, columns: 5 }, "de").html).toContain(
			"kern-grid-cols-5-md",
		);
		expect(buildCardGroup({ cards, columns: 12 }, "de").html).toContain(
			"kern-grid-cols-5-md",
		);
		expect(buildCardGroup({ cards: cards.slice(0, 1) }, "de").html).toContain(
			'class="kern-grid kern-grid-cols-1 kern-gap-lg"',
		);
	});

	it.each([0, 13])("rejects %i columns", (columns) => {
		expect(() =>
			buildCardGroup({ cards: [{ header: { title: "A" } }], columns }, "de"),
		).toThrow();
	});

	it("handles cards with different configurations", () => {
		const result = buildCardGroup(
			{
				cards: [
					{
						size: "small",
						header: { title: "Small Card" },
					},
					{
						size: "large",
						media: { src: "img.jpg", alt: "Photo" },
						header: { title: "Large Card", href: "/details" },
						body: "Description",
						footer: { primaryLabel: "Details" },
					},
				],
			},
			"de",
		);

		expect(result.html).toContain("kern-card--small");
		expect(result.html).toContain("kern-card--large");
		expect(result.html).toContain("kern-card--interactive");
	});

	it("supports simple content blocks in grouped cards", () => {
		const result = buildCardGroup(
			{
				cards: [
					{
						header: { title: "Block Card" },
						contentBlocks: [
							{ kind: "badge", badge: { type: "success", text: "OK" } },
							{ kind: "text", text: "Bearbeitung abgeschlossen" },
						],
						footer: { primaryLabel: "Details" },
					},
				],
			},
			"de",
		);

		expect(result.html).toContain("kern-badge--success");
		expect(result.html).toContain("Bearbeitung abgeschlossen");
		expect(result.html).toContain("kern-btn--primary");
	});

	it.each(["card", "button", "grid"])(
		"rejects a %s block inside a grouped card: containers go through render_composition",
		(kind) => {
			const build = () =>
				buildCardGroup(
					{
						cards: [
							{
								header: { title: "Outer Card" },
								contentBlocks: [
									// @ts-expect-error: grouped cards take text, html, badge and field blocks only
									{ kind, [kind]: {} },
								],
							},
						],
					},
					"de",
				);

			expect(build).toThrow(/contentBlocks/);
		},
	);
});
