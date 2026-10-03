/**
 * Imports the KERN knowledge bundle written by kern-ux-knowledge-packer: checks
 * it against the packer's own schema and against what this repo's tools need,
 * prints what changes, and replaces knowledge/ with it, byte for byte. With
 * --dry-run it only checks.
 *
 *   npm run knowledge:import -- <path/to/bundle> [--dry-run]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	checkKnowledgeBundle,
	formatKnowledgeImport,
} from "../../packages/core/src/ux/knowledge-import.js";
import { checkAgainstPackerSchema, readBundleDir } from "./bundle-files.js";

const TARGET = fileURLToPath(new URL("../../knowledge/", import.meta.url));

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const source = args.find((arg) => !arg.startsWith("--"));

if (!source) {
	console.error(
		"Usage: npm run knowledge:import -- <path/to/bundle> [--dry-run]",
	);
	process.exit(2);
}

// npm runs scripts from the repo root; resolve the path from where it was typed.
const sourcePath = path.resolve(process.env.INIT_CWD ?? process.cwd(), source);

const next = await readBundleDir(sourcePath);
const previous = (await exists(TARGET))
	? await readBundleDir(TARGET)
	: undefined;

// Our checks assume a bundle the packer's schema accepts.
const schemaProblems = checkAgainstPackerSchema(next.json);
const problems =
	schemaProblems.length > 0 ? schemaProblems : checkKnowledgeBundle(next.json);

console.log(formatKnowledgeImport(next.json, previous?.json, problems));

if (problems.length > 0) {
	console.error("\nNot imported.");
	process.exit(1);
}
if (dryRun) {
	console.log("\nDry run: knowledge/ is unchanged.");
	process.exit(0);
}

for (const file of previous?.bytes.keys() ?? []) {
	if (!next.bytes.has(file)) await fs.rm(path.join(TARGET, file));
}
for (const [file, content] of next.bytes) {
	const target = path.join(TARGET, file);
	await fs.mkdir(path.dirname(target), { recursive: true });
	await fs.writeFile(target, content);
}
console.log(
	`\nWrote ${next.bytes.size} files to knowledge/. Next: npm test, then review the diff.`,
);

async function exists(dir: string) {
	try {
		await fs.stat(dir);
		return true;
	} catch {
		return false;
	}
}
