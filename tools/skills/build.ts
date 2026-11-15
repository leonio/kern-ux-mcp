/**
 * Writes the generated files of the skills folder: each skill's references
 * that are one of our guides (GENERATED_SKILL_FILES). A SKILL.md is written by
 * hand and never touched here. The folder test fails until this has run.
 *
 *   npm run skills:build
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildGeneratedSkillFiles } from "../../packages/core/src/skills/generated.js";

const SKILLS = fileURLToPath(new URL("../../skills/", import.meta.url));

const files = await buildGeneratedSkillFiles();
for (const [file, text] of files) {
	const target = path.join(SKILLS, file);
	const before = await fs.readFile(target, "utf8").catch(() => undefined);
	if (before === text) continue;
	await fs.mkdir(path.dirname(target), { recursive: true });
	await fs.writeFile(target, text, "utf8");
	console.log(`${before === undefined ? "Wrote" : "Updated"} skills/${file}`);
}
console.log(`The ${files.size} generated skill files are current.`);
