import {
	type McpServer,
	ResourceNotFoundError,
	ResourceTemplate,
} from "@modelcontextprotocol/server";

import { RELEASE_CACHE_HINT } from "../mcp/cache-hint.js";
import type { KernResourceDefinition } from "./definition.js";

/**
 * Registers each resource family as a template that lists every resource and
 * completes its variable. A read of a value the family doesn't serve is a
 * resource-not-found error (-32602 with data.uri on every protocol era).
 */
export function registerKernResources(
	server: McpServer,
	resources: readonly KernResourceDefinition[],
): void {
	for (const resource of resources) {
		const template = new ResourceTemplate(resource.uriTemplate, {
			list: async () => ({
				resources: (await resource.entries()).map((entry) => ({
					uri: entry.uri,
					name: entry.value,
					title: entry.title,
					description: entry.description,
					mimeType: resource.mimeType,
					size: entry.size,
				})),
			}),
			complete: {
				[resource.variable]: async (value) =>
					(await resource.entries())
						.map((entry) => entry.value)
						.filter((candidate) => candidate.startsWith(value.toLowerCase())),
			},
		});

		server.registerResource(
			resource.name,
			template,
			{
				title: resource.title,
				description: resource.description,
				mimeType: resource.mimeType,
				cacheHint: RELEASE_CACHE_HINT,
			},
			async (uri, variables) => {
				const value = variables[resource.variable];
				const text =
					typeof value === "string" ? await resource.read(value) : undefined;
				if (text === undefined) {
					throw new ResourceNotFoundError(uri.href);
				}
				return {
					contents: [{ uri: uri.href, mimeType: resource.mimeType, text }],
				};
			},
		);
	}
}
