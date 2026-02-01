import {
	type AlertInput,
	type AlertParams,
	AlertSchema,
} from "../schemas/alert.js";
import type { BuildResult, Locale } from "../types.js";

/** Map alert type to icon name */
const TYPE_ICON_MAP: Record<AlertParams["type"], string> = {
	info: "info",
	success: "success",
	warning: "warning",
	danger: "danger",
};

/**
 * Build HTML for a KERN UX Alert component.
 */
export function buildAlert(input: AlertInput, _locale: Locale): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = AlertSchema.parse(input);

	const { type, title, body } = params;

	const iconName = TYPE_ICON_MAP[type];

	// Build header
	const headerHtml = `<div class="kern-alert__header">
    <span class="kern-icon kern-icon--${iconName}" aria-hidden="true"></span>
    <span class="kern-title">${escapeHtml(title)}</span>
</div>`;

	// Build body if provided
	let bodyHtml = "";
	if (body) {
		const bodyParts: string[] = [];

		// Add text paragraph
		if (body.text) {
			bodyParts.push(`<p class="kern-body">${escapeHtml(body.text)}</p>`);
		}

		// Add links
		if (body.links && body.links.length > 0) {
			for (const link of body.links) {
				bodyParts.push(`<a href="${escapeHtml(link.href)}" class="kern-link">
    <span class="kern-icon kern-icon--arrow-forward" aria-hidden="true"></span>
    ${escapeHtml(link.text)}
</a>`);
			}
		}

		// Add list
		if (body.listItems && body.listItems.length > 0) {
			const listClass =
				body.listStyle === "bullet"
					? "kern-list kern-list--bullet"
					: "kern-list";
			const listItemsHtml = body.listItems
				.map((item) => `<li>${escapeHtml(item)}</li>`)
				.join("\n        ");
			bodyParts.push(`<ul class="${listClass}">
        ${listItemsHtml}
</ul>`);
		}

		if (bodyParts.length > 0) {
			bodyHtml = `
<div class="kern-alert__body">
    ${bodyParts.join("\n    ")}
</div>`;
		}
	}

	const html = `<div class="kern-alert kern-alert--${type}" role="alert">
${headerHtml}${bodyHtml}
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
