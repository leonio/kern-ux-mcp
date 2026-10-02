import { type LinkRenderInput, linkRenderSchema } from "../schemas/link.js";
import type { BuildResult } from "../types.js";
import { escapeHtml } from "./escape.js";

export function buildLink(input: LinkRenderInput): BuildResult {
	const params = linkRenderSchema.parse(input);
	return {
		html: `<a class="kern-link" href="${escapeHtml(params.href)}">${escapeHtml(params.text)}</a>`,
		warnings: [],
	};
}
