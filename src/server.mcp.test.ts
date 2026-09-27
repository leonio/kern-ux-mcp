import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import pkg from "../package.json" with { type: "json" };
import { createServer } from "./server.js";

/**
 * End-to-end tests over a real MCP client/server pair (in-memory transport).
 * Covers the request handlers in server.ts that unit tests of createTools() bypass:
 * tool listing, argument normalization, input/output validation and error formatting.
 */

let client: Client;

beforeAll(async () => {
	const server = await createServer();
	const [clientTransport, serverTransport] =
		InMemoryTransport.createLinkedPair();
	client = new Client({ name: "kern-ux-test-client", version: "0.0.0" });
	await Promise.all([
		server.connect(serverTransport),
		client.connect(clientTransport),
	]);
});

afterAll(async () => {
	await client?.close();
});

function parseTextResult(result: Awaited<ReturnType<Client["callTool"]>>) {
	const content = result.content as Array<{ type: string; text?: string }>;
	expect(content).toHaveLength(1);
	expect(content[0]?.type).toBe("text");
	return JSON.parse(content[0]?.text ?? "");
}

describe("MCP server round-trip", () => {
	it("reports the package.json version as the server version", () => {
		expect(client.getServerVersion()).toEqual({
			name: "kern-ux",
			version: pkg.version,
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
		const payload = parseTextResult(result);

		expect(payload.html).toContain("kern-btn");
		expect(payload.validation.ok).toBe(true);
	});

	it("applies argument normalization before validation", async () => {
		// get_inputtext fills in a default name/label when they are missing.
		const result = await client.callTool({
			name: "get_inputtext",
			arguments: {},
		});
		const payload = parseTextResult(result);

		expect(payload.html).toContain("text_input");
	});

	it("rejects unknown tools", async () => {
		await expect(
			client.callTool({ name: "get_does_not_exist", arguments: {} }),
		).rejects.toThrow(/Unknown tool: get_does_not_exist/);
	});

	it("returns the formatted validation hint for invalid arguments", async () => {
		await expect(
			client.callTool({
				name: "get_button",
				arguments: { label: "OK", variant: "rainbow" },
			}),
		).rejects.toThrow(/Known-good payload/);
	});
});
