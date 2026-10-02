import {
	type DisclosureInput,
	DisclosureRenderSchema,
} from "../schemas/disclosure.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	renderChildBlocks,
	standaloneContext,
} from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";

/**
 * Build HTML for a KERN UX Disclosure (expand/collapse) component.
 * Uses <details>/<summary> with accordion styling from KERN UX.
 */
export function buildDisclosure(
	input: DisclosureInput,
	locale: Locale,
	context: BlockContext = standaloneContext(locale),
): BuildResult {
	const warnings: string[] = [];
	const params = DisclosureRenderSchema.parse(input);

	const { triggerLabel, contentBlocks, content, contentIsHtml, open } = params;

	const openAttr = open ? " open" : "";
	let bodyContent = "";

	if (contentBlocks && contentBlocks.length > 0) {
		const recursiveResult = renderChildBlocks(context, contentBlocks);
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
