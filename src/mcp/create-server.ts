import { McpServer } from "@modelcontextprotocol/server";

import pkg from "../../package.json" with { type: "json" };
import { runTool } from "../invoke.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";
import { getCatalog } from "./catalog.js";
import { kernInputSchema } from "./kern-schema.js";

/**
 * Registers one tool. Input validation happens in the SDK through
 * kernInputSchema; anything the handler throws (strict-mode failures, invalid
 * output) becomes an isError result with the error's message.
 */
export function registerKernTool(server: McpServer, tool: ToolDef): void {
	server.registerTool(
		tool.name,
		{
			description: tool.description,
			inputSchema: kernInputSchema(tool),
		},
		async (args: unknown) => {
			const output = await runTool(tool, args);
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(output, null, 2) },
				],
			};
		},
	);
}

/**
 * Creates a server with every KERN tool registered. It's cheap enough to call
 * per connection or per request: definitions and JSON Schemas are built once.
 */
export async function createKernServer(): Promise<McpServer> {
	const { tools } = await getCatalog();
	const server = new McpServer(
		{ name: "kern-ux", version: pkg.version },
		// The tool set is fixed per release, so no list-changed notifications.
		{ capabilities: { tools: { listChanged: false } } },
	);

	for (const tool of tools) {
		registerKernTool(server, tool);
	}

	return server;
}
