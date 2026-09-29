import manifest from "./registry.json" with { type: "json" };
import type { Registry, RegistryManifest } from "./types.js";

function toRegistry(manifest: RegistryManifest): Registry {
	const components = [...manifest.components].sort((a, b) =>
		a.id.localeCompare(b.id),
	);
	const byId = new Map(
		components.map((component) => [component.id, component] as const),
	);

	return {
		manifestVersion: manifest.manifestVersion,
		generatedAt: manifest.generatedAt,
		upstream: manifest.upstream,
		tokens: manifest.tokens ?? { colors: [], spacing: [], rawVariables: [] },
		components,
		byId,
	};
}

/**
 * The checked-in registry.json, loaded as a JSON import: it's part of the module
 * graph, so bundles inline it and there's no file path to resolve at runtime.
 */
export function loadRegistryFromManifest(): Registry {
	const parsed = manifest as unknown as Partial<RegistryManifest> | null;

	if (!parsed?.manifestVersion || !Array.isArray(parsed.components)) {
		throw new Error(
			`Invalid registry manifest (registry.json): expected keys "manifestVersion" and "components".`,
		);
	}

	return toRegistry(parsed as RegistryManifest);
}

export function validateRegistryAgainstToolNames(
	registry: Registry,
	toolNames: string[],
) {
	const generatedComponentIds = new Set(
		toolNames
			.filter((name) => name.startsWith("get_"))
			.map((name) => name.replace(/^get_/, ""))
			.filter((id) => id !== "component_docs"),
	);

	for (const component of registry.components) {
		if (!generatedComponentIds.has(component.id)) {
			console.warn(
				`Manifest component missing MCP wrapper: ${component.id}. Please update createTools().`,
			);
		}
	}
}
