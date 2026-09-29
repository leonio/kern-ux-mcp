import { describe, expect, it } from "vitest";

import {
	callHandler,
	createRegistry,
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
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_heading");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("level 1-6");

		const result = await callHandler<RenderedToolResult>(tool, {
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
				category: "foundational",
				strategy: "typography",
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
				category: "foundational",
				strategy: "typography",
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
				category: "foundational",
				strategy: "typography",
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
				category: "foundational",
				strategy: "typography",
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
				category: "interactive",
				strategy: "fallback",
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
				category: "interactive",
				strategy: "fallback",
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
				category: "interactive",
				strategy: "fallback",
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
				category: "foundational",
				strategy: "layout",
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

	describe("foundational components with strategy=fallback", () => {
		// No checked-in component takes this path today; these pin the current fallback
		// behaviour (tools.ts createTools id-set checks) before plan-v2 item 7 changes it.
		const fallbackComponent = (id: string, htmlCanonical?: string) => ({
			id,
			title: id,
			status: "stable" as const,
			category: "foundational" as const,
			strategy: "fallback" as const,
			htmlCanonical,
		});

		it("routes ids in the layout id set to the layout builder", async () => {
			const tools = createTools(createRegistry([fallbackComponent("divider")]));
			const result = await callHandler<RenderedToolResult>(
				tools.getTool("get_divider"),
				{ decorative: true },
			);

			expect(result.html).toContain("kern-divider");
		});

		it("routes ids in the typography id set to the typography builder", async () => {
			const tools = createTools(createRegistry([fallbackComponent("title")]));
			const result = await callHandler<RenderedToolResult>(
				tools.getTool("get_title"),
				{ text: "Seitentitel", size: "small" },
			);

			expect(result.html).toContain("kern-title--small");
		});

		it("serves canonical manifest HTML for any other id", async () => {
			const canonical = '<div class="kern-mystery">Inhalt</div>';
			const tools = createTools(
				createRegistry([fallbackComponent("mystery", canonical)]),
			);
			const tool = tools.getTool("get_mystery");

			expect(tool?.description).toBe(
				"KERN UX: HTML für mystery erzeugen (mit optionaler strikter Validierung).",
			);
			const result = await callHandler<RenderedToolResult>(tool, {});
			expect(result.html).toBe(canonical);
			expect(result.validation.ok).toBe(true);
		});

		it("renders a placeholder when there is no canonical HTML", async () => {
			const tools = createTools(createRegistry([fallbackComponent("mystery")]));
			const result = await callHandler<RenderedToolResult>(
				tools.getTool("get_mystery"),
				{},
			);

			expect(result.html).toContain(
				"<!-- TODO: No story template found for mystery. -->",
			);
			expect(result.html).toContain('<div class="kern-mystery"></div>');
		});

		it("throws in strict mode when the canonical HTML fails validation", async () => {
			const tools = createTools(
				createRegistry([fallbackComponent("mystery", '<img src="x.png">')]),
			);

			await expect(
				tools.getTool("get_mystery")?.handler({ strict: true }),
			).rejects.toThrow("Strict validation failed for get_mystery");
		});
	});

	it("prefixes experimental components with a banner and warning", async () => {
		const tools = createTools(
			createRegistry([
				{
					id: "mystery",
					title: "Mystery",
					status: "experimental",
					category: "foundational",
					strategy: "fallback",
					htmlCanonical: '<div class="kern-mystery"></div>',
				},
			]),
		);
		const result = await callHandler<RenderedToolResult>(
			tools.getTool("get_mystery"),
			{},
		);

		expect(result.html).toMatch(/^<!-- WARNING: Experimental Component/);
		expect(result.warnings).toEqual([
			"Component 'mystery' is experimental – API may change.",
		]);
	});
});
