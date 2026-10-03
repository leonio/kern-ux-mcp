import { describe, expect, it } from "vitest";
import { invokeTool } from "../invoke.js";
import {
	callHandler,
	createRegistry,
	type RenderedToolResult,
} from "../test-support/tools.js";
import { createTools, VALIDATE_HTML_MAX_LENGTH } from "./tools.js";
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
			evidence: Array<{ source: string; note?: string }>;
		};
	};
};

describe("tool behaviour", () => {
	it("formats deprecated warning with object-style get_component_docs args", async () => {
		const registry = createRegistry([
			{
				id: "details",
				title: "Details",
				status: "deprecated",
				guidance: { de: "", en: "" },
				htmlCanonical: '<div class="kern-body">Legacy</div>',
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_details");

		expect(tool).toBeDefined();
		const result = await callHandler<RenderedToolResult>(tool, {});
		expect(result.warnings.join("\n")).toContain(
			"get_component_docs with { componentId: 'details' }",
		);
	});

	it("keeps status warnings of fallback component tools through output validation", async () => {
		const registry = createRegistry([
			{
				id: "details",
				title: "Details",
				status: "deprecated",
				guidance: { de: "", en: "" },
				htmlCanonical: '<div class="kern-body">Legacy</div>',
			},
		]);

		const tool = createTools(registry).getTool("get_details");
		expect(tool).toBeDefined();
		if (!tool) return;

		// invokeTool parses the handler result with outputSchema, which strips unknown keys.
		const result = (await invokeTool(tool, {})) as RenderedToolResult;
		expect(result.warnings.join("\n")).toContain(
			"get_component_docs with { componentId: 'details' }",
		);
	});

	it("validate_html rejects input longer than VALIDATE_HTML_MAX_LENGTH", async () => {
		const tool = createTools(createRegistry()).getTool("validate_html");
		expect(tool).toBeDefined();
		if (!tool) return;

		await expect(
			invokeTool(tool, { html: "x".repeat(VALIDATE_HTML_MAX_LENGTH + 1) }),
		).rejects.toThrow(/Invalid arguments for validate_html:\n- html: Too big/);
		await expect(invokeTool(tool, { html: "<p>ok</p>" })).resolves.toEqual({
			ok: true,
			issues: [],
		});
	});

	it("get_component_docs returns extracted docs plus the locale-selected notes about our tool", async () => {
		const registry = createRegistry([
			{
				id: "kopfzeile",
				title: "Kopfzeile",
				status: "stable",
				docs: {
					url: "https://www.kern-ux.de/komponenten/kopfzeile",
					summary: "The docs page in short",
					sections: [
						{
							heading: "Kurzbeschreibung",
							url: "https://www.kern-ux.de/komponenten/kopfzeile#kurzbeschreibung",
							summary: "The first section in short",
						},
						{
							heading: "Weitere Hinweise",
							url: "https://www.kern-ux.de/komponenten/kopfzeile#weitere-hinweise",
						},
					],
				},
			},
			{
				id: "loader",
				title: "Loader",
				status: "stable",
				summary: "Shows that something is loading.",
			},
			{ id: "body", title: "Body", status: "stable" },
		]);

		const tools = createTools(registry);
		const docsTool = tools.getTool("get_component_docs");

		expect(docsTool).toBeDefined();

		const result = await callHandler<DocsToolResult>(docsTool, {
			componentId: "kopfzeile",
			locale: "de",
		});
		expect(result.excerpt).toBe("The docs page in short");
		expect(result.sections).toEqual([
			{
				source: "https://www.kern-ux.de/komponenten/kopfzeile#kurzbeschreibung",
				heading: "Kurzbeschreibung",
				content: "The first section in short",
			},
		]);
		expect(result.reviewedGuidance?.status).toBe("reviewed");
		expect(result.reviewedGuidance?.summary.text).toContain(
			"Die Kopfzeile ist die schmale Leiste mit Bundesflagge",
		);
		expect(result.reviewedGuidance?.summary.evidence[0].source).toBe(
			"kern-ux-plain/stories/Kopfzeile/Kopfzeile.stories.js",
		);

		const resultEn = await callHandler<DocsToolResult>(docsTool, {
			componentId: "kopfzeile",
			locale: "en",
		});
		expect(resultEn.reviewedGuidance?.summary.text).toContain(
			"The tool renders the CSS variant of the upstream component",
		);

		const resultWithSummaryOnly = await callHandler<DocsToolResult>(docsTool, {
			componentId: "loader",
		});
		expect(resultWithSummaryOnly.excerpt).toBe(
			"Shows that something is loading.",
		);

		const resultWithoutDocs = await callHandler<DocsToolResult>(docsTool, {
			componentId: "body",
		});
		expect(resultWithoutDocs.excerpt).toContain(
			"No packaged component documentation available",
		);
		expect(resultWithoutDocs.reviewedGuidance).toBeUndefined();
	});

	it.each([
		["inputdate", "single browser-native date field"],
		["dropdown", "details/summary"],
	])(
		"get_component_docs serves the notes about the %s tool",
		async (componentId, phrase) => {
			const tools = createTools(
				createRegistry([
					{ id: componentId, title: componentId, status: "stable" },
				]),
			);
			const result = await callHandler<DocsToolResult>(
				tools.getTool("get_component_docs"),
				{ componentId, locale: "en" },
			);

			expect(result.reviewedGuidance?.summary.text).toContain(phrase);
		},
	);

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
		const component = (id: string): ComponentInfo => ({
			id,
			title: id,
			status: "stable",
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
				createRegistry([component("button"), component("heading")]),
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

			it("lists the registry file plus the kern-ux-plain sources", async () => {
				const tools = createTools(
					createRegistry([
						{
							...component("heading"),
							sources: ["heading.scss", "Heading.stories.js"],
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
					entry: component("button"),
					expected: ["get_grid", "validate_html", "get_icon", "list_icons"],
				},
				{
					entry: component("dialog"),
					expected: ["get_grid", "validate_html", "get_button"],
				},
				{
					entry: component("card"),
					expected: [
						"get_grid",
						"validate_html",
						"get_button",
						"get_card_group",
					],
				},
				{
					entry: component("heading"),
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
