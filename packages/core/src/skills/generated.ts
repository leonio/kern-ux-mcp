import { getCatalog } from "../mcp/catalog.js";
import { loadRegistryFromManifest } from "../ux/registry.js";
import { buildGuide } from "./guide-builder.js";

/**
 * A file of the skills folder that `pnpm skills:build` writes, never a
 * person: a skill's reference that is one of the guides of guide-builder.ts.
 */
export type GeneratedSkillFile = {
	/** The path under skills/, such as kern-forms/references/forms.md. */
	path: string;
	/** The guide it is, by its name in GUIDES. */
	guide: string;
};

/** Every generated file of the skills folder. A skill adds its own here. */
export const GENERATED_SKILL_FILES: readonly GeneratedSkillFile[] = [
	{ path: "kern-forms/references/forms.md", guide: "forms" },
	{ path: "kern-page-layout/references/layout.md", guide: "layout" },
	{ path: "kern-review/references/accessibility.md", guide: "accessibility" },
];

/** Each generated file's text by its path, as the guide builder writes it now. */
export async function buildGeneratedSkillFiles(): Promise<Map<string, string>> {
	const registry = loadRegistryFromManifest();
	const { tools } = getCatalog();

	const files = new Map<string, string>();
	for (const file of GENERATED_SKILL_FILES) {
		files.set(file.path, await buildGuide(registry, file.guide, tools));
	}
	return files;
}

/** Where `pnpm skills:build` writes the module of every skill file, from the repo's root. */
export const SKILL_FILES_MODULE = "packages/core/src/skills/files.generated.ts";

/**
 * The module that carries every file of the skills folder into the code, and
 * so into each bundle: its text for these files (paths under skills/, `/`).
 */
export function renderSkillFilesModule(
	files: readonly { path: string; text: string }[],
): string {
	const entries = [...files]
		.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
		.map(
			(file) => `\t${JSON.stringify(file.path)}: ${JSON.stringify(file.text)},`,
		);
	return [
		"// Written by `pnpm skills:build` from skills/. Don't edit by hand.",
		"",
		"/** Every file of the skills folder, by its path under skills/. */",
		"export const SKILL_FILES: Readonly<Record<string, string>> = {",
		...entries,
		"};",
		"",
	].join("\n");
}
