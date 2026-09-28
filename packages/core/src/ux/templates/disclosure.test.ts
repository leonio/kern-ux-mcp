import { describe, expect, it } from "vitest";
import { buildDisclosure } from "./disclosure.js";

describe("buildDisclosure", () => {
	it("produces a details/summary element", () => {
		const result = buildDisclosure(
			{
				triggerLabel: "Mehr erfahren",
				content: "Hier steht der versteckte Inhalt.",
			},
			"de",
		);

		expect(result.html).toContain("<details");
		expect(result.html).toContain("<summary");
		expect(result.html).toContain("Mehr erfahren");
		expect(result.html).toContain("Hier steht der versteckte Inhalt.");
		expect(result.html).toContain("kern-accordion__item");
		expect(result.html).toContain("kern-accordion__body");
	});

	it("wraps text content in kern-body paragraph", () => {
		const result = buildDisclosure(
			{
				triggerLabel: "Details",
				content: "Some text.",
			},
			"en",
		);

		expect(result.html).toContain('<p class="kern-body">Some text.</p>');
	});

	it("does not escape HTML content when contentIsHtml is true", () => {
		const result = buildDisclosure(
			{
				triggerLabel: "Details",
				content: '<p class="kern-body">Custom <strong>HTML</strong></p>',
				contentIsHtml: true,
			},
			"de",
		);

		expect(result.html).toContain("<strong>HTML</strong>");
		expect(result.html).not.toContain("&lt;strong&gt;");
	});

	it("adds open attribute when open is true", () => {
		const result = buildDisclosure(
			{
				triggerLabel: "Open Section",
				content: "Visible by default.",
				open: true,
			},
			"de",
		);

		expect(result.html).toContain(
			'<details class="kern-accordion__item" open>',
		);
	});

	it("omits open attribute by default", () => {
		const result = buildDisclosure(
			{
				triggerLabel: "Closed Section",
				content: "Hidden by default.",
			},
			"de",
		);

		expect(result.html).not.toContain(" open");
	});

	it("includes chevron icon in summary", () => {
		const result = buildDisclosure(
			{
				triggerLabel: "Toggle",
				content: "Content.",
			},
			"de",
		);

		expect(result.html).toContain("kern-icon--chevron-right");
		expect(result.html).toContain('aria-hidden="true"');
	});

	it("escapes HTML in trigger label", () => {
		const result = buildDisclosure(
			{
				triggerLabel: "<script>alert(1)</script>",
				content: "Safe content.",
			},
			"de",
		);

		expect(result.html).not.toContain("<script>");
		expect(result.html).toContain("&lt;script&gt;");
	});

	it("renders recursive content blocks with grid and card nodes", () => {
		const result = buildDisclosure(
			{
				triggerLabel: "Mehr",
				contentBlocks: [
					{
						kind: "grid",
						grid: {
							columns: 1,
							columnsContent: [
								[
									{
										kind: "card",
										card: {
											header: { title: "Disclosure Card" },
											contentBlocks: [{ kind: "text", text: "Nested" }],
										},
									},
								],
							],
						},
					},
				],
			},
			"de",
		);

		expect(result.html).toContain("Disclosure Card");
		expect(result.html).toContain("Nested");
		expect(result.html).toContain("kern-container");
	});
});
