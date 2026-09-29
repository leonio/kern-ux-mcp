import { describe, expect, it } from "vitest";
import { formatInputValidationHint } from "../invoke.js";
import {
	callHandler,
	createRegistry,
	type RenderedToolResult,
} from "../test-support/tools.js";
import { createTools } from "./tools.js";

describe("render_composition tool", () => {
	it("renders side-by-side cards using 12-column math", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		expect(tool).toBeDefined();

		const result = await callHandler<RenderedToolResult>(tool, {
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

		const result = await callHandler<RenderedToolResult>(tool, {
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

	it("renders mixed recursive chains section -> grid -> card and disclosure, four levels deep", async () => {
		const tools = createTools(createRegistry());
		const tool = tools.getTool("render_composition");

		expect(tool).toBeDefined();

		const args = {
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
									columns: 2,
									columnsContent: [
										[
											{
												kind: "card",
												card: {
													header: { title: "Karte" },
													contentBlocks: [
														{ kind: "text", text: "Karteninhalt" },
													],
												},
											},
										],
										[
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
									],
								},
							},
						],
					},
				},
			],
		};

		expect(tool?.inputSchema.safeParse(args).success).toBe(true);

		const result = await callHandler<RenderedToolResult>(tool, args);

		expect(result.html).toContain("Kompositionsbereich");
		expect(result.html).toContain("kern-container");
		expect(result.html).toContain("Karteninhalt");
		expect(result.html).toContain("<details");
		expect(result.html).toContain("Details anzeigen");
		expect(result.html).toContain("Tiefer Inhalt");
		expect(result.warnings.join(" ")).not.toContain("skipped");
		expect(result.validation.ok).toBe(true);
	});
});

describe("render_composition with field blocks", () => {
	it("renders fields of several types that pass strict validation", async () => {
		const tool = createTools(createRegistry()).getTool("render_composition");
		const args = {
			locale: "de",
			strict: true,
			contentBlocks: [
				{
					kind: "section",
					section: {
						headingText: "Kontakt",
						contentBlocks: [
							{
								kind: "field",
								field: { type: "text", name: "vorname", label: "Vorname" },
							},
							{
								kind: "field",
								field: {
									type: "email",
									name: "email",
									label: "E-Mail",
									error: "Bitte eine E-Mail-Adresse angeben.",
								},
							},
							{
								kind: "field",
								field: {
									type: "radio",
									name: "anrede",
									label: "Anrede",
									options: [
										{ value: "frau", label: "Frau" },
										{ value: "herr", label: "Herr" },
									],
								},
							},
						],
					},
				},
			],
		};

		expect(tool?.inputSchema.safeParse(args).success).toBe(true);

		const result = await callHandler<RenderedToolResult>(tool, args);

		expect(result.html).toContain('name="vorname"');
		expect(result.html).toContain('type="email"');
		expect(result.html).toContain('type="radio"');
		expect(result.warnings.join(" ")).not.toContain("skipped");
		expect(result.validation.ok).toBe(true);
	});
});

describe("render_composition with a form block", () => {
	it("renders a form with a fieldset, an error summary and actions that passes strict validation", async () => {
		const tool = createTools(createRegistry()).getTool("render_composition");
		const args = {
			locale: "de",
			strict: true,
			contentBlocks: [
				{
					kind: "form",
					form: {
						action: "/kontakt",
						errorSummary: {},
						contentBlocks: [
							{
								kind: "fieldset",
								fieldset: {
									legend: "Ihre Angaben",
									legendSize: "large",
									contentBlocks: [
										{
											kind: "field",
											field: { type: "text", name: "name", label: "Name" },
										},
										{
											kind: "field",
											field: {
												type: "email",
												name: "email",
												label: "E-Mail",
												error: "Bitte eine gültige E-Mail-Adresse angeben.",
											},
										},
									],
								},
							},
							{
								kind: "field",
								field: {
									type: "textarea",
									name: "nachricht",
									label: "Nachricht",
								},
							},
						],
						actions: { submitLabel: "Absenden" },
					},
				},
			],
		};

		expect(tool?.inputSchema.safeParse(args).success).toBe(true);

		const result = await callHandler<RenderedToolResult>(tool, args);

		expect(result.html).toContain(
			'<form action="/kontakt" method="post" novalidate>',
		);
		expect(result.html).toContain("kern-alert--danger");
		expect(result.html).toContain(
			"E-Mail: Bitte eine gültige E-Mail-Adresse angeben.",
		);
		expect(result.html).toContain('type="submit"');
		expect(result.validation.ok).toBe(true);
	});
});

describe("render_composition nesting rules", () => {
	const tool = createTools(createRegistry()).getTool("render_composition");

	function issuesOf(contentBlocks: unknown[]) {
		const parsed = tool?.inputSchema.safeParse({ contentBlocks });
		expect(parsed?.success).toBe(false);
		return (parsed?.error?.issues ?? []).map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		}));
	}

	it("rejects a section and a disclosure without content, instead of failing to render", () => {
		expect(
			issuesOf([
				{ kind: "section", section: { headingText: "Leer" } },
				{ kind: "disclosure", disclosure: { triggerLabel: "Leer" } },
			]),
		).toEqual([
			{
				path: "contentBlocks.0.section.contentBlocks",
				message: "A section needs contentBlocks or paragraphs.",
			},
			{
				path: "contentBlocks.1.disclosure.contentBlocks",
				message: "Invalid input: expected array, received undefined",
			},
		]);
	});

	it("rejects a form inside a formFlow step, with its path", () => {
		expect(
			issuesOf([
				{
					kind: "formFlow",
					formFlow: {
						currentStep: 1,
						steps: [
							{
								label: "Eins",
								contentBlocks: [
									{
										kind: "form",
										form: { contentBlocks: [{ kind: "text", text: "x" }] },
									},
								],
							},
							{ label: "Zwei" },
						],
					},
				},
			]),
		).toEqual([
			{
				path: "contentBlocks.0.formFlow.steps.0.contentBlocks.0",
				message: "A form can't sit inside a formFlow: forms don't nest.",
			},
		]);
	});

	it("allows a formFlow inside a section", () => {
		const parsed = tool?.inputSchema.safeParse({
			contentBlocks: [
				{
					kind: "section",
					section: {
						headingText: "Antrag",
						contentBlocks: [
							{
								kind: "formFlow",
								formFlow: {
									currentStep: 1,
									steps: [{ label: "Eins" }, { label: "Zwei" }],
								},
							},
						],
					},
				},
			],
		});

		expect(parsed?.success).toBe(true);
	});
});

describe("render_page tool", () => {
	it("renders a strict-valid document pinned to the registry's KERN version", async () => {
		const registry = {
			...createRegistry(),
			upstream: { package: "@kern-ux/native", version: "2.8.2" },
		};
		const tool = createTools(registry).getTool("render_page");
		const args = {
			locale: "de",
			strict: true,
			document: true,
			heading: "Kontakt",
			header: { title: "Stadt Musterstadt" },
			contentBlocks: [
				{
					kind: "form",
					form: {
						contentBlocks: [
							{
								kind: "field",
								field: { type: "email", name: "email", label: "E-Mail" },
							},
						],
						actions: { submitLabel: "Senden" },
					},
				},
			],
		};

		expect(tool?.inputSchema.safeParse(args).success).toBe(true);

		const result = await callHandler<RenderedToolResult>(tool, args);

		expect(result.html).toContain("@kern-ux/native@2.8.2/dist/kern.min.css");
		expect(result.html).toContain('<main id="main" class="kern-container">');
		expect(result.validation.ok).toBe(true);
	});

	it("gets the composition cheat sheet for bad blocks", () => {
		const tool = createTools(createRegistry()).getTool("render_page");
		const parsed = tool?.inputSchema.safeParse({
			contentBlocks: [{ kind: "absatz", text: "x" }],
		});
		if (!parsed || parsed.success) {
			throw new Error("Expected render_page input to be rejected");
		}

		const hint = formatInputValidationHint("render_page", parsed.error);
		expect(hint).toContain("Invalid or missing 'kind'");
		expect(hint).toContain("Cheat sheet for contentBlocks:");
	});
});

describe("standalone composition tools", () => {
	it("get_grid renders sections and disclosures in its columns, in the requested locale", async () => {
		const tools = createTools(
			createRegistry([
				{
					id: "grid",
					title: "Grid",
					status: "stable",
					category: "foundational",
					strategy: "layout",
					guidance: { de: "", en: "" },
				},
			]),
		);

		const result = await callHandler<RenderedToolResult>(
			tools.getTool("get_grid"),
			{
				locale: "en",
				columns: 2,
				columnsContent: [
					[
						{
							kind: "section",
							section: { headingText: "Left section", paragraphs: ["Text"] },
						},
					],
					[
						{
							kind: "formFlow",
							formFlow: {
								currentStep: 1,
								steps: [
									{
										label: "Start",
										contentBlocks: [
											{
												kind: "disclosure",
												disclosure: {
													triggerLabel: "More",
													contentBlocks: [{ kind: "text", text: "Hidden" }],
												},
											},
										],
									},
									{ label: "End" },
								],
							},
						},
					],
				],
			},
		);

		expect(result.html).toContain("Left section");
		expect(result.html).toContain("Hidden");
		expect(result.html).toContain("Step 1 of 2");
		expect(result.warnings.join(" ")).not.toContain("skipped");
	});
});
