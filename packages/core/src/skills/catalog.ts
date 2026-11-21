import {
	memorySkillFiles,
	type SkillCatalog,
	SkillsExtension,
} from "@modelcontextprotocol/server/ext/skills";

import { RELEASE_CACHE_HINT } from "../mcp/cache-hint.js";
import { SKILL_FILES } from "./files.generated.js";

let loading: Promise<SkillCatalog> | undefined;

/**
 * The skills as MCP's Skills extension serves them (SEP-2640): every file of
 * skills/, with its digest, at skill://<name>/<path>. Loaded once per process
 * and attached to each server; strict, so a broken skill fails the start.
 * The hosts await it before they serve, since the SDK's load is async.
 */
export function loadKernSkills(): Promise<SkillCatalog> {
	loading ??= SkillsExtension.load(memorySkillFiles({ ...SKILL_FILES }), {
		strict: true,
		// Skills change only with a release, like the lists.
		cacheHint: RELEASE_CACHE_HINT,
	});
	return loading;
}
