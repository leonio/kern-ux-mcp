import { McpServer } from "@modelcontextprotocol/server";

import { runTool } from "../invoke.js";
import { registerKernResources } from "../resources/register.js";
import {
	KERN_TOOL_ANNOTATIONS,
	type ToolDef,
} from "../ux/tool-builders/shared.js";
import { RELEASE_CACHE_HINT } from "./cache-hint.js";
import { getCatalog } from "./catalog.js";
import { kernInputSchema, kernOutputSchema } from "./kern-schema.js";

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

export type KernServerOptions = {
	/** Reported as the server version: the version of the host package. */
	version: string;
};

/**
 * Creates a server with every KERN tool and resource registered. It's cheap
 * enough to call per connection or per request: definitions, JSON Schemas and
 * resource content are built once.
 */
export function createKernServer({ version }: KernServerOptions): McpServer {
	const { tools, resources } = getCatalog();
	const server = new McpServer(
		{ name: "kern-ux", version },
		{
			// Tools and resources are fixed per release: no list-changed notifications.
			capabilities: {
				tools: { listChanged: false },
				resources: { listChanged: false },
			},
			cacheHints: {
				"server/discover": RELEASE_CACHE_HINT,
				"tools/list": RELEASE_CACHE_HINT,
				"prompts/list": RELEASE_CACHE_HINT,
				"resources/list": RELEASE_CACHE_HINT,
				"resources/templates/list": RELEASE_CACHE_HINT,
			},
		},
	);

	for (const tool of tools) {
		registerKernTool(server, tool);
	}
	registerKernResources(server, resources);

	return server;
}
