import { describe, expect, it } from "vitest";
import { z } from "zod";

import { invokeTool } from "./invoke.js";
import type { ToolDef } from "./ux/tool-builders/shared.js";

function fakeTool(overrides: Partial<ToolDef> = {}): ToolDef {
	return {
		name: "get_button",
		description: "test tool",
		inputSchema: z.object({ label: z.string(), variant: z.enum(["primary"]) }),
		outputSchema: z.object({ echoed: z.string() }),
		handler: async (args) => ({ echoed: (args as { label: string }).label }),
		...overrides,
	};
}

describe("invokeTool", () => {
	it("returns the handler output after input and output validation", async () => {
		await expect(
			invokeTool(fakeTool(), { label: "Weiter", variant: "primary" }),
		).resolves.toEqual({ echoed: "Weiter" });
	});

	it("normalizes arguments by tool name before validating", async () => {
		const tool = fakeTool({
			name: "get_inputtext",
			inputSchema: z.object({ name: z.string(), label: z.string() }),
			handler: async (args) => ({ echoed: (args as { name: string }).name }),
		});

		await expect(invokeTool(tool, {})).resolves.toEqual({
			echoed: "text_input",
		});
	});

	it("treats missing arguments as an empty object", async () => {
		const tool = fakeTool({
			inputSchema: z.object({}),
			handler: async () => ({ echoed: "ok" }),
		});

		await expect(invokeTool(tool, undefined)).resolves.toEqual({
			echoed: "ok",
		});
	});

	it("throws the model-facing hint for invalid input without calling the handler", async () => {
		let called = false;
		const tool = fakeTool({
			handler: async () => {
				called = true;
				return { echoed: "" };
			},
		});

		await expect(
			invokeTool(tool, { label: "OK", variant: "rainbow" }),
		).rejects.toThrow(
			/Invalid arguments for get_button:[\s\S]*Known-good payload/,
		);
		expect(called).toBe(false);
	});

	it("throws when the handler output breaks the output schema", async () => {
		const tool = fakeTool({ handler: async () => ({ wrong: true }) });

		await expect(
			invokeTool(tool, { label: "Weiter", variant: "primary" }),
		).rejects.toThrow(/Tool get_button returned invalid output/);
	});
});
