import { type SectionInput, SectionSchema } from "../schemas/section.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	standaloneContext,
} from "./composition-renderer.js";

/**
 * Build HTML for a KERN UX Section composition (heading + paragraphs + optional divider).
 */
export function buildSection(
	input: SectionInput,
	locale: Locale,
	context: BlockContext = standaloneContext(locale),
): BuildResult {
	const warnings: string[] = [];
	const params = SectionSchema.parse(input);

	const {
		headingText,
		headingLevel,
		contentBlocks,
		paragraphs,
		paragraphSize,
		paragraphBold,
		divider,
	} = params;

	const headingHtml = `<h${headingLevel} class="kern-heading-medium">${escapeHtml(headingText)}</h${headingLevel}>`;

	let bodyHtml = "";
	if (contentBlocks && contentBlocks.length > 0) {
		const recursiveResult = context.renderer.renderBlocks(
			contentBlocks,
			context.depth + 1,
		);

		bodyHtml = recursiveResult.html;
		warnings.push(...recursiveResult.warnings);
	} else if (paragraphs && paragraphs.length > 0) {
		bodyHtml = paragraphs
			.map((text) => {
				const classes = ["kern-body"];
				if (paragraphSize === "small") classes.push("kern-body--small");
				if (paragraphSize === "large") classes.push("kern-body--large");
				if (paragraphBold) classes.push("kern-body--bold");
				return `<p class="${classes.join(" ")}">${escapeHtml(text)}</p>`;
			})
			.join("\n    ");
	}

	const dividerHtml = divider
		? `\n    <hr class="kern-divider" role="presentation">`
		: "";

	const html = `<section>
    ${headingHtml}
    ${bodyHtml}${dividerHtml}
</section>`;

	return { html, warnings };
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
