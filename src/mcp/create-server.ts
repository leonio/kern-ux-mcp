import { type CacheHint, McpServer } from "@modelcontextprotocol/server";

import pkg from "../../package.json" with { type: "json" };
import { runTool } from "../invoke.js";
import {
	KERN_TOOL_ANNOTATIONS,
	type ToolDef,
} from "../ux/tool-builders/shared.js";
import { getCatalog } from "./catalog.js";
import { kernInputSchema, kernOutputSchema } from "./kern-schema.js";

/**
 * Lists only change with a release (a new server version), so clients and shared
 * caches may keep them for an hour. Applies to 2026-07-28 responses only.
 */
const LIST_CACHE_HINT: CacheHint = {
	ttlMs: 60 * 60 * 1000,
	cacheScope: "public",
};

/**
 * Registers one tool. Input validation happens in the SDK through
 * kernInputSchema. Anything the handler throws (strict-mode failures, invalid
 * output) becomes an isError result with the error's message. Successful
 * results carry the output twice: as structuredContent for clients that read
 * the outputSchema, and as a JSON text block for those that don't.
 */
export function registerKernTool(server: McpServer, tool: ToolDef): void {
	server.registerTool(
		tool.name,
		{
			title: tool.title,
			description: tool.description,
			inputSchema: kernInputSchema(tool),
			outputSchema: kernOutputSchema(tool),
			annotations: { ...KERN_TOOL_ANNOTATIONS },
		},
		async (args: unknown) => {
			const output = (await runTool(tool, args)) as Record<string, unknown>;
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(output, null, 2) },
				],
				structuredContent: output,
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
		{
			// The tool set is fixed per release, so no list-changed notifications.
			capabilities: { tools: { listChanged: false } },
			cacheHints: {
				"server/discover": LIST_CACHE_HINT,
				"tools/list": LIST_CACHE_HINT,
				"prompts/list": LIST_CACHE_HINT,
				"resources/list": LIST_CACHE_HINT,
				"resources/templates/list": LIST_CACHE_HINT,
			},
		},
	);

	for (const tool of tools) {
		registerKernTool(server, tool);
	}

	return server;
}
