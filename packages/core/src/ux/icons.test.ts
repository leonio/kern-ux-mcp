import { describe, expect, it } from "vitest";

import {
	iconNameHint,
	isValidIconName,
	suggestIconNames,
	VALID_ICON_NAMES,
} from "./icons.js";
import manifest from "./registry.json" with { type: "json" };

describe("VALID_ICON_NAMES", () => {
	it("are the bundle's icon names, as registry.json carries them", () => {
		expect(VALID_ICON_NAMES).toEqual(manifest.icons);
		expect(VALID_ICON_NAMES).toContain("account-circle");
		expect(Object.isFrozen(VALID_ICON_NAMES)).toBe(true);
	});
});

describe("suggestIconNames", () => {
	it.each([
		["arrow_forward", ["arrow-forward"]],
		["Arrow Forward", ["arrow-forward"]],
		["trash", ["delete"]],
		["external-link", ["open-in-new"]],
		["constructor", []],
		["xyz", []],
	])("suggests %s -> %j", (input, expected) => {
		expect(suggestIconNames(input)).toEqual(expected);
	});

	it("only suggests names that exist", () => {
		for (const input of [
			"arrow-left",
			"bin",
			"calendar",
			"cancel",
			"copy",
			"email",
			"error",
			"eye",
			"pencil",
			"plus",
			"question",
			"refresh",
			"remove",
			"upload",
		]) {
			for (const name of suggestIconNames(input)) {
				expect(isValidIconName(name), `${input} -> ${name}`).toBe(true);
			}
		}
	});
});

describe("iconNameHint", () => {
	it("offers a suggestion and points at list_icons", () => {
		expect(iconNameHint("trash")).toBe(
			"Unknown icon name. Did you mean delete? list_icons has every valid name.",
		);
		expect(iconNameHint(42)).toBe(
			"Unknown icon name. list_icons has every valid name.",
		);
	});
});
