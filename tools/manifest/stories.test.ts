import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { extractStoryHtmlTemplates } from "./stories.js";

const STORY_CONTENT = `
export default { title: "Button/Primary" };

export const Primary = () => \`
  <button class="kern-btn kern-btn--primary">Click me</button>
\`;

export const Secondary = () => \`
  <button class="kern-btn kern-btn--secondary">Cancel</button>
\`;

export const NoHtml = () => \`just plain text\`;
`;

let tmpFile: string;

afterAll(async () => {
	if (tmpFile) {
		await fs.unlink(tmpFile).catch(() => {});
	}
});

describe("extractStoryHtmlTemplates", () => {
	it("extracts exported story templates that return HTML", async () => {
		tmpFile = path.join(
			os.tmpdir(),
			`kern-story-test-${Date.now()}.stories.js`,
		);
		await fs.writeFile(tmpFile, STORY_CONTENT, "utf8");

		const templates = await extractStoryHtmlTemplates(tmpFile);

		// Should find Primary and Secondary but skip NoHtml (no HTML tags)
		expect(templates).toHaveLength(2);

		const primary = templates.find((t) => t.exportName === "Primary");
		expect(primary?.html).toContain("kern-btn");
		expect(primary?.html).toContain("kern-btn--primary");

		const secondary = templates.find((t) => t.exportName === "Secondary");
		expect(secondary?.html).toContain("kern-btn--secondary");
	});
});
