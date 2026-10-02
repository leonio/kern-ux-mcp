/**
 * Imports a registry.json from the external generator: checks it against the
 * contract and against the component tools, prints what changes, and writes it
 * to packages/core/src/ux/registry.json. With --dry-run it only checks.
 *
 *   npm run registry:import -- <path/to/registry.json> [--dry-run]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	checkRegistryImport,
	formatRegistryImportReport,
	isRegistryImportable,
} from "../../packages/core/src/ux/registry-import.js";

const TARGET = fileURLToPath(
	new URL("../../packages/core/src/ux/registry.json", import.meta.url),
);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const source = args.find((arg) => !arg.startsWith("--"));

if (!source) {
	console.error(
		"Usage: npm run registry:import -- <path/to/registry.json> [--dry-run]",
	);
	process.exit(2);
}

// npm runs scripts from the repo root; resolve the path from where it was typed.
const sourcePath = path.resolve(process.env.INIT_CWD ?? process.cwd(), source);

let candidate: unknown;
try {
	candidate = JSON.parse(await fs.readFile(sourcePath, "utf8"));
} catch (error) {
	console.error(
		`Can't read ${sourcePath} as JSON: ${(error as Error).message}`,
	);
	process.exit(1);
}
const current: unknown = JSON.parse(await fs.readFile(TARGET, "utf8"));

const report = checkRegistryImport(candidate, current);
console.log(formatRegistryImportReport(report));

if (!isRegistryImportable(report)) {
	console.error("\nNot imported.");
	process.exit(1);
}
if (dryRun) {
	console.log("\nDry run: registry.json is unchanged.");
	process.exit(0);
}

// Same formatting as before, with the generator's key order and unknown keys kept.
await fs.writeFile(TARGET, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
console.log(
	`\nWrote ${path.relative(process.cwd(), TARGET)}. Next: npm test, then \`npx vitest run -u\` if tool titles or docs changed, and review the snapshot diffs.`,
);
