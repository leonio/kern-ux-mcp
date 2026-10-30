/**
 * A skill of the MCP Skills extension (SEP-2640): a SKILL.md that tells the
 * model how to do one kind of task with our tools, and the reference files it
 * points to. Hosts show the model each skill's name and description and load
 * the rest when a task needs it. Kept SDK-free like ToolDef; mcp/skills.ts
 * serves them.
 */
export type KernSkillDefinition = {
	/** The skill's folder: 1 to 64 lowercase letters, digits and single hyphens. */
	name: string;
	/** What the skill does and when to use it, at most 1024 characters: hosts show it to the model. */
	description: string;
	/** The SKILL.md body and the files it links, by their path in the skill's folder. */
	content(): Promise<{
		body: string;
		references: Readonly<Record<string, string>>;
	}>;
};

/** The skills' license: they quote KERN's documentation, which is EUPL-1.2 like this server. */
const LICENSE = "EUPL-1.2";

/**
 * Every file of a skill by its path in the skill's folder: SKILL.md, with the
 * frontmatter in front of the body, and the references. The frontmatter's
 * values are double-quoted, so a colon in the description stays text.
 */
export async function skillFiles(
	skill: KernSkillDefinition,
): Promise<Record<string, string>> {
	const { body, references } = await skill.content();
	const frontmatter = Object.entries({
		name: skill.name,
		description: skill.description,
		license: LICENSE,
	}).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

	return {
		"SKILL.md": ["---", ...frontmatter, "---", "", body].join("\n"),
		...references,
	};
}
