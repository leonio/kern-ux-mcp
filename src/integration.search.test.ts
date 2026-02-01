import { describe, expect, it } from "vitest";

import { formatInputValidationError } from "./server.js";
import { RecursiveContentBlocksSchema } from "./ux/schemas/content-union.js";
import { createTools } from "./ux/tools.js";
import type { ComponentInfo, Registry } from "./ux/types.js";

function createRegistry(components: ComponentInfo[] = []): Registry {
	return {
		manifestVersion: "test",
		generatedAt: new Date().toISOString(),
		tokens: { colors: [], spacing: [], rawVariables: [] },
		components,
		byId: new Map(
			components.map((component) => [component.id, component] as const),
		),
	};
}

/**
 * Integration tests based on the "Elterngeld search results" scenario:
 * SearchInput + Filter Button + CardGroup where each Card has Badge + Heading + Link.
 * Tests deep nested composition, discriminator errors, and pedagogical error messages.
 */
describe("Elterngeld search-result composition", () => {
	const searchResultComposition = [
		{
			kind: "section",
			section: {
				headingText: "Suchergebnisse für 'Elterngeld'",
				headingLevel: 2,
				contentBlocks: [
					{
						kind: "html",
						html: '<input type="search" class="kern-input" placeholder="Suchbegriff eingeben" value="Elterngeld" />',
					},
					{
						kind: "button",
						button: { label: "Filter", variant: "secondary" },
					},
				],
			},
		},
		{
			kind: "grid",
			grid: {
				columns: 1,
				columnsContent: [
					[
						{
							kind: "card",
							card: {
								header: { title: "Elterngeld beantragen", titleLevel: 3 },
								contentBlocks: [
									{
										kind: "badge",
										badge: { type: "info", text: "Familienleistung" },
									},
									{
										kind: "text",
										text: "Informationen zum Elterngeld-Antrag und den Voraussetzungen.",
									},
									{
										kind: "html",
										html: '<a href="/elterngeld.pdf" class="kern-link">PDF herunterladen</a>',
									},
								],
							},
						},
						{
							kind: "card",
							card: {
								header: { title: "ElterngeldPlus", titleLevel: 3 },
								contentBlocks: [
									{ kind: "badge", badge: { type: "success", text: "Neu" } },
									{
										kind: "text",
										text: "Erweitertes Elterngeld mit Teilzeitarbeit kombinieren.",
									},
									{
										kind: "html",
										html: '<a href="/elterngeld-plus.pdf" class="kern-link">PDF herunterladen</a>',
									},
								],
							},
						},
						{
							kind: "card",
							card: {
								header: { title: "Partnerschaftsbonus", titleLevel: 3 },
								contentBlocks: [
									{
										kind: "badge",
										badge: { type: "warning", text: "Frist beachten" },
									},
									{
										kind: "text",
										text: "Bonus für Paare, die sich die Kinderbetreuung teilen.",
									},
									{
										kind: "html",
										html: '<a href="/bonus.pdf" class="kern-link">PDF herunterladen</a>',
									},
								],
							},
						},
					],
				],
			},
		},
	] as const;

	it("validates full 4-level nested search-result composition", () => {
		// section > grid > card > badge/text/html = 4 levels
		const parsed = RecursiveContentBlocksSchema.safeParse(
			searchResultComposition,
		);
		expect(parsed.success).toBe(true);
	});

	it("renders the full search-result layout via render_composition", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");
		expect(tool).toBeDefined();

		const result = (await tool?.handler({
			locale: "de",
			contentBlocks: searchResultComposition as any,
		})) as { html: string; warnings: string[] };

		// Verify key structural elements are present
		expect(result.html).toContain("Suchergebnisse");
		expect(result.html).toContain("Elterngeld beantragen");
		expect(result.html).toContain("Familienleistung");
		expect(result.html).toContain("ElterngeldPlus");
		expect(result.html).toContain("PDF herunterladen");
		expect(result.html).toContain("kern-badge");
		expect(result.html).toContain("kern-card");
	});

	it("produces pedagogical hint when kind is missing entirely", () => {
		const blocks = [{ type: "section", headingText: "Test" }];

		const parsed = RecursiveContentBlocksSchema.safeParse(blocks);
		expect(parsed.success).toBe(false);
		if (parsed.success) {
			throw new Error("Expected content blocks parsing to fail");
		}

		const message = formatInputValidationError(
			"render_composition",
			parsed.error,
		);

		// Should NOT contain the "wall of noise" listing every branch
		expect(message).not.toContain("must have required property 'text'");
		// Should contain the pedagogical hint
		expect(message).toContain("kind");
		expect(message).toContain("Cheat sheet");
		expect(message).toContain("card");
		expect(message).toContain("section");
	});

	it("produces pedagogical hint when kind value is invalid", () => {
		const blocks = [{ kind: "paragraph", text: "Hello" }];

		const parsed = RecursiveContentBlocksSchema.safeParse(blocks);
		expect(parsed.success).toBe(false);
		if (parsed.success) {
			throw new Error("Expected content blocks parsing to fail");
		}

		const message = formatInputValidationError(
			"render_composition",
			parsed.error,
		);

		expect(message).toContain("Invalid or missing 'kind'");
		expect(message).toContain("text, html, button, badge");
		expect(message).toContain("Cheat sheet");
	});

	it("produces useful hint when kind is correct but shape is wrong", () => {
		const blocks = [
			{
				kind: "section",
				headingText: "Test",
				contentBlocks: [{ kind: "text", text: "p1" }],
			},
		];

		const parsed = RecursiveContentBlocksSchema.safeParse(blocks);
		expect(parsed.success).toBe(false);
		if (parsed.success) {
			throw new Error("Expected content blocks parsing to fail");
		}

		const message = formatInputValidationError(
			"render_composition",
			parsed.error,
		);

		// Should suggest the cheat sheet rather than a generic wall of errors
		expect(message).toContain("Cheat sheet");
		// Should not be a wall of 9+ branch failures
		const issueCount = (message.match(/^- /gm) ?? []).length;
		expect(issueCount).toBeLessThanOrEqual(5);
	});

	it("includes cheat sheet examples for all 9 kinds", () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");
		expect(tool).toBeDefined();

		const desc = tool?.description;
		expect(desc).toContain('kind: "text"');
		expect(desc).toContain('kind: "html"');
		expect(desc).toContain('kind: "button"');
		expect(desc).toContain('kind: "badge"');
		expect(desc).toContain('kind: "card"');
		expect(desc).toContain('kind: "section"');
		expect(desc).toContain('kind: "disclosure"');
		expect(desc).toContain('kind: "grid"');
		expect(desc).toContain('kind: "formFlow"');
	});

	it("description explicitly states kind is required", () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");
		expect(tool).toBeDefined();

		expect(tool?.description).toContain("MUSS");
		expect(tool?.description).toContain("kind");
	});

	it("section block accepts paragraphs shorthand and renders text blocks", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		const result = (await tool?.handler({
			locale: "de",
			contentBlocks: [
				{
					kind: "section",
					section: {
						headingText: "FAQ",
						paragraphs: ["Erste Frage", "Zweite Frage"],
					},
				},
			],
		})) as { html: string; warnings: string[] };

		expect(result.html).toContain("FAQ");
		expect(result.html).toContain("Erste Frage");
		expect(result.html).toContain("Zweite Frage");
		expect(result.html).toContain("kern-body");
	});

	it("section block prefers contentBlocks over paragraphs when both present", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		const result = (await tool?.handler({
			locale: "de",
			contentBlocks: [
				{
					kind: "section",
					section: {
						headingText: "Mixed",
						contentBlocks: [{ kind: "text", text: "From contentBlocks" }],
						paragraphs: ["From paragraphs"],
					},
				},
			],
		})) as { html: string; warnings: string[] };

		expect(result.html).toContain("From contentBlocks");
		// paragraphs should be ignored when contentBlocks is present
		expect(result.html).not.toContain("From paragraphs");
	});

	it("error message includes path with block index for multi-block failures", () => {
		const blocks = [
			{ kind: "text", text: "Valid block" },
			{ kind: "card", card: { header: { title: "Also valid" } } },
			{ kind: "unknown_kind", data: "bad" },
		];

		const parsed = RecursiveContentBlocksSchema.safeParse(blocks);
		expect(parsed.success).toBe(false);
		if (parsed.success) {
			throw new Error("Expected content blocks parsing to fail");
		}

		const message = formatInputValidationError(
			"render_composition",
			parsed.error,
		);

		// Should include the block index path (contentBlocks[2])
		expect(message).toContain("[2]");
		expect(message).toContain("kind");
	});

	it("grid block renders cards in columnsContent", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		const result = (await tool?.handler({
			locale: "de",
			contentBlocks: [
				{
					kind: "grid",
					grid: {
						columns: 3,
						columnsContent: [
							[{ kind: "text", text: "Col 1" }],
							[{ kind: "badge", badge: { type: "success", text: "OK" } }],
							[{ kind: "text", text: "Col 3" }],
						],
					},
				},
			],
		})) as { html: string; warnings: string[] };

		expect(result.html).toContain("Col 1");
		expect(result.html).toContain("kern-badge");
		expect(result.html).toContain("Col 3");
		expect(result.html).toContain("kern-col-md-4");
	});

	it("cheat sheet documents paragraphs shorthand for section", () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		expect(tool?.description).toContain("paragraphs");
		expect(tool?.description).toContain("columnsContent");
	});
});
