import { type LinkRenderInput, linkRenderSchema } from "../schemas/link.js";
import type { BuildResult } from "../types.js";

export function buildLink(input: LinkRenderInput): BuildResult {
	const params = linkRenderSchema.parse(input);
	return {
		html: `<a class="kern-link" href="${params.href}">${params.text}</a>`,
		warnings: [],
	};
}
