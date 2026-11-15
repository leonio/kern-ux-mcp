import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The skills folder at the repo's root. Test-only: the server inlines the files. */
export const SKILLS_DIR = fileURLToPath(
	new URL("../../../../skills/", import.meta.url),
);

export type SkillFile = {
	/** The path under skills/, with `/`: kern-forms/SKILL.md. */
	path: string;
	text: string;
};

/** The names of the skill folders, sorted; none while the folder doesn't exist. */
export async function skillFolders(): Promise<string[]> {
	try {
		const entries = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
		throw error;
	}
}

/** Every file under skills/, sorted by path. */
export async function readSkillFiles(): Promise<SkillFile[]> {
	const files: SkillFile[] = [];
	for (const folder of await skillFolders()) {
		const entries = await fs.readdir(path.join(SKILLS_DIR, folder), {
			recursive: true,
			withFileTypes: true,
		});
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			const absolute = path.join(entry.parentPath, entry.name);
			files.push({
				path: path.relative(SKILLS_DIR, absolute).split(path.sep).join("/"),
				text: await fs.readFile(absolute, "utf8"),
			});
		}
	}
	return files.sort((a, b) => a.path.localeCompare(b.path));
}
