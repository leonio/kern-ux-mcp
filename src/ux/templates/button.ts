import { type ButtonInput, ButtonSchema } from "../schemas/button.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build HTML for a KERN UX Button component.
 */
export function buildButton(input: ButtonInput, _locale: Locale): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = ButtonSchema.parse(input);

	const { variant, label, size, block, disabled, icon, labelVisibility } =
		params;

	// Build class list
	const classes = ["kern-btn", `kern-btn--${variant}`];
	if (size === "small" || size === "x-small") {
		classes.push("kern-btn--x-small");
	}
	if (block) {
		classes.push("kern-btn--block");
	}

	// Build label class
	let labelClass = "kern-label";
	if (labelVisibility === "sr-only") {
		labelClass = "kern-sr-only";
	} else if (labelVisibility === "sr-only-mobile") {
		labelClass = "kern-sr-only-mobile";
	}

	// Build icon HTML
	const iconHtml = icon
		? `<span class="kern-icon kern-icon--${icon.name}" aria-hidden="true"></span>`
		: "";

	// Build label HTML
	const labelHtml = `<span class="${labelClass}">${escapeHtml(label)}</span>`;

	// Assemble content based on icon position
	let content: string;
	if (icon && icon.position === "right") {
		content = `${labelHtml}\n    ${iconHtml}`;
	} else if (icon) {
		content = `${iconHtml}\n    ${labelHtml}`;
	} else {
		content = labelHtml;
	}

	// Build attributes
	const attrs: string[] = [`class="${classes.join(" ")}"`];
	if (disabled) {
		attrs.push("disabled");
	}

	const html = `<button ${attrs.join(" ")}>
    ${content}
</button>`;

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
