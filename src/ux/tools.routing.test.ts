import { describe, expect, it } from "vitest";

import {
	createRegistry,
	invokeTool,
	type RenderedToolResult,
} from "../test-support/tools.js";
import { createTools } from "./tools.js";

describe("createTools routing", () => {
	it("routes strategy=layout components to layout builder", async () => {
		const registry = createRegistry([
			{
				id: "descriptionlist",
				title: "DescriptionList",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_descriptionlist");

		expect(tool).toBeDefined();

		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_heading");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("level 1-6");

		const result = await invokeTool<RenderedToolResult>(tool, {
			text: "Titel",
			level: 3,
		});
		expect(result.html).toContain("kern-heading-medium");
		expect(result.html).toContain("<h3");
	});

	it("keeps strict-mode error behavior for layout strategy tools", async () => {
		const registry = createRegistry([
			{
				id: "customlayout",
				title: "CustomLayout",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
				htmlCanonical: '<div class="kern-alert kern-alert--info"></div>',
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_customlayout");

		expect(tool).toBeDefined();

		await expect(tool?.handler({ strict: true, locale: "en" })).rejects.toThrow(
			"Strict validation failed for get_customlayout",
		);
	});

	it("uses dedicated divider tooling for foundational divider component", async () => {
		const registry = createRegistry([
			{
				id: "divider",
				title: "Divider",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_divider");

		expect(tool).toBeDefined();
		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_body");

		expect(tool).toBeDefined();
		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_label");

		expect(tool).toBeDefined();
		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_lists");

		expect(tool).toBeDefined();
		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_title");

		expect(tool).toBeDefined();
		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "interactive",
				strategy: "fallback",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_inputemail");

		expect(tool).toBeDefined();

		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "interactive",
				strategy: "fallback",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_inputfile");

		expect(tool).toBeDefined();

		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "interactive",
				strategy: "fallback",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_tasklist");

		expect(tool).toBeDefined();

		const result = await invokeTool<RenderedToolResult>(tool, {
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
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_grid");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("kern-grid kern-grid-cols-5");
		const result = await invokeTool<RenderedToolResult>(tool, {
			columns: 3,
		});
		expect(result.html).toContain("Spalte 3");
		expect(result.warnings.join("\n")).toContain("CSS Grid");
	});

	it("uses dedicated fieldset tooling for foundational fieldset component", async () => {
		const registry = createRegistry([
			{
				id: "fieldset",
				title: "Fieldset",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_fieldset");

		expect(tool).toBeDefined();
		const result = await invokeTool<RenderedToolResult>(tool, {
			includeHint: true,
		});
		expect(result.html).toContain("kern-fieldset__hint");
	});
});
