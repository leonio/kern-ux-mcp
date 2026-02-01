import {
	type LayoutRenderInput,
	LayoutRenderSchema,
} from "../schemas/layout.js";
import type { BuildResult } from "../types.js";

/**
 * Build foundational layout starter HTML.
 */
export function buildLayout(input: LayoutRenderInput): BuildResult {
	const warnings: string[] = [];
	const params = LayoutRenderSchema.parse(input);
	const heading =
		params.includeHeading === true
			? `<h2 class="kern-heading-medium">${params.headingText ?? "Abschnitt"}</h2>\n`
			: "";

	return {
		html: `<div class="kern-container">\n  ${heading}<div class="kern-row">\n    <div class="kern-col">\n      <p class="kern-body">Inhalt</p>\n    </div>\n  </div>\n</div>`,
		warnings,
	};
}
