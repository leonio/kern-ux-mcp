import { beforeAll, describe, expect, it } from "vitest";

import { loadRegistryFromManifest } from "./registry.js";
import { createTools } from "./tools.js";

type ListedTool = {
	name: string;
	inputSchema: Record<string, unknown>;
};

describe("tools/list inputSchema MCP contract", () => {
	let listedTools: ListedTool[];

	beforeAll(async () => {
		const registry = await loadRegistryFromManifest();
		listedTools = createTools(registry).listTools() as ListedTool[];
	});

	it("exposes at least one tool", () => {
		expect(listedTools.length).toBeGreaterThan(0);
	});

	it("emits a root object schema without a definitions wrapper for every tool", () => {
		const offenders = listedTools.filter(
			(tool) =>
				tool.inputSchema.type !== "object" ||
				tool.inputSchema.definitions !== undefined ||
				tool.inputSchema.$ref !== undefined,
		);

		expect(offenders.map((tool) => tool.name)).toEqual([]);
	});

	it("declares inline properties or object-only anyOf branches for every tool", () => {
		const offenders = listedTools.filter(
			(tool) =>
				typeof tool.inputSchema.properties !== "object" &&
				!Array.isArray(tool.inputSchema.anyOf),
		);

		expect(offenders.map((tool) => tool.name)).toEqual([]);
	});

	it("emits an empty properties bag for parameterless tools", () => {
		const parameterless = listedTools.filter(
			(tool) =>
				typeof tool.inputSchema.properties === "object" &&
				Object.keys(tool.inputSchema.properties as Record<string, unknown>)
					.length === 0,
		);

		expect(parameterless.length).toBeGreaterThan(0);
		for (const tool of parameterless) {
			expect(tool.inputSchema.type).toBe("object");
			expect(tool.inputSchema.properties).toEqual({});
		}
	});
});
