import {
	type DisclosureInput,
	DisclosureSchema,
} from "../schemas/disclosure.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	standaloneContext,
} from "./composition-renderer.js";

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
	const params = DisclosureSchema.parse(input);

	const { triggerLabel, contentBlocks, content, contentIsHtml, open } = params;

	const openAttr = open ? " open" : "";
	let bodyContent = "";

	if (contentBlocks && contentBlocks.length > 0) {
		const recursiveResult = context.renderer.renderBlocks(
			contentBlocks,
			context.depth + 1,
		);
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
