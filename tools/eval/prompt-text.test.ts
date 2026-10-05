import { describe, expect, it } from "vitest";

import { MCP_ERAS } from "../../packages/core/src/test-support/mcp.js";
import { promptText } from "./prompt-text.js";
import { PROMPT_SCENARIOS } from "./scenarios.js";

describe("promptText", () => {
	it("joins text, embedded resources and links", () => {
		expect(
			promptText([
				{
					role: "user",
					content: {
						type: "resource",
						resource: {
							uri: "kern://guides/forms",
							mimeType: "text/markdown",
							text: "# KERN guide: forms\n",
						},
					},
				},
				{
					role: "user",
					content: {
						type: "resource_link",
						uri: "kern://components/inputtext",
						name: "inputtext",
						title: "KERN Input Text",
					},
				},
				{
					role: "user",
					content: {
						type: "resource_link",
						uri: "kern://components/radio",
						name: "radio",
					},
				},
				{ role: "user", content: { type: "text", text: "Build a form." } },
			]),
		).toBe(
			[
				'<resource uri="kern://guides/forms">\n# KERN guide: forms\n</resource>',
				"Resource: kern://components/inputtext (KERN Input Text)",
				"Resource: kern://components/radio",
				"Build a form.",
			].join("\n\n"),
		);
	});

	it("refuses content it can't send as text", () => {
		expect(() =>
			promptText([
				{
					role: "user",
					content: { type: "image", data: "AAAA", mimeType: "image/png" },
				},
			]),
		).toThrow(/can't send image/);
		expect(() =>
			promptText([
				{
					role: "user",
					content: {
						type: "resource",
						resource: { uri: "kern://x", blob: "AAAA" },
					},
				},
			]),
		).toThrow(/embeds kern:\/\/x as binary/);
	});
});

describe("the prompts suite", () => {
	const [setup] = MCP_ERAS;

	it.each(PROMPT_SCENARIOS)(
		"$id renders through the server's prompt",
		async ({ mcpPrompt }) => {
			if (!setup || !mcpPrompt) throw new Error("Nothing to render.");
			const client = await setup.connect();
			try {
				const text = promptText((await client.getPrompt(mcpPrompt)).messages);

				expect(text).toMatch(/^<resource uri="kern:\/\/guides\/forms">\n/);
				expect(text).toContain(mcpPrompt.arguments.fields);
				expect(text).toMatch(/not a description of it\.$/);
			} finally {
				await client.close();
			}
		},
	);
});
