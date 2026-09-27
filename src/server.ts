import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { z } from "zod";
import pkg from "../package.json" with { type: "json" };
import { invokeTool } from "./invoke.js";
import {
	loadRegistryFromManifest,
	validateRegistryAgainstToolNames,
} from "./ux/registry.js";
import { createTools } from "./ux/tools.js";

function readToolCallParams(request: {
	params?: {
		name?: unknown;
		arguments?: unknown;
	};
}): { name: string; args: unknown } {
	const name = request.params?.name;
	if (typeof name !== "string" || name.trim() === "") {
		throw new Error("Invalid CallToolRequest: missing tool name.");
	}

	return {
		name,
		args: request.params?.arguments ?? {},
	};
}

function createTextToolResult(payload: unknown) {
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(payload, null, 2),
			},
		],
	};
}

export async function createServer() {
	const server = new Server(
		{
			name: "kern-ux",
			version: pkg.version,
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	const registry = await loadRegistryFromManifest();
	const tools = createTools(registry);
	validateRegistryAgainstToolNames(registry, tools.listToolNames());

	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: tools.listTools(),
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, args } = readToolCallParams(request);
		const tool = tools.getTool(name);
		if (!tool) {
			throw new Error(`Unknown tool: ${name}`);
		}

		return createTextToolResult(await invokeTool(tool, args));
	});

	return server;
}

export type ToolSchemas = {
	inputSchema: z.ZodType;
	outputSchema: z.ZodType;
	description?: string;
};
