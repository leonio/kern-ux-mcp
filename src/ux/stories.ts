import fs from "node:fs/promises";

export type StoryExtract = {
	storyFile: string;
	exportName: string;
	html: string;
};

function normalizeHtml(html: string) {
	// Keep markup stable-ish for snapshots.
	return html.trim().replace(/\r\n/g, "\n");
}

/**
 * Extracts exported story templates that return a template-string.
 * Works with the common pattern:
 *   export const Primary = () => `...html...`;
 */
export async function extractStoryHtmlTemplates(
	storyFilePath: string,
): Promise<StoryExtract[]> {
	const text = await fs.readFile(storyFilePath, "utf8");
	const results: StoryExtract[] = [];

	// Very pragmatic regex: captures `export const Name = (...) => `...``
	// Note: This intentionally ignores scripts/JS inside the template (still part of the HTML string).
	const re =
		/export\s+const\s+(?<name>[A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*`(?<html>[\s\S]*?)`\s*;?/g;

	for (const match of text.matchAll(re)) {
		const exportName = match.groups?.name;
		const html = match.groups?.html;
		if (!exportName || !html) continue;
		if (!/<[a-z][\s\S]*>/i.test(html)) continue;

		results.push({
			storyFile: storyFilePath,
			exportName,
			html: normalizeHtml(html),
		});
	}

	return results;
}
