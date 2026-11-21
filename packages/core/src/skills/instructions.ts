import { SKILL_FILES } from "./files.generated.js";

/**
 * When to load each skill, as the server's instructions say it. Every skill
 * folder needs one; the instructions test fails otherwise.
 */
export const SKILL_ROUTES: Readonly<Record<string, string>> = {
	"kern-forms": "for a form or a multi-step form",
	"kern-page-layout": "for a whole page (with kern-forms for a form on it)",
	"kern-review": "for HTML to check or fix",
};

/** The names of the skills the server serves, sorted: the folders of skills/. */
export function skillNames(): string[] {
	return [
		...new Set(
			Object.keys(SKILL_FILES).map((path) => path.split("/")[0] ?? ""),
		),
	].sort();
}

/** "a, b and c" */
function list(items: readonly string[]): string {
	return items.length < 2
		? (items[0] ?? "")
		: `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/**
 * The server's instructions, which every client gets at connect: what the
 * server is for, and which skill to load for what, by name (which works
 * however the skill reached the client) and by its skill:// URI.
 */
export function serverInstructions(): string {
	const names = skillNames();
	const missing = names.filter((name) => !SKILL_ROUTES[name]);
	if (missing.length > 0) {
		throw new Error(`No route in SKILL_ROUTES for ${missing.join(", ")}.`);
	}
	const routes = names.map((name) => `${name} ${SKILL_ROUTES[name]}`);
	const uris = names.map((name) => `skill://${name}/SKILL.md`);
	return [
		"KERN UX: tools that render KERN UX markup and check it strictly.",
		`Before you build, load the matching skill: ${routes.join(", ")}.`,
		`Over MCP they're ${list(uris)}; where they're installed as files, use those.`,
	].join(" ");
}
