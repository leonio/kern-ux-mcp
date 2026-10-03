import { describe, expect, it } from "vitest";

import {
	componentIdFromKernId,
	FALLBACK_EXAMPLES,
	TOOLS_WITHOUT_BUNDLE_COMPONENT,
} from "./knowledge-map.js";
import {
	COMPONENT_TOOL_IDS,
	getComponentToolStrategy,
} from "./tool-builders/component-tools.js";

describe("componentIdFromKernId", () => {
	it.each([
		["button", "button"],
		["input-text", "inputtext"],
		["description-list", "descriptionlist"],
		["task-list", "tasklist"],
		["checkboxes", "checkbox"],
		["radios", "radio"],
		["list", "lists"],
		["notification-banner", "notificationbanner"],
	])("maps %s to %s", (kernId, componentId) => {
		expect(componentIdFromKernId(kernId)).toBe(componentId);
	});

	it("doesn't treat inherited keys as renames", () => {
		expect(componentIdFromKernId("constructor")).toBe("constructor");
	});
});

describe("FALLBACK_EXAMPLES", () => {
	it("picks an example for exactly the fallback tools", () => {
		const fallbackTools = COMPONENT_TOOL_IDS.filter(
			(id) => getComponentToolStrategy(id) === "fallback",
		);

		expect(Object.keys(FALLBACK_EXAMPLES).sort()).toEqual(
			[...fallbackTools].sort(),
		);
	});
});

describe("TOOLS_WITHOUT_BUNDLE_COMPONENT", () => {
	it("names component tools that return a picked example", () => {
		for (const toolId of Object.keys(TOOLS_WITHOUT_BUNDLE_COMPONENT)) {
			expect(COMPONENT_TOOL_IDS).toContain(toolId);
			expect(Object.keys(FALLBACK_EXAMPLES)).toContain(toolId);
		}
	});
});
