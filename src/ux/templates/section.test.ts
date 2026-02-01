import { describe, expect, it } from "vitest";
import { buildSection } from "./section.js";

describe("buildSection", () => {
	it("produces section with heading and single paragraph", () => {
		const result = buildSection(
			{
				headingText: "Überblick",
				headingLevel: 2,
				paragraphs: ["Erster Absatz."],
			},
			"de",
		);

		expect(result.html).toContain("<h2");
		expect(result.html).toContain("kern-heading-medium");
		expect(result.html).toContain("Überblick");
		expect(result.html).toContain("kern-body");
		expect(result.html).toContain("Erster Absatz.");
		expect(result.html).toContain("<section>");
		expect(result.html).toContain("</section>");
	});

	it("produces multiple paragraphs with sizes", () => {
		const result = buildSection(
			{
				headingText: "Details",
				paragraphs: ["Normal text.", "Small note.", "Bold statement."],
				paragraphSize: "small",
				paragraphBold: true,
			},
			"en",
		);

		expect(result.html).toContain("kern-body");
		expect(result.html).toContain("kern-body--small");
		expect(result.html).toContain("kern-body--bold");
	});

	it("includes divider when requested", () => {
		const result = buildSection(
			{
				headingText: "Section",
				paragraphs: ["Content."],
				divider: true,
			},
			"de",
		);

		expect(result.html).toContain("kern-divider");
		expect(result.html).toContain('role="presentation"');
	});

	it("omits divider by default", () => {
		const result = buildSection(
			{
				headingText: "Section",
				paragraphs: ["Content."],
			},
			"de",
		);

		expect(result.html).not.toContain("kern-divider");
	});

	it("defaults heading level to h2", () => {
		const result = buildSection(
			{
				headingText: "Default",
				paragraphs: ["Text."],
			},
			"de",
		);

		expect(result.html).toContain("<h2");
		expect(result.html).toContain("</h2>");
	});

	it("escapes HTML in text content", () => {
		const result = buildSection(
			{
				headingText: "<script>alert(1)</script>",
				paragraphs: ["A & B <c>"],
			},
			"de",
		);

		expect(result.html).not.toContain("<script>");
		expect(result.html).toContain("&lt;script&gt;");
		expect(result.html).toContain("A &amp; B &lt;c&gt;");
	});

	it("supports recursive content blocks with grid and nested card", () => {
		const result = buildSection(
			{
				headingText: "Komposition",
				contentBlocks: [
					{
						kind: "grid",
						grid: {
							columns: 2,
							columnsContent: [
								[
									{
										kind: "card",
										card: {
											header: { title: "Grid Card" },
											contentBlocks: [{ kind: "text", text: "Card Body" }],
										},
									},
								],
								[{ kind: "text", text: "Rechte Spalte" }],
							],
						},
					},
				],
			},
			"de",
		);

		expect(result.html).toContain("Komposition");
		expect(result.html).toContain("kern-container");
		expect(result.html).toContain("Grid Card");
		expect(result.html).toContain("Card Body");
		expect(result.html).toContain("Rechte Spalte");
	});
});
