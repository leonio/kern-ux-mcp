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

	it("adds actionable hint for get_grid when columns are outside 12-column set", () => {
		const parsed = GridToolSchema.safeParse({
			columns: 5,
		});

		if (parsed.success) {
			throw new Error("Expected grid parse to fail in test fixture");
		}
		const message = formatInputValidationError("get_grid", parsed.error);

		expect(message).toContain("Invalid arguments for get_grid");
		expect(message).toContain("[1, 2, 3, 4, 6, 12]");
		expect(message).toContain("do not use get_grid");
		expect(message).toContain("get_utility_reference");
		expect(message).toContain("kern-grid kern-grid-cols-5");
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
