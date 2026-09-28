import {
	loadRegistryFromManifest,
	validateRegistryAgainstToolNames,
} from "../ux/registry.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";
import { createTools } from "../ux/tools.js";

export type Catalog = {
	tools: readonly ToolDef[];
};

let catalog: Catalog | undefined;

/**
 * Every tool definition, built once per process. Server instances only register
 * from this, so creating one per connection or per HTTP request stays cheap.
 */
export function getCatalog(): Catalog {
	catalog ??= buildCatalog();
	return catalog;
}

function buildCatalog(): Catalog {
	const registry = loadRegistryFromManifest();
	const registryTools = createTools(registry);
	const names = registryTools.listToolNames();
	validateRegistryAgainstToolNames(registry, names);

	const tools = names.map((name) => {
		const tool = registryTools.getTool(name);
		if (!tool) {
			throw new Error(`Tool ${name} is listed but not defined.`);
		}
		return tool;
	});
	return { tools };
}
