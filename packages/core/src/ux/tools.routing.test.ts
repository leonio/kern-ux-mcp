import { describe, expect, it } from "vitest";

import {
	callHandler,
	createRegistry,
	type RenderedToolResult,
} from "../test-support/tools.js";
import { loadRegistryFromManifest } from "./registry.js";
import {
	assertComponentToolsInRegistry,
	COMPONENT_TOOL_IDS,
	getComponentToolStrategy,
} from "./tool-builders/component-tools.js";
import { buildInteractiveTool } from "./tool-builders/interactive.js";
import { buildLayoutTool } from "./tool-builders/layout.js";
import { buildTypographyTool } from "./tool-builders/typography.js";
import { createTools } from "./tools.js";
import type { ComponentInfo } from "./types.js";

describe("createTools routing", () => {
	it("routes strategy=layout components to layout builder", async () => {
		const registry = createRegistry([
			{
				id: "descriptionlist",
				title: "DescriptionList",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_descriptionlist");

		expect(tool).toBeDefined();

		const result = await callHandler<RenderedToolResult>(tool, {
			items: [{ key: "Name", value: "Max" }],
			stacked: true,
		});
		expect(result.html).toContain("kern-description-list--col");
	});

	it("routes strategy=typography components and infers kind from component id", async () => {
		const registry = createRegistry([
			{
				id: "heading",
				title: "Heading",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_heading");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("h1 to h6");

		const result = await callHandler<RenderedToolResult>(tool, {
			text: "Titel",
			level: 3,
		});
		expect(result.html).toContain("kern-heading-medium");
		expect(result.html).toContain("<h3");
	});

	it("uses dedicated divider tooling for foundational divider component", async () => {
		const registry = createRegistry([
			{
				id: "divider",
				title: "Divider",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_divider");

		expect(tool).toBeDefined();
		const result = await callHandler<RenderedToolResult>(tool, {
			decorative: true,
		});
		expect(result.html).toContain("kern-divider");
	});

	it("uses dedicated body tooling for foundational body component", async () => {
		const registry = createRegistry([
			{
				id: "body",
				title: "Body",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_body");

		expect(tool).toBeDefined();
		const result = await callHandler<RenderedToolResult>(tool, {
			text: "Text",
			bold: true,
		});
		expect(result.html).toContain("kern-body--bold");
	});

	it("uses dedicated label tooling for foundational label component", async () => {
		const registry = createRegistry([
			{
				id: "label",
				title: "Label",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_label");

		expect(tool).toBeDefined();
		const result = await callHandler<RenderedToolResult>(tool, {
			text: "Feld",
		});
		expect(result.html).toContain("kern-label");
	});

	it("uses dedicated lists tooling for foundational lists component", async () => {
		const registry = createRegistry([
			{
				id: "lists",
				title: "Lists",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_lists");

		expect(tool).toBeDefined();
		const result = await callHandler<RenderedToolResult>(tool, {
			ordered: true,
			text: "Punkt",
		});
		expect(result.html).toContain("<ol");
	});

	it("uses dedicated title tooling for foundational title component", async () => {
		const registry = createRegistry([
			{
				id: "title",
				title: "Title",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_title");

		expect(tool).toBeDefined();
		const result = await callHandler<RenderedToolResult>(tool, {
			text: "Seitentitel",
			size: "small",
		});
		expect(result.html).toContain("kern-title--small");
	});

	it("routes interactive fallback inputemail to parameterized input-email tooling", async () => {
		const registry = createRegistry([
			{
				id: "inputemail",
				title: "InputEmail",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_inputemail");

		expect(tool).toBeDefined();

		const result = await callHandler<RenderedToolResult>(tool, {
			name: "mail",
			label: "E-Mail",
		});
		expect(result.html).toContain('type="email"');
	});

	it("routes interactive fallback inputfile to parameterized input-file tooling", async () => {
		const registry = createRegistry([
			{
				id: "inputfile",
				title: "InputFile",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_inputfile");

		expect(tool).toBeDefined();

		const result = await callHandler<RenderedToolResult>(tool, {
			name: "upload",
			label: "Datei",
		});
		expect(result.html).toContain('type="file"');
	});

	it("routes interactive fallback tasklist to parameterized tasklist tooling", async () => {
		const registry = createRegistry([
			{
				id: "tasklist",
				title: "Tasklist",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_tasklist");

		expect(tool).toBeDefined();

		const result = await callHandler<RenderedToolResult>(tool, {
			heading: "Aufgaben",
			items: [
				{
					title: "Aufgabe",
					href: "#",
					status: "Erledigt",
					statusType: "success",
				},
			],
		});
		expect(result.html).toContain("kern-task-list");
	});

	it("uses dedicated grid tooling for foundational grid component", async () => {
		const registry = createRegistry([
			{
				id: "grid",
				title: "Grid",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_grid");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("kern-grid kern-grid-cols-5");
		const result = await callHandler<RenderedToolResult>(tool, {
			columns: 3,
		});
		expect(result.html).toContain("Spalte 3");
		expect(result.warnings).toEqual([]);
	});

	it("uses dedicated fieldset tooling for foundational fieldset component", async () => {
		const registry = createRegistry([
			{
				id: "fieldset",
				title: "Fieldset",
				status: "stable",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_fieldset");

		expect(tool).toBeDefined();
		const result = await callHandler<RenderedToolResult>(tool, {
			legend: "Kontakt",
			hint: "Wir melden uns per E-Mail.",
			contentBlocks: [
				{
					kind: "field",
					field: { type: "email", name: "email", label: "E-Mail" },
				},
			],
		});
		expect(result.html).toContain('class="kern-fieldset"');
		expect(result.html).toContain('class="kern-hint"');
		expect(result.html).toContain('name="email"');
		expect(result.validation.ok).toBe(true);
	});

	describe("routing by COMPONENT_TOOLS", () => {
		// The code's table decides which components get a tool and how it's built.
		const component = (
			id: string,
			extra: Partial<ComponentInfo> = {},
		): ComponentInfo => ({
			id,
			title: id,
			status: "stable",
			...extra,
		});

		it("builds layout tools by the table", async () => {
			const tools = createTools(createRegistry([component("divider")]));
			const result = await callHandler<RenderedToolResult>(
				tools.getTool("get_divider"),
				{ decorative: true },
			);

			expect(result.html).toContain("kern-divider");
		});

		it("builds typography tools by the table", async () => {
			const tools = createTools(createRegistry([component("title")]));
			const result = await callHandler<RenderedToolResult>(
				tools.getTool("get_title"),
				{ text: "Seitentitel", size: "small" },
			);

			expect(result.html).toContain("kern-title--small");
		});

		it("gives no tool to a registry component outside the table, but still documents it", async () => {
			const tools = createTools(
				createRegistry([
					component("mystery", {
						htmlCanonical: '<div class="kern-mystery"></div>',
					}),
				]),
			);

			expect(tools.getTool("get_mystery")).toBeUndefined();
			const docs = await callHandler<{ componentId: string }>(
				tools.getTool("get_component_docs"),
				{ componentId: "mystery" },
			);
			expect(docs.componentId).toBe("mystery");
			const listed = await callHandler<{ components: Array<{ id: string }> }>(
				tools.getTool("list_components_by_category"),
				{},
			);
			expect(listed.components.map((c) => c.id)).not.toContain("mystery");
		});

		it("serves the registry's canonical HTML for fallback components", async () => {
			const canonical = '<search class="kern-form-input">Suche</search>';
			const tools = createTools(
				createRegistry([component("search", { htmlCanonical: canonical })]),
			);
			const tool = tools.getTool("get_search");

			expect(tool?.description).toBe(
				"KERN UX: KERN's example HTML for search, as is. No parameters besides locale and strict.",
			);
			const result = await callHandler<RenderedToolResult>(tool, {});
			expect(result.html).toBe(canonical);
			expect(result.validation.ok).toBe(true);
		});

		it("renders a placeholder when a fallback component has no canonical HTML", async () => {
			const tools = createTools(createRegistry([component("search")]));
			const result = await callHandler<RenderedToolResult>(
				tools.getTool("get_search"),
				{},
			);

			expect(result.html).toContain(
				"<!-- TODO: No story template found for search. -->",
			);
			expect(result.html).toContain('<div class="kern-search"></div>');
		});

		it("throws in strict mode when the canonical HTML fails validation", async () => {
			const tools = createTools(
				createRegistry([
					component("search", { htmlCanonical: '<img src="x.png">' }),
				]),
			);

			await expect(
				tools.getTool("get_search")?.handler({ strict: true }),
			).rejects.toThrow("Strict validation failed for get_search");
		});

		it.each([
			["interactive", buildInteractiveTool],
			["layout", buildLayoutTool],
			["typography", buildTypographyTool],
		])(
			"the %s builder rejects a component it has no tool for",
			(kind, build) => {
				expect(() => build(component("mystery"))).toThrow(
					`No ${kind} tool for component: mystery`,
				);
			},
		);

		it("lists every table entry's component as missing from an incomplete registry", () => {
			expect(() =>
				assertComponentToolsInRegistry(createRegistry([component("button")])),
			).toThrow(
				/registry\.json has no entry for accordion, alert, badge, body, /,
			);
		});

		it("finds every table entry's component in the checked-in registry", () => {
			const registry = loadRegistryFromManifest();

			expect(() => assertComponentToolsInRegistry(registry)).not.toThrow();
			expect(getComponentToolStrategy("index")).toBeUndefined();
			expect(createTools(registry).listToolNames()).toEqual(
				expect.arrayContaining(COMPONENT_TOOL_IDS.map((id) => `get_${id}`)),
			);
		});

		it.each<[string, object]>([
			["get_body", { text: "Fließtext" }],
			["get_heading", { text: "Titel", level: 2 }],
			["get_label", { text: "Feld" }],
			["get_link", { text: "Mehr erfahren", href: "/mehr" }],
			["get_lists", { text: "Punkt" }],
			["get_preline", { text: "Kategorie" }],
			["get_subline", { text: "Untertitel" }],
			["get_title", { text: "Titel" }],
			["get_descriptionlist", { items: [{ key: "Name", value: "Max" }] }],
			["get_divider", { decorative: true }],
			[
				"get_fieldset",
				{
					legend: "Kontakt",
					contentBlocks: [
						{
							kind: "field",
							field: { type: "email", name: "email", label: "E-Mail" },
						},
					],
				},
			],
			["get_grid", { columns: 2 }],
			["get_kopfzeile", {}],
		])(
			"%s renders valid markup from the checked-in registry",
			async (name, args) => {
				const tools = createTools(loadRegistryFromManifest());
				const result = await callHandler<RenderedToolResult>(
					tools.getTool(name),
					{ ...args, strict: true },
				);

				expect(result.html).toContain("kern-");
				expect(result.validation.ok).toBe(true);
			},
		);
	});

	it("prefixes experimental components with a banner and warning", async () => {
		const tools = createTools(
			createRegistry([
				{
					id: "search",
					title: "Search",
					status: "experimental",
					htmlCanonical: '<div class="kern-search"></div>',
				},
			]),
		);
		const result = await callHandler<RenderedToolResult>(
			tools.getTool("get_search"),
			{},
		);

		expect(result.html).toMatch(/^<!-- WARNING: Experimental Component/);
		expect(result.warnings).toEqual([
			"Component 'search' is experimental – API may change.",
		]);
	});
});
