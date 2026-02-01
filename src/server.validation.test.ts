import { describe, expect, it } from "vitest";

import { formatInputValidationError } from "./server.js";
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
