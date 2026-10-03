/**
 * Imports the KERN knowledge bundle written by kern-ux-knowledge-packer: checks
 * it against the packer's own schema and against what this repo's tools need,
 * prints what changes, replaces knowledge/ with it byte for byte, and generates
 * packages/core/src/ux/registry.json from it. With --dry-run it only checks.
 * Without a path it regenerates registry.json from the checked-in knowledge/,
 * e.g. after a change to knowledge-map.ts.
 *
 *   npm run knowledge:import -- <path/to/bundle> [--dry-run]
 *   npm run knowledge:import
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	checkKnowledgeBundle,
	formatKnowledgeImport,
} from "../../packages/core/src/ux/knowledge-import.js";
import { projectRegistry } from "../../packages/core/src/ux/knowledge-projection.js";
import type { RegistryManifest } from "../../packages/core/src/ux/registry.schema.js";
import { checkAgainstPackerSchema, readBundleDir } from "./bundle-files.js";

const KNOWLEDGE = fileURLToPath(new URL("../../knowledge/", import.meta.url));
const REGISTRY = fileURLToPath(
	new URL("../../packages/core/src/ux/registry.json", import.meta.url),
);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const source = args.find((arg) => !arg.startsWith("--"));

// npm runs scripts from the repo root; resolve the path from where it was typed.
const sourcePath = source
	? path.resolve(process.env.INIT_CWD ?? process.cwd(), source)
	: KNOWLEDGE;

const next = await readBundleDir(sourcePath);
const previous =
	source && (await exists(KNOWLEDGE))
		? await readBundleDir(KNOWLEDGE)
		: undefined;

// Our checks assume a bundle the packer's schema accepts.
const schemaProblems = checkAgainstPackerSchema(next.json);
const problems =
	schemaProblems.length > 0 ? schemaProblems : checkKnowledgeBundle(next.json);

if (source) {
	console.log(formatKnowledgeImport(next.json, previous?.json, problems));
} else if (problems.length > 0) {
	console.log(problems.map((problem) => `  ${problem}`).join("\n"));
}

if (problems.length > 0) {
	console.error("\nNot imported.");
	process.exit(1);
}
if (dryRun) {
	console.log("\nDry run: knowledge/ and registry.json are unchanged.");
	process.exit(0);
}

if (source) {
	for (const file of previous?.bytes.keys() ?? []) {
		if (!next.bytes.has(file)) await fs.rm(path.join(KNOWLEDGE, file));
	}
	for (const [file, content] of next.bytes) {
		const target = path.join(KNOWLEDGE, file);
		await fs.mkdir(path.dirname(target), { recursive: true });
		await fs.writeFile(target, content);
	}
	console.log(`\nWrote ${next.bytes.size} files to knowledge/.`);
}

const current = JSON.parse(
	await fs.readFile(REGISTRY, "utf8"),
) as RegistryManifest;
const registry = projectRegistry(next.json, current.tokens);
await fs.writeFile(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
console.log(
	`Wrote registry.json: ${registry.components.length} components. Next: npm test, then review the snapshot diffs.`,
);

async function exists(dir: string) {
	try {
		await fs.stat(dir);
		return true;
	} catch {
		return false;
	}
}
