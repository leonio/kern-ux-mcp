import { createInputForm } from "../prompts/create-input-form.js";
import { createPageLayout } from "../prompts/create-page-layout.js";
import type { KernPromptDefinition } from "../prompts/definition.js";
import { reviewKernHtml } from "../prompts/review-kern-html.js";
import { componentCards } from "../resources/component-cards.js";
import type { KernResourceDefinition } from "../resources/definition.js";
import { guides } from "../resources/guides.js";
import { loadRegistryFromManifest } from "../ux/registry.js";
import { assertComponentToolsInRegistry } from "../ux/tool-builders/component-tools.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";
import { createTools } from "../ux/tools.js";

export type Catalog = {
	tools: readonly ToolDef[];
	resources: readonly KernResourceDefinition[];
	prompts: readonly KernPromptDefinition[];
};

let catalog: Catalog | undefined;

/**
 * Every tool, resource and prompt definition, built once per process. Server
 * instances only register from this, so creating one per connection or per
 * HTTP request stays cheap. Resource content is built on first read and kept.
 */
export function getCatalog(): Catalog {
	catalog ??= buildCatalog();
	return catalog;
}

function buildCatalog(): Catalog {
	const registry = loadRegistryFromManifest();
	assertComponentToolsInRegistry(registry);
	const registryTools = createTools(registry);
	const names = registryTools.listToolNames();

	const tools = names.map((name) => {
		const tool = registryTools.getTool(name);
		if (!tool) {
			throw new Error(`Tool ${name} is listed but not defined.`);
		}
		return tool;
	});
	const guideResources = guides(registry, tools);
	return {
		tools,
		resources: [componentCards(registry, tools), guideResources],
		prompts: [
			createInputForm(registry, guideResources),
			createPageLayout(registry, guideResources),
			reviewKernHtml(guideResources),
		],
	};
}
