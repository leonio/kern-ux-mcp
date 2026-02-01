import { MAX_RECURSIVE_CONTENT_DEPTH } from "../schemas/content-union.js";
import {
	type DisclosureInput,
	DisclosureSchema,
} from "../schemas/disclosure.js";
import type { BuildResult, Locale } from "../types.js";
import { buildCard } from "./card.js";
import type {
	DisclosureNodeRenderer,
	SectionNodeRenderer,
} from "./content-union.js";
import { renderRecursiveContentBlocks } from "./content-union.js";
import { buildGrid } from "./grid.js";

type DisclosureRenderContext = {
	depth: number;
	maxDepth: number;
	renderSectionNode?: SectionNodeRenderer;
	renderDisclosureNode?: DisclosureNodeRenderer;
};

const DEFAULT_DISCLOSURE_RENDER_CONTEXT: DisclosureRenderContext = {
	depth: 1,
	maxDepth: MAX_RECURSIVE_CONTENT_DEPTH,
};

/**
 * Build HTML for a KERN UX Disclosure (expand/collapse) component.
 * Uses <details>/<summary> with accordion styling from KERN UX.
 */
export function buildDisclosure(
	input: DisclosureInput,
	locale: Locale,
	context: DisclosureRenderContext = DEFAULT_DISCLOSURE_RENDER_CONTEXT,
): BuildResult {
	const warnings: string[] = [];
	const params = DisclosureSchema.parse(input);

	const { triggerLabel, contentBlocks, content, contentIsHtml, open } = params;

	const openAttr = open ? " open" : "";
	let bodyContent = "";

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
		bodyContent = recursiveResult.html;
		warnings.push(...recursiveResult.warnings);
	} else if (typeof content === "string") {
		bodyContent = contentIsHtml
			? content
			: `<p class="kern-body">${escapeHtml(content)}</p>`;
	}

	const html = `<details class="kern-accordion__item"${openAttr}>
    <summary class="kern-title">
        <span>${escapeHtml(triggerLabel)}</span>
        <span class="kern-icon kern-icon--chevron-right" aria-hidden="true"></span>
    </summary>
    <div class="kern-accordion__body">
        ${bodyContent}
    </div>
</details>`;

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
