import { describe, expect, it } from "vitest";
import type { RecursiveContentNodeInput } from "../schemas/content-union.js";
import { buildCard } from "./card.js";

describe("buildCard", () => {
	it("should generate basic card with body", () => {
		const result = buildCard({ body: "Card content goes here." }, "de");
		expect(result.html).toContain('class="kern-card"');
		expect(result.html).toContain("<article");
		expect(result.html).toContain('class="kern-card__container"');
		expect(result.html).toContain('class="kern-card__body"');
		expect(result.html).toContain("Card content goes here.");
		expect(result.warnings).toEqual([]);
	});

	it("should apply size modifiers", () => {
		const small = buildCard({ body: "Small", size: "small" }, "en");
		expect(small.html).toContain("kern-card--small");

		const large = buildCard({ body: "Large", size: "large" }, "en");
		expect(large.html).toContain("kern-card--large");
	});

	it("should apply hug modifier", () => {
		const result = buildCard({ body: "Hugged", hug: true }, "de");
		expect(result.html).toContain("kern-card--hug");
	});

	it("should include media section", () => {
		const result = buildCard(
			{
				media: { src: "/images/photo.jpg", alt: "A nice photo" },
				body: "With image",
			},
			"en",
		);
		expect(result.html).toContain('class="kern-card__media"');
		expect(result.html).toContain("<img");
		expect(result.html).toContain('src="/images/photo.jpg"');
		expect(result.html).toContain('alt="A nice photo"');
	});

	it("should include header with title", () => {
		const result = buildCard(
			{
				header: { title: "Card Title" },
				body: "Body text",
			},
			"de",
		);
		expect(result.html).toContain('class="kern-card__header"');
		expect(result.html).toContain("<hgroup>");
		expect(result.html).toContain('class="kern-title"');
		expect(result.html).toContain("Card Title");
	});

	it("should honor configurable title level", () => {
		const result = buildCard(
			{
				header: { title: "Card Title", titleLevel: 3 },
			},
			"de",
		);
		expect(result.html).toContain('<h3 class="kern-title">Card Title</h3>');
	});

	it("should include preline and subline in header", () => {
		const result = buildCard(
			{
				header: {
					title: "Main Title",
					preline: "Category",
					subline: "Subtitle text",
				},
			},
			"en",
		);
		expect(result.html).toContain('class="kern-preline"');
		expect(result.html).toContain("Category");
		expect(result.html).toContain('class="kern-subline"');
		expect(result.html).toContain("Subtitle text");
	});

	it("should make card interactive with stretched link", () => {
		const result = buildCard(
			{
				header: { title: "Clickable Card", href: "/details" },
				body: "Click anywhere",
			},
			"de",
		);
		expect(result.html).toContain("kern-card--interactive");
		expect(result.html).toContain('class="kern-link--stretched"');
		expect(result.html).toContain('href="/details"');
	});

	it("should include footer with buttons", () => {
		const result = buildCard(
			{
				body: "Card content",
				footer: { primaryLabel: "Submit", secondaryLabel: "Cancel" },
			},
			"en",
		);
		expect(result.html).toContain('class="kern-card__footer"');
		expect(result.html).toContain("kern-btn--primary");
		expect(result.html).toContain("Submit");
		expect(result.html).toContain("kern-btn--secondary");
		expect(result.html).toContain("Cancel");
		expect(result.html).toContain(
			'type="button" class="kern-btn kern-btn--primary"',
		);
		expect(result.html).toContain(
			'type="button" class="kern-btn kern-btn--secondary"',
		);
	});

	it("should escape HTML in body by default", () => {
		const result = buildCard({ body: "<script>alert('xss')</script>" }, "de");
		expect(result.html).toContain("&lt;script&gt;");
		expect(result.html).not.toContain("<script>");
	});

	it("should allow raw HTML when bodyIsHtml is true", () => {
		const result = buildCard(
			{ body: "<strong>Bold text</strong>", bodyIsHtml: true },
			"en",
		);
		expect(result.html).toContain("<strong>Bold text</strong>");
	});

	it("should render structured content blocks in body", () => {
		const result = buildCard(
			{
				contentBlocks: [
					{ kind: "text", text: "Intro text" },
					{
						kind: "badge",
						badge: { type: "info", text: "New", showIcon: true },
					},
					{ kind: "button", button: { variant: "primary", label: "Open" } },
				],
			},
			"en",
		);

		expect(result.html).toContain('<p class="kern-body">Intro text</p>');
		expect(result.html).toContain("kern-badge--info");
		expect(result.html).toContain("kern-btn--primary");
		expect(result.html).toContain("Open");
	});

	it("should render nested card nodes inside content blocks", () => {
		const result = buildCard(
			{
				header: { title: "Outer" },
				contentBlocks: [
					{
						kind: "card",
						card: {
							header: { title: "Inner" },
							contentBlocks: [{ kind: "text", text: "Nested text" }],
						},
					},
				],
			},
			"de",
		);

		expect(result.html).toContain("Outer");
		expect(result.html).toContain("Inner");
		expect(result.html).toContain("Nested text");
		expect(
			result.html.match(/class="kern-card/g)?.length ?? 0,
		).toBeGreaterThanOrEqual(2);
	});

	it("should reject content blocks beyond max recursive depth", () => {
		const tooDeepTree: RecursiveContentNodeInput = {
			kind: "card",
			card: {
				header: { title: "Level 1" },
				contentBlocks: [
					{
						kind: "card",
						card: {
							header: { title: "Level 2" },
							contentBlocks: [
								{
									kind: "card",
									card: {
										header: { title: "Level 3" },
										contentBlocks: [
											{
												kind: "card",
												card: {
													header: { title: "Level 4" },
													contentBlocks: [
														{
															kind: "text",
															text: "Level 5",
														},
													],
												},
											},
										],
									},
								},
							],
						},
					},
				],
			},
		};

		expect(() => buildCard({ contentBlocks: [tooDeepTree] }, "de")).toThrow(
			"Maximale Verschachtelungstiefe",
		);
	});
});
