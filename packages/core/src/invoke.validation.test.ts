import { describe, expect, it } from "vitest";

import {
	formatInputValidationError,
	formatInputValidationHint,
	parseToolInput,
} from "./invoke.js";
import { getCatalog } from "./mcp/catalog.js";
import { AlertSchema } from "./ux/schemas/alert.js";
import { badgeSchema } from "./ux/schemas/badge.js";
import { ButtonSchema } from "./ux/schemas/button.js";
import { CardGroupSchema } from "./ux/schemas/card-group.js";
import { DialogSchema } from "./ux/schemas/dialog.js";
import { DisclosureSchema } from "./ux/schemas/disclosure.js";
import { GridToolSchema } from "./ux/schemas/grid.js";
import { iconSchema } from "./ux/schemas/icon.js";
import { SectionSchema } from "./ux/schemas/section.js";
import { tasklistSchema } from "./ux/schemas/tasklist.js";

describe("formatInputValidationError", () => {
	it("adds actionable hint for get_dialog", () => {
		const parsed = DialogSchema.safeParse({
			title: "Bestätigen",
		});

		if (parsed.success) {
			throw new Error("Expected dialog parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_dialog", parsed.error);

		expect(message).toContain("Invalid arguments for get_dialog");
		expect(message).toContain("Known-good payload");
		expect(message).toContain("confirmLabel");
		expect(message).toContain("Legacy payload");
		expect(message).toContain("body");
	});

	it("adds actionable hint for get_section", () => {
		const parsed = SectionSchema.safeParse({
			headingText: "Überblick",
		});

		if (parsed.success) {
			throw new Error("Expected section parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_section", parsed.error);

		expect(message).toContain("Invalid arguments for get_section");
		expect(message).toContain("Known-good payload");
		expect(message).toContain("paragraphs");
		expect(message).toContain("Compatibility aliases");
	});

	it("returns plain issue list for other tools", () => {
		const parsed = SectionSchema.safeParse({
			headingText: "Überblick",
		});

		if (parsed.success) {
			throw new Error("Expected section parse to fail in test fixture");
		}
		const message = formatInputValidationError(
			"get_unknown_tool",
			parsed.error,
		);

		expect(message).toContain("Invalid arguments for get_unknown_tool");
		expect(message).not.toContain("Known-good payload");
		expect(message).toContain("paragraphs");
	});

	it("gives get_grid's known-good payload when columns are out of range", () => {
		const parsed = GridToolSchema.safeParse({
			columns: 13,
		});

		if (parsed.success) {
			throw new Error("Expected grid parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_grid", parsed.error);

		expect(message).toContain("Invalid arguments for get_grid");
		expect(message).toContain("- columns:");
		expect(message).toContain("Known-good payload");
		expect(message).not.toContain("divisor");
	});

	it("adds actionable hint for get_button", () => {
		const parsed = ButtonSchema.safeParse({});

		if (parsed.success) {
			throw new Error("Expected button parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_button", parsed.error);

		expect(message).toContain("Known-good payload");
		expect(message).toContain("More Info");
		expect(message).toContain("primary | secondary | tertiary");
	});

	it("adds actionable hint for get_icon", () => {
		const parsed = iconSchema.safeParse({});

		if (parsed.success) {
			throw new Error("Expected icon parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_icon", parsed.error);

		expect(message).toContain("Known-good payload");
		expect(message).toContain("download");
		expect(message).toContain("list_icons");
	});

	it.each([
		["arrow_forward", "Did you mean arrow-forward?"],
		["Arrow Forward", "Did you mean arrow-forward?"],
		["trash", "Did you mean delete?"],
		["arrow-right", "Did you mean arrow-forward?"],
		[
			"double-arrow",
			"Did you mean keyboard-double-arrow-left, keyboard-double-arrow-right?",
		],
	])("suggests icon names for %s", (name, suggestion) => {
		const parsed = ButtonSchema.safeParse({ label: "Weiter", icon: { name } });
		if (parsed.success) throw new Error(`Expected ${name} to be rejected`);
		const message = formatInputValidationHint("get_button", parsed.error);

		expect(message).toContain(`- icon.name: Unknown icon name. ${suggestion}`);
		expect(message).toContain("list_icons has every valid name.");
	});

	it("names no icon when nothing is close", () => {
		const parsed = iconSchema.safeParse({ name: "zzz" });
		if (parsed.success) throw new Error("Expected zzz to be rejected");

		expect(formatInputValidationHint("get_icon", parsed.error)).toContain(
			"- name: Unknown icon name. list_icons has every valid name.",
		);
	});

	it("adds actionable hint for get_card_group", () => {
		const parsed = CardGroupSchema.safeParse({});

		if (parsed.success) {
			throw new Error("Expected card_group parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_card_group", parsed.error);

		expect(message).toContain("Known-good payload");
		expect(message).toContain("cards");
		expect(message).toContain("1-6");
	});

	it("adds actionable hint for get_tasklist", () => {
		const parsed = tasklistSchema.safeParse({
			items: [],
		});

		if (parsed.success) {
			throw new Error("Expected tasklist parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_tasklist", parsed.error);

		expect(message).toContain("Known-good payload");
		expect(message).toContain("items");
		expect(message).toContain("statusType");
	});

	it("adds actionable hint for get_alert with all required fields and variant list", () => {
		const parsed = AlertSchema.safeParse({});

		if (parsed.success) {
			throw new Error("Expected alert parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_alert", parsed.error);

		expect(message).toContain("Known-good payload");
		expect(message).toContain("danger");
		expect(message).toContain("body");
		expect(message).toContain("no separate");
	});

	it("adds actionable hint for get_disclosure with both required params", () => {
		const parsed = DisclosureSchema.safeParse({ triggerLabel: "Details" });

		if (parsed.success) {
			throw new Error("Expected disclosure parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_disclosure", parsed.error);

		expect(message).toContain("Known-good payload");
		expect(message).toContain("triggerLabel");
		expect(message).toContain("contentBlocks OR content");
	});

	it("adds actionable hint for get_badge with both required params", () => {
		const parsed = badgeSchema.safeParse({});

		if (parsed.success) {
			throw new Error("Expected badge parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_badge", parsed.error);

		expect(message).toContain("Known-good payload");
		expect(message).toContain("type AND text");
		expect(message).toContain("success");
	});

	it("adds render_page's known-good payload to the composition hint", () => {
		const tool = getCatalog().tools.find((t) => t.name === "render_page");
		if (!tool) throw new Error("No tool render_page");
		const parsed = parseToolInput(tool, { heading: "Wohngeld" });
		if (parsed.success) throw new Error("Expected missing contentBlocks");

		const message = formatInputValidationHint("render_page", parsed.error);

		expect(message).toContain("Cheat sheet for contentBlocks:");
		expect(message).toContain(
			"Known-good payload: { heading: 'Wohngeld beantragen'",
		);
	});
});

describe("disclosure blocks take content like get_disclosure (finding 5)", () => {
	const tool = getCatalog().tools.find((t) => t.name === "render_composition");
	if (!tool) throw new Error("No tool render_composition");
	const disclosure = (fields: object) => ({
		contentBlocks: [
			{ kind: "disclosure", disclosure: { triggerLabel: "Mehr", ...fields } },
		],
	});

	it.each<[string, object, object]>([
		["text", { content: "A < B" }, { kind: "text", text: "A < B" }],
		[
			"html",
			{ content: "<b>B</b>", contentIsHtml: true },
			{ kind: "html", html: "<b>B</b>" },
		],
	])("turns content into one %s block", (_, fields, block) => {
		const parsed = parseToolInput(tool, disclosure(fields));
		if (!parsed.success) throw new Error(parsed.error.message);

		expect(parsed.data).toMatchObject(disclosure({ contentBlocks: [block] }));
	});

	it("keeps contentBlocks when both are set", () => {
		const blocks = [{ kind: "text", text: "Blöcke" }];
		const parsed = parseToolInput(
			tool,
			disclosure({ content: "Text", contentBlocks: blocks }),
		);
		if (!parsed.success) throw new Error(parsed.error.message);

		expect(parsed.data).toMatchObject(disclosure({ contentBlocks: blocks }));
	});
});

describe("get_accordion with items", () => {
	const tool = getCatalog().tools.find((t) => t.name === "get_accordion");
	if (!tool) throw new Error("No tool get_accordion");
	const items = [
		{ title: "Wie lange dauert es?", content: "Fünf Tage." },
		{ title: "Was kostet es?", content: "Nichts." },
	];

	it.each<[string, object]>([
		["no mode", { items }],
		[
			"mode single and a title, as Haiku sent it",
			{ mode: "single", title: "FAQ", items },
		],
	])("renders a group with %s", async (_, args) => {
		const parsed = parseToolInput(tool, args);
		if (!parsed.success) throw new Error(parsed.error.message);

		expect(parsed.data).toMatchObject({ mode: "group", items });
	});

	it("keeps a single accordion that has content", () => {
		const parsed = parseToolInput(tool, {
			title: "Mehr",
			content: "Text",
			items,
		});

		expect(parsed.success && parsed.data).toMatchObject({ mode: "single" });
	});
});

describe("standalone block tools take simple blocks (R5 option B)", () => {
	const tools = new Map(getCatalog().tools.map((tool) => [tool.name, tool]));
	const grid = { kind: "grid", grid: { columns: 2 } };

	it.each<[string, object]>([
		["get_section", { headingText: "Überblick", contentBlocks: [grid] }],
		["get_card", { contentBlocks: [grid] }],
		["get_card_group", { cards: [{ contentBlocks: [grid] }] }],
		["get_disclosure", { triggerLabel: "Mehr", contentBlocks: [grid] }],
		["get_fieldset", { legend: "Anschrift", contentBlocks: [grid] }],
		["get_grid", { columnsContent: [[grid]] }],
	])(
		"%s rejects a container block and points at render_composition",
		(name, args) => {
			const tool = tools.get(name);
			if (!tool) throw new Error(`No tool ${name}`);
			const parsed = parseToolInput(tool, args);
			if (parsed.success) throw new Error(`${name} accepted a grid block`);

			expect(formatInputValidationHint(name, parsed.error)).toContain(
				`${name} takes text, html, badge and field blocks. For cards, grids, sections, buttons or forms inside, use render_composition.`,
			);
		},
	);

	it("leaves the note out when the blocks' kinds are fine", () => {
		const tool = tools.get("get_fieldset");
		if (!tool) throw new Error("No tool get_fieldset");
		const parsed = parseToolInput(tool, {
			legend: "Anschrift",
			contentBlocks: [{ kind: "field", field: { type: "text", name: "plz" } }],
		});
		if (parsed.success) throw new Error("Expected a missing label");

		expect(
			formatInputValidationHint("get_fieldset", parsed.error),
		).not.toContain("render_composition");
	});

	it("accepts select options written as { value, text } in a field block", () => {
		const tool = tools.get("get_fieldset");
		if (!tool) throw new Error("No tool get_fieldset");
		const parsed = parseToolInput(tool, {
			legend: "Antrag",
			contentBlocks: [
				{
					kind: "field",
					field: {
						type: "select",
						name: "art",
						label: "Art",
						options: [{ value: "neu", text: "Neuantrag" }],
					},
				},
			],
		});

		expect(parsed.success).toBe(true);
	});

	it("keeps nesting in render_composition", () => {
		const tool = tools.get("render_composition");
		if (!tool) throw new Error("No tool render_composition");

		expect(
			parseToolInput(tool, {
				contentBlocks: [
					{
						kind: "section",
						section: { headingText: "Überblick", contentBlocks: [grid] },
					},
				],
			}).success,
		).toBe(true);
	});
});
