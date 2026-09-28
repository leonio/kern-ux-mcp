import { describe, expect, it } from "vitest";

import { toolInputSchemaToJsonSchema } from "../ux/json-schema.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";
import { getCatalog } from "./catalog.js";
import { kernInputSchema } from "./kern-schema.js";

function getTool(name: string): ToolDef {
	const tool = getCatalog().tools.find((t) => t.name === name);
	if (!tool) throw new Error(`missing tool ${name}`);
	return tool;
}

const OPTIONS = { target: "draft-2020-12" } as const;

describe("kernInputSchema", () => {
	it("lists our own JSON Schema, converted once per tool", () => {
		const tool = getTool("get_button");
		const schema = kernInputSchema(tool);
		const first = schema["~standard"].jsonSchema.input(OPTIONS);

		expect(first).toEqual(toolInputSchemaToJsonSchema(tool.inputSchema));
		expect(schema["~standard"].jsonSchema.input(OPTIONS)).toBe(first);
		expect(kernInputSchema(tool)).toBe(schema);
	});

	it("normalizes and parses valid input, applying schema defaults", async () => {
		const tool = getTool("get_inputtext");
		const result = await kernInputSchema(tool)["~standard"].validate({});

		expect(result.issues).toBeUndefined();
		expect(result).toMatchObject({
			value: { name: "text_input", label: "Textfeld" },
		});
	});

	it("reports invalid input as one path-less issue carrying the hint without our header", async () => {
		const tool = getTool("get_button");
		const result = await kernInputSchema(tool)["~standard"].validate({
			label: "OK",
			variant: "rainbow",
		});

		expect(result.issues).toHaveLength(1);
		const [issue] = result.issues ?? [];
		expect(issue?.path).toBeUndefined();
		expect(issue?.message).toMatch(/^\n- variant: /);
		expect(issue?.message).toContain("Known-good payload");
		expect(issue?.message).not.toContain("Invalid arguments");
	});
});
