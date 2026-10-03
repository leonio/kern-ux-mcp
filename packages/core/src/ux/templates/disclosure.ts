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

	// KERN's accordion markup, as get_accordion renders a single one.
	const html = `<details class="kern-accordion"${openAttr}>
  <summary class="kern-accordion__header">
    <span class="kern-title">${escapeHtml(triggerLabel)}</span>
  </summary>
  <section class="kern-accordion__body">
    ${bodyContent}
  </section>
</details>`;

	return { html, warnings };
}
