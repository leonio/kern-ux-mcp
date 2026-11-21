/**
 * Writes the generated files of the skills folder: each skill's references
 * that are one of our guides (GENERATED_SKILL_FILES), then the module that
 * carries every file of the folder into the code (SKILL_FILES_MODULE). A
 * SKILL.md is written by hand and never touched here. The folder test fails
 * until this has run.
 *
 *   pnpm skills:build
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	buildGeneratedSkillFiles,
	renderSkillFilesModule,
	SKILL_FILES_MODULE,
} from "../../packages/core/src/skills/generated.js";
import { readSkillFiles } from "../../packages/core/src/test-support/skills.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Writes the file if its text changed; reports what it did. */
async function write(file: string, text: string): Promise<void> {
	const target = path.join(ROOT, file);
	const before = await fs.readFile(target, "utf8").catch(() => undefined);
	if (before === text) return;
	await fs.mkdir(path.dirname(target), { recursive: true });
	await fs.writeFile(target, text, "utf8");
	console.log(`${before === undefined ? "Wrote" : "Updated"} ${file}`);
}

const files = await buildGeneratedSkillFiles();
for (const [file, text] of files) {
	await write(`skills/${file}`, text);
}
// After the references, so the module carries them as written now.
await write(SKILL_FILES_MODULE, renderSkillFilesModule(await readSkillFiles()));
console.log(
	`The ${files.size} generated references and ${SKILL_FILES_MODULE} are current.`,
);
