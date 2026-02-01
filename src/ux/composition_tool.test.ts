import { describe, expect, it } from "vitest";

import { createTools } from "./tools.js";
import type { ComponentInfo, Registry } from "./types.js";

type RenderedToolResult = {
	html: string;
	warnings: string[];
	validation: {
		ok: boolean;
	};
};

async function invokeTool<TResult>(
	tool: { handler(args: unknown): Promise<unknown> } | undefined,
	args: unknown,
): Promise<TResult> {
	expect(tool).toBeDefined();
	if (!tool) {
		throw new Error("Expected tool to be defined");
	}

	return (await tool.handler(args)) as TResult;
}

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

describe("render_composition tool", () => {
	it("renders side-by-side cards using 12-column math", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		expect(tool).toBeDefined();

		const result = await invokeTool<RenderedToolResult>(tool, {
			locale: "de",
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
										header: { title: "Linke Karte" },
										contentBlocks: [{ kind: "text", text: "Inhalt links" }],
									},
								},
							],
							[
								{
									kind: "card",
									card: {
										header: { title: "Rechte Karte" },
										contentBlocks: [{ kind: "text", text: "Inhalt rechts" }],
									},
								},
							],
						],
					},
				},
			],
		});

		expect(result.html).toContain("kern-container");
		expect(result.html).toContain("kern-row");
		expect(result.html).toContain("Linke Karte");
		expect(result.html).toContain("Rechte Karte");
		expect(result.html).toContain("Inhalt links");
		expect(result.html).toContain("Inhalt rechts");

		const colMatches = result.html.match(/kern-col-md-6 kern-col-sm-12/g) ?? [];
		expect(colMatches).toHaveLength(2);

		const cardMatches =
			result.html.match(/<article class="kern-card(?:\s|")/g) ?? [];
		expect(cardMatches).toHaveLength(2);

		expect(result.html).not.toContain("Spalte 1");
		expect(result.html).not.toContain("Spalte 2");
		expect(result.validation.ok).toBe(true);
	});

	it("fails in strict mode when validation errors are present", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		expect(tool).toBeDefined();

		await expect(
			tool?.handler({
				locale: "de",
				strict: true,
				contentBlocks: [
					{
						kind: "html",
						html: '<img src="/broken-without-alt.png">',
					},
				],
			}),
		).rejects.toThrow("Strict validation failed for render_composition");
	});

	it("rejects payloads exceeding max recursive depth at schema level", () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		expect(tool).toBeDefined();

		const tooDeepPayload = {
			contentBlocks: [
				{
					kind: "card",
					card: {
						header: { title: "L1" },
						contentBlocks: [
							{
								kind: "card",
								card: {
									header: { title: "L2" },
									contentBlocks: [
										{
											kind: "card",
											card: {
												header: { title: "L3" },
												contentBlocks: [
													{
														kind: "card",
														card: {
															header: { title: "L4" },
															contentBlocks: [
																{
																	kind: "card",
																	card: {
																		header: { title: "L5" },
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
							},
						],
					},
				},
			],
		};

		const parsed = tool?.inputSchema.safeParse(tooDeepPayload);
		expect(parsed?.success).toBe(false);
		if (parsed?.success) {
			throw new Error("Expected max-depth schema parsing to fail");
		}
		expect(
			parsed?.error.issues.some((issue) =>
				issue.message.includes("Maximale Verschachtelungstiefe"),
			),
		).toBe(true);
	});

	it("emits warning when grid columns and columnsContent length mismatch", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		expect(tool).toBeDefined();

		const result = await invokeTool<RenderedToolResult>(tool, {
			locale: "de",
			contentBlocks: [
				{
					kind: "grid",
					grid: {
						columns: 2,
						columnsContent: [[{ kind: "text", text: "Nur erste Spalte" }]],
					},
				},
			],
		});

		expect(
			result.warnings.some((warning: string) =>
				warning.includes("columnsContent length does not match columns"),
			),
		).toBe(true);
		expect(result.html).toContain("Nur erste Spalte");
		expect(result.html).toContain("Spalte 2");
		expect(result.validation.ok).toBe(true);
	});

	it("renders mixed recursive chain section -> grid -> card -> disclosure", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		expect(tool).toBeDefined();

		const result = await invokeTool<RenderedToolResult>(tool, {
			locale: "de",
			contentBlocks: [
				{
					kind: "section",
					section: {
						headingText: "Kompositionsbereich",
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
													header: { title: "Karte mit Disclosure" },
													contentBlocks: [
														{
															kind: "disclosure",
															disclosure: {
																triggerLabel: "Details anzeigen",
																open: true,
																contentBlocks: [
																	{ kind: "text", text: "Tiefer Inhalt" },
																],
															},
														},
													],
												},
											},
										],
									],
								},
							},
						],
					},
				},
			],
		});

		expect(result.html).toContain("Kompositionsbereich");
		expect(result.html).toContain("kern-container");
		expect(result.html).toContain("Karte mit Disclosure");
		expect(result.html).toContain("<details");
		expect(result.html).toContain("Details anzeigen");
		expect(result.html).toContain("Tiefer Inhalt");
		expect(result.warnings.join(" ")).not.toContain("skipped because no");
		expect(result.validation.ok).toBe(true);
	});
});
