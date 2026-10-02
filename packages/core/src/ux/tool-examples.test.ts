import { describe, expect, it } from "vitest";

import { invokeTool } from "../invoke.js";
import { getCatalog } from "../mcp/catalog.js";
import {
	formatExampleInput,
	knownGoodPayload,
	TOOL_EXAMPLES,
} from "./tool-examples.js";

const toolsByName = new Map(
	getCatalog().tools.map((tool) => [tool.name, tool]),
);

const cases = Object.entries(TOOL_EXAMPLES).flatMap(([name, examples]) =>
	examples.map((example, index) => ({
		name,
		label: example.title ?? `example ${index + 1}`,
		input: example.input,
	})),
);

describe("TOOL_EXAMPLES (golden)", () => {
	it("has examples only for tools that exist", () => {
		expect(
			Object.keys(TOOL_EXAMPLES).filter((name) => !toolsByName.has(name)),
		).toEqual([]);
	});

	it.each(cases)(
		"$name $label is valid input and renders with strict validation",
		async ({ name, input }) => {
			const tool = toolsByName.get(name);
			if (!tool) throw new Error(`No tool ${name}`);

			// invokeTool runs the whole pipeline: normalize, input schema, handler
			// (which throws in strict mode on validation errors), output schema.
			const result = (await invokeTool(tool, { ...input, strict: true })) as {
				validation: { ok: boolean };
			};

			expect(result.validation.ok).toBe(true);
		},
	);
});

describe("formatExampleInput", () => {
	it("renders nested objects and arrays as a JavaScript-style literal", () => {
		expect(
			formatExampleInput({
				label: "More Info",
				level: 2,
				bold: false,
				items: ["a", "b"],
				card: { header: { title: "A" } },
				empty: {},
				none: [],
			}),
		).toBe(
			"{ label: 'More Info', level: 2, bold: false, items: ['a', 'b'], card: { header: { title: 'A' } }, empty: {}, none: [] }",
		);
	});

	it("escapes quotes and backslashes, and quotes keys that aren't identifiers", () => {
		expect(formatExampleInput({ "aria-label": "It's C:\\path" })).toBe(
			"{ 'aria-label': 'It\\'s C:\\\\path' }",
		);
	});
});

describe("knownGoodPayload", () => {
	it("renders a tool's first example as a hint line", () => {
		expect(knownGoodPayload("get_badge")).toBe(
			"Known-good payload: { type: 'success', text: 'Online' }.",
		);
	});

	it("fails for a tool without examples", () => {
		expect(() => knownGoodPayload("get_nothing")).toThrow(
			"No example for get_nothing in TOOL_EXAMPLES.",
		);
	});
});
