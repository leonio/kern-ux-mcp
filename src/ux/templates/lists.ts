import { type ListsRenderInput, listsRenderSchema } from "../schemas/lists.js";
import type { BuildResult } from "../types.js";

export function buildLists(input: ListsRenderInput): BuildResult {
	const params = listsRenderSchema.parse(input);

	const html = params.ordered
		? `<ol class="kern-list">\n  <li>${params.text} 1</li>\n  <li>${params.text} 2</li>\n</ol>`
		: `<ul class="kern-list">\n  <li>${params.text} 1</li>\n  <li>${params.text} 2</li>\n</ul>`;

	return { html, warnings: [] };
}
