import { describe, expect, it } from "vitest";

import {
	formatListingSizes,
	LISTING_BUDGET,
	measureListing,
} from "./listing-budget.js";
import { loadRegistryFromManifest } from "./registry.js";
import { createTools } from "./tools.js";

describe("tools/list context budget", () => {
	const measurement = measureListing(
		createTools(loadRegistryFromManifest()).listTools(),
	);

	it("stays within the model-facing budget", () => {
		expect(
			measurement.modelFacing,
			`The listing grew past its budget. Shrink it, or raise LISTING_BUDGET.modelFacing with a reason.\n${formatListingSizes(measurement, 10)}`,
		).toBeLessThanOrEqual(LISTING_BUDGET.modelFacing);
	});

	it("lowers the budget as the listing shrinks", () => {
		expect(
			measurement.modelFacing,
			`The listing is more than ${LISTING_BUDGET.slack} characters under its budget. Lower LISTING_BUDGET.modelFacing to about ${Math.ceil(measurement.modelFacing / 1000) * 1000}.`,
		).toBeGreaterThan(LISTING_BUDGET.modelFacing - LISTING_BUDGET.slack);
	});

	it("keeps the budget at or above the R5 target", () => {
		expect(LISTING_BUDGET.modelFacing).toBeGreaterThanOrEqual(
			LISTING_BUDGET.target,
		);
	});
});

describe("measureListing", () => {
	const tools = [
		{ name: "small", description: "ab", inputSchema: { type: "object" } },
		{
			name: "large",
			description: "abcdef",
			inputSchema: { type: "object", properties: { x: { type: "string" } } },
			outputSchema: { type: "object" },
		},
	];

	it("sizes name, description and inputSchema as compact JSON, largest first", () => {
		const measurement = measureListing(tools);

		expect(measurement.tools.map((tool) => tool.name)).toEqual([
			"large",
			"small",
		]);
		expect(measurement.tools[1]).toEqual({
			name: "small",
			modelFacing: JSON.stringify({
				name: "small",
				description: "ab",
				inputSchema: { type: "object" },
			}).length,
			description: 2,
			inputSchema: JSON.stringify({ type: "object" }).length,
			outputSchema: 0,
		});
		expect(measurement.modelFacing).toBe(
			measurement.tools[0].modelFacing + measurement.tools[1].modelFacing,
		);
		expect(measurement.outputSchema).toBe(
			JSON.stringify({ type: "object" }).length,
		);
	});

	it("formats a table with the totals and the budget", () => {
		const table = formatListingSizes(measureListing(tools), 1);

		expect(table).toContain("in 2 tools");
		expect(table).toContain(
			`budget ${LISTING_BUDGET.modelFacing.toLocaleString("en-US")}, R5 target 120,000`,
		);
		expect(table).toMatch(/\n {2}large {2,}\d+/);
		expect(table).not.toMatch(/\n {2}small /);
	});
});
