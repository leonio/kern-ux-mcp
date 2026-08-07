import { beforeAll, describe, expect, it } from "vitest";

import { loadRegistryFromManifest } from "./registry.js";
import { createTools } from "./tools.js";

type ListedTool = {
	name: string;
	inputSchema: Record<string, unknown>;
};

function collectRefs(node: unknown, refs: string[] = []): string[] {
	if (!node || typeof node !== "object") {
		return refs;
	}

	if (Array.isArray(node)) {
		for (const item of node) {
			collectRefs(item, refs);
		}
		return refs;
	}

	for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
		if (key === "$ref" && typeof value === "string") {
			refs.push(value);
			continue;
		}

		collectRefs(value, refs);
	}

	return refs;
}

function resolvePointer(root: unknown, ref: string): unknown {
	if (ref === "#") {
		return root;
	}

	const segments = ref
		.replace(/^#\//, "")
		.split("/")
		.map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));

	let current: unknown = root;
	for (const segment of segments) {
		if (!current || typeof current !== "object") {
			return undefined;
		}

		current = (current as Record<string, unknown>)[segment];
	}

	return current;
}

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

	it("leaves no dangling $ref in any emitted schema", () => {
		const dangling: string[] = [];

		for (const tool of listedTools) {
			for (const ref of collectRefs(tool.inputSchema)) {
				if (
					!ref.startsWith("#") ||
					resolvePointer(tool.inputSchema, ref) === undefined
				) {
					dangling.push(`${tool.name}: ${ref}`);
				}
			}
		}

		expect(dangling).toEqual([]);
	});
});
