import {
	type AccordionInput,
	type AccordionItemInput,
	accordionSchema,
} from "../schemas/accordion.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build a single accordion element
 */
function buildSingleAccordion(
	title: string,
	content: string,
	open: boolean,
	contentIsHtml: boolean,
): string {
	const openAttr = open ? " open" : "";
	const bodyContent = contentIsHtml
		? content
		: `<p class="kern-body">${escapeHtml(content)}</p>`;

	return `<details class="kern-accordion"${openAttr}>
  <summary class="kern-accordion__header">
    <span class="kern-title">${escapeHtml(title)}</span>
  </summary>
  <section class="kern-accordion__body">
    ${bodyContent}
  </section>
</details>`;
}

/**
 * Build HTML for a KERN UX Accordion component
 * Supports single accordion or accordion group
 */
export function buildAccordion(
	input: AccordionInput,
	_locale: Locale,
): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = accordionSchema.parse(input);

	if (params.mode === "single") {
		const html = buildSingleAccordion(
			params.title,
			params.content,
			params.open,
			params.contentIsHtml,
		);
		return { html, warnings };
	}

	// Group mode
	const accordions = params.items.map((item: AccordionItemInput) =>
		buildSingleAccordion(
			item.title,
			item.content,
			item.open ?? false,
			item.contentIsHtml ?? false,
		),
	);

	const html = `<div class="kern-accordion-group">
  ${accordions.join("\n  ")}
</div>`;

	return { html, warnings };
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
