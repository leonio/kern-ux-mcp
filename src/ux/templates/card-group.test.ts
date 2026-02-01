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

		expect(result.html).toContain("kern-container");
		expect(result.html).toContain("kern-row");
		expect(result.html).toContain("kern-col-md-4");
		expect(result.html).toContain("kern-col-sm-12");
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

		expect(result.html).toContain("kern-col-md-6");
		expect(result.html).toContain("kern-col-sm-12");
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

		expect(result.html).toContain("kern-col-md-4");
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

		expect(result.html).toContain("kern-col-md-3");
	});

	it("includes optional heading above cards", () => {
		const result = buildCardGroup(
			{
				heading: { text: "Unsere Angebote", level: 3 },
				cards: [{ header: { title: "Card" } }],
			},
			"de",
		);

		expect(result.html).toContain("<h3");
		expect(result.html).toContain("Unsere Angebote");
		expect(result.html).toContain("kern-heading-medium");
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

	it("rejects unsupported column values", () => {
		expect(() =>
			buildCardGroup(
				{
					cards: [{ header: { title: "A" } }, { header: { title: "B" } }],
					columns: 5,
				} as any,
				"de",
			),
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

	it("supports structured content blocks in grouped cards", () => {
		const result = buildCardGroup(
			{
				cards: [
					{
						header: { title: "Block Card" },
						contentBlocks: [
							{ kind: "badge", badge: { type: "success", text: "OK" } },
							{
								kind: "button",
								button: { variant: "secondary", label: "Details" },
							},
						],
					},
				],
			},
			"de",
		);

		expect(result.html).toContain("kern-badge--success");
		expect(result.html).toContain("kern-btn--secondary");
	});

	it("supports nested card nodes in grouped cards", () => {
		const result = buildCardGroup(
			{
				cards: [
					{
						header: { title: "Outer Card" },
						contentBlocks: [
							{
								kind: "card",
								card: {
									header: { title: "Inner Card" },
									contentBlocks: [{ kind: "text", text: "Inner body" }],
								},
							},
						],
					},
				],
			},
			"de",
		);

		expect(result.html).toContain("Outer Card");
		expect(result.html).toContain("Inner Card");
		expect(result.html).toContain("Inner body");
	});
});
