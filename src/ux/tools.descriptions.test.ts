import { describe, expect, it } from "vitest";

import { createRegistry } from "../test-support/tools.js";
import { createTools } from "./tools.js";

describe("tool descriptions", () => {
	it("get_alert description lists variants and mentions body structure", () => {
		const registry = createRegistry([
			{
				id: "alert",
				title: "Alert",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_alert");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("danger");
		expect(tool?.description).toContain("body");
		expect(tool?.description).toContain("high-contrast");
	});

	it("get_badge description lists required fields", () => {
		const registry = createRegistry([
			{
				id: "badge",
				title: "Badge",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_badge");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("type");
		expect(tool?.description).toContain("text");
		expect(tool?.description).toContain("showIcon");
	});

	it("get_disclosure description lists required fields and clarifies accordion styling", () => {
		const tools = createTools(createRegistry([]));
		const tool = tools.getTool("get_disclosure");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("triggerLabel");
		expect(tool?.description).toContain("contentBlocks");
		expect(tool?.description).toContain("content");
		expect(tool?.description).toContain("kern-accordion");
	});

	it("get_utility_reference description warns about missing kern-bg-* classes and mentions surface category", () => {
		const tools = createTools(createRegistry([]));
		const tool = tools.getTool("get_utility_reference");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("Surface");
		expect(tool?.description).toContain("kern-bg-*");
		expect(tool?.description).toContain("--kern-color-background-subtle");
	});

	it("get_tasklist description documents numbered:false checklist variant", () => {
		const registry = createRegistry([
			{
				id: "tasklist",
				title: "Tasklist",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_tasklist");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("numbered: false");
		expect(tool?.description).toContain("Checkliste");
	});

	it("get_select description lists required fields and wrapper note", () => {
		const registry = createRegistry([
			{
				id: "select",
				title: "Select",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_select");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("name");
		expect(tool?.description).toContain("label");
		expect(tool?.description).toContain("options");
		expect(tool?.description).toContain("select-wrapper");
		expect(tool?.description).toContain("disabled");
	});

	it("get_pattern description clarifies only header patterns exist", () => {
		const registry = createRegistry([
			{
				id: "pattern",
				title: "Pattern",
				status: "stable",
				category: "interactive",
				strategy: "fallback",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_pattern");

		expect(tool).toBeDefined();
		expect(tool?.description).toContain("Header-Pattern");
		expect(tool?.description).toContain("Footer");
		expect(tool?.description).toContain("render_composition");
	});
});
