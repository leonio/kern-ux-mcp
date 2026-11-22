import { McpServer } from "@modelcontextprotocol/server";
import type { SkillCatalog } from "@modelcontextprotocol/server/ext/skills";

import { runTool } from "../invoke.js";
import { registerKernResources } from "../resources/register.js";
import { serverInstructions } from "../skills/instructions.js";
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
 * the outputSchema, and as a JSON text block for those that don't. A tool with
 * resourceLinks adds them as resource_link blocks after the text.
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
			const links = tool.resourceLinks?.(output) ?? [];
			return {
				content: [
					{ type: "text" as const, text: JSON.stringify(output, null, 2) },
					...links.map((link) => ({ type: "resource_link" as const, ...link })),
				],
				structuredContent: output,
			};
		},
	);
}

/** What the server is for, and which skill to load for what. */
const INSTRUCTIONS = serverInstructions();

export type KernServerOptions = {
	/** Reported as the server version: the version of the host package. */
	version: string;
	/** The skills to serve, from loadKernSkills(), which the host awaits once. */
	skills: SkillCatalog;
};

/**
 * Creates a server with every KERN tool, resource and skill
 * registered. It's cheap enough to call per connection or per request:
 * definitions, JSON Schemas, resource content and the skill catalog are built
 * once.
 */
export function createKernServer({
	version,
	skills,
}: KernServerOptions): McpServer {
	const { tools, resources } = getCatalog();
	const server = new McpServer(
		{ name: "kern-ux", version },
		{
			instructions: INSTRUCTIONS,
			// Tools and resources are fixed per release: no list-changed notifications.
			capabilities: {
				tools: { listChanged: false },
				resources: { listChanged: false },
			},
			cacheHints: {
				"server/discover": RELEASE_CACHE_HINT,
				"tools/list": RELEASE_CACHE_HINT,
				"resources/list": RELEASE_CACHE_HINT,
				"resources/templates/list": RELEASE_CACHE_HINT,
			},
		},
	);

	for (const tool of tools) {
		registerKernTool(server, tool);
	}
	registerKernResources(server, resources);
	// The skill:// template, skills/list, skills/get and the capability.
	skills.attach(server);

	return server;
}
