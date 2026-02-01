import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Registry, RegistryManifest } from "./types.js";

function manifestPathFromModule() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	return path.join(__dirname, "registry.json");
}

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
		tokens: manifest.tokens ?? { colors: [], spacing: [], rawVariables: [] },
		components,
		byId,
	};
}

export async function loadRegistryFromManifest(): Promise<Registry> {
	const manifestPath = manifestPathFromModule();

	let parsed: RegistryManifest;
	try {
		const text = await fs.readFile(manifestPath, "utf8");
		parsed = JSON.parse(text) as RegistryManifest;
	} catch (error) {
		throw new Error(
			`Failed to load registry manifest at ${manifestPath}. Run "npm run generate-manifest" before starting the server.`,
			{ cause: error as Error },
		);
	}

	if (!parsed?.manifestVersion || !Array.isArray(parsed.components)) {
		throw new Error(
			`Invalid registry manifest at ${manifestPath}: expected keys "manifestVersion" and "components".`,
		);
	}

	return toRegistry(parsed);
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
