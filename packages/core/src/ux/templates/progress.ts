import { generateId } from "../id.js";
import { type ProgressInput, progressSchema } from "../schemas/progress.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build HTML for a KERN UX Progress component
 */
export function buildProgress(
	input: ProgressInput,
	_locale: Locale,
): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = progressSchema.parse(input);

	const { value, max, label, labelPosition } = params;

	// Generate ID only if label exists (for label-progress association)
	const id = label ? generateId("progress") : undefined;

	// Build label HTML
	const labelHtml = label
		? `<label class="kern-label" for="${id}">${escapeHtml(label)}</label>`
		: "";

	// Build progress element
	const progressAttrs = id ? `id="${id}" ` : "";
	const progressEl = `<progress ${progressAttrs}value="${value}" max="${max}"></progress>`;

	// Assemble based on label position
	let content: string;
	if (label && labelPosition === "top") {
		content = `${labelHtml}\n  ${progressEl}`;
	} else if (label && labelPosition === "bottom") {
		content = `${progressEl}\n  ${labelHtml}`;
	} else {
		content = progressEl;
	}

	const html = `<div class="kern-progress">
  ${content}
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
