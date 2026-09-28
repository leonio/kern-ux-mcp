import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import { type TextareaInput, textareaSchema } from "../schemas/textarea.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build HTML for a KERN UX Textarea component
 */
export function buildTextarea(
	input: TextareaInput,
	locale: Locale,
): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = textareaSchema.parse(input);

	const id = generateId("textarea");
	const hintId = params.hint ? generateId("hint") : undefined;
	const errorId = params.error !== undefined ? generateId("error") : undefined;

	// Build aria-describedby
	const describedByParts = [hintId, errorId].filter(Boolean);
	const ariaDescribedBy =
		describedByParts.length > 0
			? ` aria-describedby="${describedByParts.join(" ")}"`
			: "";

	// Wrapper classes
	const wrapperClasses = ["kern-form-input"];
	if (params.error !== undefined) {
		wrapperClasses.push("kern-form-input--error");
	}

	// Textarea classes
	const textareaClasses = ["kern-form-input__input"];
	if (params.error !== undefined) {
		textareaClasses.push("kern-form-input__input--error");
	}

	// Build attributes
	const attrs: string[] = [
		`class="${textareaClasses.join(" ")}"`,
		`id="${id}"`,
		`name="${params.name}"`,
	];

	if (params.placeholder) {
		attrs.push(`placeholder="${escapeHtml(params.placeholder)}"`);
	}
	if (params.rows) {
		attrs.push(`rows="${params.rows}"`);
	}
	if (params.cols) {
		attrs.push(`cols="${params.cols}"`);
	}
	if (params.readonly) {
		attrs.push("readonly");
	}
	if (params.disabled) {
		attrs.push("disabled");
	}
	if (ariaDescribedBy) {
		attrs.push(ariaDescribedBy.trim());
	}

	// Optional marker
	const optionalMarker = params.optional
		? `<span class="kern-label__optional">${LABELS.optional[locale]}</span>`
		: "";

	// Build hint
	const hintHtml = hintId
		? `\n  <div class="kern-hint" id="${hintId}">${escapeHtml(params.hint ?? "")}</div>`
		: "";

	// Build error
	let errorHtml = "";
	if (params.error !== undefined) {
		if (params.error === "") {
			warnings.push("Error message is empty");
		}
		errorHtml = `
  <p class="kern-error" id="${errorId}" role="alert">
    <span class="kern-icon kern-icon--danger" aria-hidden="true"></span>
    <span class="kern-body">${escapeHtml(params.error)}</span>
  </p>`;
	}

	// Build textarea content (value goes inside the element)
	const textareaValue = params.value ? escapeHtml(params.value) : "";

	const html = `<div class="${wrapperClasses.join(" ")}">
  <label class="kern-label" for="${id}">${escapeHtml(params.label)}${optionalMarker}</label>${hintHtml}
  <textarea ${attrs.join(" ")}>${textareaValue}</textarea>${errorHtml}
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
