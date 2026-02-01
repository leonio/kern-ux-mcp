import { type IconInput, iconSchema } from "../schemas/icon.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build HTML for a KERN UX Icon component
 */
export function buildIcon(input: IconInput, _locale: Locale): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = iconSchema.parse(input);

	const { name, size, decorative, ariaLabel } = params;

	// Build classes
	const classes = ["kern-icon", `kern-icon--${name}`];
	if (size === "small") {
		classes.push("kern-icon--small");
	} else if (size === "large") {
		classes.push("kern-icon--large");
	} else if (size === "x-large") {
		classes.push("kern-icon--x-large");
	}

	// Build ARIA attributes
	let ariaAttrs: string;
	if (decorative) {
		ariaAttrs = 'aria-hidden="true"';
	} else {
		ariaAttrs = `aria-hidden="false" aria-label="${escapeHtml(ariaLabel ?? "")}"`;
	}

	const html = `<span class="${classes.join(" ")}" ${ariaAttrs}></span>`;

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
