import path from "node:path";

import {
	type SkillCatalog,
	SkillsExtension,
	type SkillWarning,
} from "@modelcontextprotocol/server/ext/skills";
import { nodeSkillFiles } from "@modelcontextprotocol/server/ext/skills/node";
import { beforeAll, describe, expect, it } from "vitest";

import {
	readSkillFiles,
	SKILLS_DIR,
	skillFolders,
} from "../test-support/skills.js";
import {
	buildGeneratedSkillFiles,
	GENERATED_SKILL_FILES,
} from "./generated.js";

/**
 * The skills folder at the repo's root (docs/plan-v2.1/a1-kickoff.md): what a
 * host checks when it loads the skills, our own rules for them, and the files
 * skills:build writes.
 */

const COMPATIBILITY = "Needs the KERN UX MCP server (@leonio/kern-ux-mcp).";
const MAX_DESCRIPTION = 1024;
const MAX_SKILL_LINES = 150;

const folders = await skillFolders();
const files = await readSkillFiles();
const fileText = new Map(files.map((file) => [file.path, file.text]));

/** The targets of a Markdown file's inline links. */
function linkTargets(markdown: string): string[] {
	return [...markdown.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(
		([, target]) => target ?? "",
	);
}

describe("the skills folder", () => {
	let catalog: SkillCatalog | undefined;
	const warnings: SkillWarning[] = [];

	beforeAll(async () => {
		if (folders.length === 0) return;
		catalog = await SkillsExtension.load(nodeSkillFiles(SKILLS_DIR), {
			strict: true,
			onWarning: (warning) => warnings.push(warning),
		});
	});

	it("loads under the SDK's strict checks, one skill per folder", () => {
		expect(warnings).toEqual([]);
		expect(
			(catalog?.entries ?? []).map((skill) => skill.frontmatter.name),
		).toEqual(folders);
	});

	describe.each(folders)("%s", (folder) => {
		const skillMd = fileText.get(`${folder}/SKILL.md`) ?? "";

		it("has its name, a description, the licence and the server it needs", () => {
			const entry = catalog?.entries.find(
				(skill) => skill.uri === `skill://${folder}/SKILL.md`,
			);
			const frontmatter: Record<string, unknown> = { ...entry?.frontmatter };

			expect(frontmatter.name).toBe(folder);
			expect(frontmatter.description).toEqual(expect.stringMatching(/\S/));
			expect(String(frontmatter.description).length).toBeLessThanOrEqual(
				MAX_DESCRIPTION,
			);
			expect(frontmatter.license).toBe("EUPL-1.2");
			expect(frontmatter.compatibility).toBe(COMPATIBILITY);
		});

		it(`keeps SKILL.md under ${MAX_SKILL_LINES} lines`, () => {
			expect(skillMd.trimEnd().split("\n").length).toBeLessThanOrEqual(
				MAX_SKILL_LINES,
			);
		});

		it("links only files of its own", () => {
			const broken = linkTargets(skillMd)
				.filter((target) => !/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target))
				.filter((target) => {
					const [file = ""] = target.split("#");
					const resolved = path.posix.normalize(path.posix.join(folder, file));
					return !resolved.startsWith(`${folder}/`) || !fileText.has(resolved);
				});

			expect(broken).toEqual([]);
		});
	});
});

describe("the generated skill files", () => {
	it("are what skills:build writes from the guides now", async () => {
		const built = await buildGeneratedSkillFiles();

		for (const [file, text] of built) {
			expect(
				fileText.get(file),
				`skills/${file} differs: run npm run skills:build`,
			).toBe(text);
		}
	});

	it("each belong to a skill", () => {
		for (const file of GENERATED_SKILL_FILES) {
			expect(folders).toContain(file.path.split("/")[0]);
		}
	});
});
