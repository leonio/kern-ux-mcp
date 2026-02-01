import {
	type TypographyRenderInput,
	TypographyRenderSchema,
} from "../schemas/typography.js";
import type { BuildResult } from "../types.js";

/**
 * Build foundational typography HTML.
 */
export function buildTypography(input: TypographyRenderInput): BuildResult {
	const warnings: string[] = [];
	const params = TypographyRenderSchema.parse(input);
	const text = params.text ?? "Beispieltext";

	switch (params.kind) {
		case "heading": {
			const level = params.level ?? 2;
			return {
				html: `<h${level} class="kern-heading-medium">${text}</h${level}>`,
				warnings,
			};
		}
		case "body":
			return { html: `<p class="kern-body">${text}</p>`, warnings };
		case "label":
			return { html: `<label class="kern-label">${text}</label>`, warnings };
		case "link":
			return {
				html: `<a class="kern-link" href="${params.href ?? "#"}">${text}</a>`,
				warnings,
			};
		case "list":
			return {
				html: params.ordered
					? `<ol class="kern-list">\n  <li>${text} 1</li>\n  <li>${text} 2</li>\n</ol>`
					: `<ul class="kern-list">\n  <li>${text} 1</li>\n  <li>${text} 2</li>\n</ul>`,
				warnings,
			};
		case "preline":
			return { html: `<p class="kern-preline">${text}</p>`, warnings };
		case "subline":
			return { html: `<p class="kern-subline">${text}</p>`, warnings };
		case "title":
			return { html: `<h2 class="kern-title">${text}</h2>`, warnings };
		default:
			return { html: `<p class="kern-body">${text}</p>`, warnings };
	}
}
