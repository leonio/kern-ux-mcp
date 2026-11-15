import { getCatalog } from "../mcp/catalog.js";

/**
 * A file of the skills folder that `npm run skills:build` writes, never a
 * person: a skill's reference that is one of our guides, byte for byte, so
 * kern://guides/{name} and the skill's file are the same text.
 */
export type GeneratedSkillFile = {
	/** The path under skills/, such as kern-forms/references/forms.md. */
	path: string;
	/** The guide it is: the name in kern://guides/{name}. */
	guide: string;
};

/** Every generated file of the skills folder. A skill adds its own here. */
export const GENERATED_SKILL_FILES: readonly GeneratedSkillFile[] = [];

/** Each generated file's text by its path, as the guide builder writes it now. */
export async function buildGeneratedSkillFiles(): Promise<Map<string, string>> {
	const guides = getCatalog().resources.find(
		(resource) => resource.name === "guides",
	);
	if (!guides) throw new Error("The catalog has no guides.");

	const files = new Map<string, string>();
	for (const file of GENERATED_SKILL_FILES) {
		const text = await guides.read(file.guide);
		if (text === undefined) {
			throw new Error(
				`There's no guide ${file.guide} for skills/${file.path}.`,
			);
		}
		files.set(file.path, text);
	}
	return files;
}
