import {
	memorySkillFiles,
	type SkillCatalog,
	SkillsExtension,
} from "@modelcontextprotocol/server/ext/skills";

import { type KernSkillDefinition, skillFiles } from "../skills/definition.js";
import { RELEASE_CACHE_HINT } from "./cache-hint.js";
import { getCatalog } from "./catalog.js";

let skills: Promise<SkillCatalog> | undefined;

/**
 * The skills as the SDK's catalog, loaded once per process: it works out each
 * file's size and digest, and every server attaches the same catalog. strict
 * turns a skill the extension would skip, such as one with an invalid name,
 * into a failed load. Like resources, skills only change with a release.
 */
export function getSkills(): Promise<SkillCatalog> {
	skills ??= loadSkills(getCatalog().skills);
	return skills;
}

/** Loads skill definitions into a catalog. Their files are built in memory: the bundled hosts have no folder to read. */
export async function loadSkills(
	definitions: readonly KernSkillDefinition[],
): Promise<SkillCatalog> {
	return SkillsExtension.load(
		memorySkillFiles(await catalogFiles(definitions)),
		{
			strict: true,
			cacheHint: RELEASE_CACHE_HINT,
		},
	);
}

/** Every file of every skill, by its path from the catalog's root: <skill>/<path>. */
export async function catalogFiles(
	definitions: readonly KernSkillDefinition[],
): Promise<Record<string, string>> {
	const files: Record<string, string> = {};
	for (const definition of definitions) {
		for (const [path, text] of Object.entries(await skillFiles(definition))) {
			files[`${definition.name}/${path}`] = text;
		}
	}
	return files;
}
