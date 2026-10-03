import manifest from "./registry.json" with { type: "json" };
import type { Registry, RegistryManifest } from "./types.js";

/**
 * The major version of the registry contract (registry.schema.ts) this server
 * reads. It lives here, not in the schema module, so loading the registry at
 * startup doesn't build the contract's Zod schemas (about 10 ms).
 */
export const REGISTRY_CONTRACT_MAJOR = 1;

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
 * Builds the runtime registry from a manifest, with only cheap checks: the full
 * contract (RegistryManifestSchema) is checked by a test, and the bundles inline
 * the file it checked.
 */
export function registryFromManifest(json: unknown): Registry {
	const parsed = json as Partial<RegistryManifest> | null;

	if (!parsed?.manifestVersion || !Array.isArray(parsed.components)) {
		throw new Error(
			`Invalid registry manifest (registry.json): expected keys "manifestVersion" and "components".`,
		);
	}
	if (!parsed.manifestVersion.startsWith(`${REGISTRY_CONTRACT_MAJOR}.`)) {
		throw new Error(
			`registry.json has manifestVersion ${parsed.manifestVersion}, but this server reads contract major ${REGISTRY_CONTRACT_MAJOR}.`,
		);
	}

	return toRegistry(parsed as RegistryManifest);
}

/**
 * The checked-in registry.json, loaded as a JSON import: it's part of the module
 * graph, so bundles inline it and there's no file path to resolve at runtime.
 */
export function loadRegistryFromManifest(): Registry {
	return registryFromManifest(manifest);
}
