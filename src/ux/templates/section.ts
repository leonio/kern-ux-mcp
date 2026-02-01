import { MAX_RECURSIVE_CONTENT_DEPTH } from "../schemas/content-union.js";
import { type SectionInput, SectionSchema } from "../schemas/section.js";
import type { BuildResult, Locale } from "../types.js";
import { buildCard } from "./card.js";
import type {
	DisclosureNodeRenderer,
	SectionNodeRenderer,
} from "./content-union.js";
import { renderRecursiveContentBlocks } from "./content-union.js";
import { buildGrid } from "./grid.js";

type SectionRenderContext = {
	depth: number;
	maxDepth: number;
	renderSectionNode?: SectionNodeRenderer;
	renderDisclosureNode?: DisclosureNodeRenderer;
};

const DEFAULT_SECTION_RENDER_CONTEXT: SectionRenderContext = {
	depth: 1,
	maxDepth: MAX_RECURSIVE_CONTENT_DEPTH,
};

/**
 * Build HTML for a KERN UX Section composition (heading + paragraphs + optional divider).
 */
export function buildSection(
	input: SectionInput,
	locale: Locale,
	context: SectionRenderContext = DEFAULT_SECTION_RENDER_CONTEXT,
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
		const recursiveResult = renderRecursiveContentBlocks(contentBlocks, {
			locale,
			currentDepth: context.depth,
			maxDepth: context.maxDepth,
			renderCardNode: (cardInput, nextDepth) =>
				buildCard(cardInput as Parameters<typeof buildCard>[0], locale, {
					depth: nextDepth,
					maxDepth: context.maxDepth,
					renderSectionNode: context.renderSectionNode,
					renderDisclosureNode: context.renderDisclosureNode,
				}),
			renderGridNode: (gridInput, nextDepth) =>
				buildGrid(gridInput as Parameters<typeof buildGrid>[0], locale, {
					depth: nextDepth,
					maxDepth: context.maxDepth,
					renderSectionNode: context.renderSectionNode,
					renderDisclosureNode: context.renderDisclosureNode,
				}),
			renderSectionNode: context.renderSectionNode,
			renderDisclosureNode: context.renderDisclosureNode,
		});

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
