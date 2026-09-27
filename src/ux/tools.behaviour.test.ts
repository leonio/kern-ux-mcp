import { describe, expect, it } from "vitest";

import {
	callHandler,
	createRegistry,
	type RenderedToolResult,
} from "../test-support/tools.js";
import { createTools } from "./tools.js";
import { type ComponentInfo, VALID_ICON_NAMES } from "./types.js";

type DocsToolResult = {
	excerpt: string;
	files?: string[];
	relatedTools?: string[];
	sections?: Array<{ content: string }>;
	reviewedGuidance?: {
		status: string;
		summary: {
			text: string;
			evidence: Array<{ note?: string }>;
		};
	};
};

describe("tool behaviour", () => {
	it("formats deprecated warning with object-style get_component_docs args", async () => {
		const registry = createRegistry([
			{
				id: "legacycomponent",
				title: "LegacyComponent",
				status: "deprecated",
				category: "interactive",
				strategy: "fallback",
				guidance: { de: "", en: "" },
				htmlCanonical: '<div class="kern-body">Legacy</div>',
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_legacycomponent");

		expect(tool).toBeDefined();
		const result = await callHandler<RenderedToolResult>(tool, {});
		expect(result.warnings.join("\n")).toContain(
			"get_component_docs with { componentId: 'legacycomponent' }",
		);
	});

	it("get_component_docs returns extracted docs plus locale-selected reviewed guidance", async () => {
		const registry = createRegistry([
			{
				id: "kopfzeile",
				title: "Kopfzeile",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				docs: {
					excerpt: "Sanitized docs excerpt",
					sections: [
						{
							source: "COMPONENTS.MD",
							heading: "Kopfzeile",
							content: "Sanitized section content",
						},
					],
				},
				reviewedGuidance: {
					status: "reviewed",
					summary: {
						text: {
							de: "Kuratiertes Summary DE",
							en: "Curated summary EN",
						},
						confidence: "high",
						evidence: [
							{
								kind: "story",
								source: "kern-ux-plain/stories/Kopfzeile/Kopfzeile.stories.js",
								note: {
									de: "Story-Hinweis DE",
									en: "Story note EN",
								},
							},
						],
					},
					primaryUseCases: [],
					antiUseCases: [],
					requiredA11yPractices: [],
					semanticInvariants: [],
					compositionPatterns: [],
					authoringNotes: [],
					migrationNotes: [],
				},
			},
			{
				id: "body",
				title: "Body",
				status: "stable",
				category: "foundational",
				strategy: "typography",
			},
		]);

		const tools = createTools(registry);
		const docsTool = tools.getTool("get_component_docs");

		expect(docsTool).toBeDefined();

		const result = await callHandler<DocsToolResult>(docsTool, {
			componentId: "kopfzeile",
			locale: "de",
		});
		expect(result.excerpt).toBe("Sanitized docs excerpt");
		expect(result.sections?.[0].content).toBe("Sanitized section content");
		expect(result.reviewedGuidance?.status).toBe("reviewed");
		expect(result.reviewedGuidance?.summary.text).toBe(
			"Kuratiertes Summary DE",
		);
		expect(result.reviewedGuidance?.summary.evidence[0].note).toBe(
			"Story-Hinweis DE",
		);

		const resultEn = await callHandler<DocsToolResult>(docsTool, {
			componentId: "kopfzeile",
			locale: "en",
		});
		expect(resultEn.reviewedGuidance?.summary.text).toBe("Curated summary EN");
		expect(resultEn.reviewedGuidance?.summary.evidence[0].note).toBe(
			"Story note EN",
		);

		const resultWithoutDocs = await callHandler<DocsToolResult>(docsTool, {
			componentId: "body",
		});
		expect(resultWithoutDocs.excerpt).toContain(
			"No packaged component documentation available",
		);
		expect(resultWithoutDocs.reviewedGuidance).toBeUndefined();
	});

	it("get_utility_reference returns surface section with background custom properties", async () => {
		const tools = createTools(createRegistry([]));
		const tool = tools.getTool("get_utility_reference");

		const result = (await tool?.handler({ category: "surface" })) as {
			sections: Array<{ id: string; entries: Array<{ className: string }> }>;
		};

		expect(result.sections).toHaveLength(1);
		expect(result.sections[0].id).toBe("surface");
		expect(
			result.sections[0].entries.some(
				(e) => e.className === "--kern-color-background-subtle",
			),
		).toBe(true);
		expect(
			result.sections[0].entries.some(
				(e) => e.className === "--kern-color-surface-success",
			),
		).toBe(true);
	});

	describe("utility and discovery tools", () => {
		const component = (
			id: string,
			category: ComponentInfo["category"],
			strategy: ComponentInfo["strategy"],
		): ComponentInfo => ({
			id,
			title: id,
			status: "stable",
			category,
			strategy,
		});

		it("validate_html returns the validator result for the given markup", async () => {
			const tools = createTools(createRegistry());
			const result = await callHandler<{
				ok: boolean;
				issues: Array<{ ruleId: string }>;
			}>(tools.getTool("validate_html"), { html: '<img src="x.png">' });

			expect(result.ok).toBe(false);
			expect(result.issues.map((i) => i.ruleId)).toEqual(["img.alt"]);
		});

		it("get_tokens returns the registry token snapshot", async () => {
			const tokens = {
				colors: ["--kern-color-action-default"],
				spacing: ["--kern-space-small"],
				rawVariables: ["--kern-font-size"],
			};
			const tools = createTools({ ...createRegistry(), tokens });

			expect(await callHandler(tools.getTool("get_tokens"), {})).toEqual(
				tokens,
			);
		});

		it("list_icons returns a copy of every valid icon name", async () => {
			const tools = createTools(createRegistry());
			const result = await callHandler<{ icons: string[] }>(
				tools.getTool("list_icons"),
				{},
			);

			expect(result.icons).toEqual([...VALID_ICON_NAMES]);
			expect(result.icons).not.toBe(VALID_ICON_NAMES);
		});

		describe("list_components_by_category", () => {
			const tools = createTools(
				createRegistry([
					component("button", "interactive", "interactive"),
					component("heading", "foundational", "typography"),
				]),
			);
			type Listed = {
				components: Array<{ id: string; category: string; strategy: string }>;
			};
			const list = (args: object) =>
				callHandler<Listed>(tools.getTool("list_components_by_category"), args);

			it("lists manifest components plus the composition tools", async () => {
				const { components } = await list({});

				expect(components.map((c) => c.id)).toEqual([
					"button",
					"heading",
					"section",
					"card_group",
					"disclosure",
				]);
				expect(
					components
						.filter((c) => c.category === "composition")
						.every((c) => c.strategy === "composition"),
				).toBe(true);
			});

			it.each([
				["composition", ["section", "card_group", "disclosure"]],
				["foundational", ["heading"]],
				["interactive", ["button"]],
			])("filters by category=%s", async (category, expectedIds) => {
				const { components } = await list({ category });

				expect(components.map((c) => c.id)).toEqual(expectedIds);
			});
		});

		describe("get_component_docs", () => {
			it("throws for an unknown componentId", async () => {
				const tools = createTools(createRegistry());

				await expect(
					tools.getTool("get_component_docs")?.handler({ componentId: "nope" }),
				).rejects.toThrow("Unknown componentId: nope");
			});

			it("lists the registry file plus scss and story sources", async () => {
				const tools = createTools(
					createRegistry([
						{
							...component("heading", "foundational", "typography"),
							sources: {
								scss: ["heading.scss"],
								stories: ["Heading.stories.js"],
							},
						},
					]),
				);
				const result = await callHandler<DocsToolResult>(
					tools.getTool("get_component_docs"),
					{ componentId: "heading" },
				);

				expect(result.files).toEqual([
					"registry.json",
					"heading.scss",
					"Heading.stories.js",
				]);
			});

			it.each([
				{
					entry: component("button", "interactive", "interactive"),
					expected: ["get_grid", "validate_html", "get_icon", "list_icons"],
				},
				{
					entry: component("dialog", "interactive", "interactive"),
					expected: ["get_grid", "validate_html", "get_button"],
				},
				{
					entry: component("card", "interactive", "interactive"),
					expected: [
						"get_grid",
						"validate_html",
						"get_button",
						"get_card_group",
					],
				},
				{
					entry: component("heading", "foundational", "typography"),
					expected: undefined,
				},
			])(
				"suggests related tools for $entry.id",
				async ({ entry, expected }) => {
					const tools = createTools(createRegistry([entry]));
					const result = await callHandler<DocsToolResult>(
						tools.getTool("get_component_docs"),
						{ componentId: entry.id },
					);

					expect(result.relatedTools).toEqual(expected);
				},
			);
		});
	});

	describe("composition tools render valid markup in strict mode", () => {
		it.each<{ name: string; args: object; expectedFragments: string[] }>([
			{
				name: "get_section",
				args: { headingText: "Überblick", paragraphs: ["Erster Absatz"] },
				expectedFragments: ["<section", "Überblick", "Erster Absatz"],
			},
			{
				name: "get_card_group",
				args: {
					columns: 2,
					cards: [{ header: { title: "A" } }, { header: { title: "B" } }],
				},
				expectedFragments: ["kern-col-md-6", ">A<", ">B<"],
			},
			{
				name: "get_disclosure",
				args: { triggerLabel: "Details anzeigen", content: "Erklärungstext" },
				expectedFragments: ["<details", "Details anzeigen", "Erklärungstext"],
			},
		])("$name", async ({ name, args, expectedFragments }) => {
			const tools = createTools(createRegistry());
			const result = await callHandler<RenderedToolResult>(
				tools.getTool(name),
				{
					...args,
					strict: true,
				},
			);

			for (const fragment of expectedFragments) {
				expect(result.html).toContain(fragment);
			}
			expect(result.validation.ok).toBe(true);
		});
	});
});
