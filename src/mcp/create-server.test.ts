import { type Client, ProtocolError } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import pkg from "../../package.json" with { type: "json" };
import { MCP_ERAS } from "../test-support/mcp.js";

/**
 * End-to-end tests over a real MCP client/server pair, on both protocol eras
 * (2025-11-25 in memory, 2026-07-28 through the HTTP handler).
 * Covers registration, the kernInputSchema adapter (normalization, hints) and
 * the error semantics: isError results for bad input, -32602 for unknown tools.
 */

function textOf(result: Awaited<ReturnType<Client["callTool"]>>): string {
	const content = result.content as Array<{ type: string; text?: string }>;
	expect(content).toHaveLength(1);
	expect(content[0]?.type).toBe("text");
	return content[0]?.text ?? "";
}

describe.each(MCP_ERAS)("MCP server over $era", ({ era, connect }) => {
	let client: Client;

	beforeAll(async () => {
		client = await connect();
	});

	afterAll(async () => {
		await client?.close();
	});

	it("negotiates the expected protocol version", () => {
		expect(client.getNegotiatedProtocolVersion()).toBe(era);
	});

	it("reports the package.json version and a static tool list", () => {
		expect(client.getServerVersion()).toMatchObject({
			name: "kern-ux",
			version: pkg.version,
		});
		expect(client.getServerCapabilities()?.tools).toEqual({
			listChanged: false,
		});
	});

	it("lists tools with object-rooted JSON input schemas", async () => {
		const { tools } = await client.listTools();
		const names = tools.map((tool) => tool.name);

		expect(names).toEqual(
			expect.arrayContaining([
				"validate_html",
				"get_component_docs",
				"render_composition",
				"get_button",
			]),
		);
		expect(new Set(names).size).toBe(names.length);
		for (const tool of tools) {
			expect(tool.inputSchema.type).toBe("object");
			expect(tool.description).toBeTruthy();
		}
	});

	it("calls a tool and returns its validated output as JSON text", async () => {
		const result = await client.callTool({
			name: "get_button",
			arguments: { label: "Weiter" },
		});
		const payload = JSON.parse(textOf(result));

		expect(result.isError).toBeFalsy();
		expect(payload.html).toContain("kern-btn");
		expect(payload.validation.ok).toBe(true);
	});

	it("applies argument normalization before validation", async () => {
		// get_inputtext fills in a default name/label when they are missing.
		const result = await client.callTool({
			name: "get_inputtext",
			arguments: {},
		});

		expect(result.isError).toBeFalsy();
		expect(JSON.parse(textOf(result)).html).toContain("text_input");
	});

	it("returns invalid arguments as an isError result with the hint", async () => {
		const result = await client.callTool({
			name: "get_button",
			arguments: { label: "OK", variant: "rainbow" },
		});
		const text = textOf(result);

		expect(result.isError).toBe(true);
		expect(text).toMatch(
			/^Input validation error: Invalid arguments for tool get_button: \n- variant: /,
		);
		expect(text).toContain("Known-good payload");
		// Our own header is not repeated inside the SDK's prefix.
		expect(text).not.toContain("Invalid arguments for get_button:");
	});

	it("returns the composition cheat sheet for an invalid block kind", async () => {
		const result = await client.callTool({
			name: "render_composition",
			arguments: { contentBlocks: [{ kind: "nope" }] },
		});
		const text = textOf(result);

		expect(result.isError).toBe(true);
		expect(text).toContain("Invalid or missing 'kind'");
		expect(text).toContain("Cheat sheet for contentBlocks:");
	});

	it("returns strict-mode failures as an isError result", async () => {
		const result = await client.callTool({
			name: "render_composition",
			arguments: {
				strict: true,
				contentBlocks: [{ kind: "html", html: "<img src='a.png'>" }],
			},
		});

		expect(result.isError).toBe(true);
		expect(textOf(result)).toMatch(
			/^Strict validation failed for render_composition\. Fix errors and retry:\n- /,
		);
	});

	it("rejects unknown tools with JSON-RPC -32602", async () => {
		const call = client.callTool({ name: "get_does_not_exist", arguments: {} });

		await expect(call).rejects.toBeInstanceOf(ProtocolError);
		await expect(call).rejects.toMatchObject({
			code: -32602,
			message: expect.stringContaining("Tool get_does_not_exist not found"),
		});
	});
});
