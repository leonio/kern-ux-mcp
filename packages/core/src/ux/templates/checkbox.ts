import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import {
	type CheckboxInput,
	CheckboxSchema,
	type ListCheckboxParams,
	type SingleCheckboxParams,
} from "../schemas/checkbox.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build HTML for a KERN UX Checkbox component (single or list mode).
 */
export function buildCheckbox(
	input: CheckboxInput,
	locale: Locale,
): BuildResult {
	// Parse input to apply defaults
	const params = CheckboxSchema.parse(input);

	if (params.mode === "list") {
		return buildCheckboxList(params, locale);
	}
	return buildSingleCheckbox(params, locale);
}

/**
 * Build HTML for a single checkbox.
 */
function buildSingleCheckbox(
	params: SingleCheckboxParams,
	locale: Locale,
): BuildResult {
	const warnings: string[] = [];

	const id = params.id ?? generateId("checkbox");
	const { name, label, checked, disabled, error } = params;

	const hasError = !!error;
	const errorId = error?.id ?? (hasError ? generateId("error") : undefined);

	// Warn if error message is empty
	if (error && error.message === "") {
		warnings.push(
			locale === "en"
				? "Warning: Error state is set but message is empty. Consider providing an error message for accessibility."
				: "Warnung: Fehlerzustand ist gesetzt, aber Meldung ist leer. Für Barrierefreiheit wird eine Fehlermeldung empfohlen.",
		);
	}

	// Build wrapper class
	const wrapperClass = hasError
		? "kern-form-check kern-form-check--error"
		: "kern-form-check";

	// Build input class
	const inputClass = hasError
		? "kern-form-check__checkbox kern-form-check__checkbox--error"
		: "kern-form-check__checkbox";

	// Build input attributes
	const inputAttrs: string[] = [
		`class="${inputClass}"`,
		`id="${id}"`,
		`name="${escapeHtml(name)}"`,
		`type="checkbox"`,
	];
	if (checked) inputAttrs.push("checked");
	if (disabled) inputAttrs.push("disabled");
	if (hasError && errorId) inputAttrs.push(`aria-describedby="${errorId}"`);

	// Build error HTML
	let errorHtml = "";
	if (hasError && errorId) {
		const errorMessage = error.message || "";
		errorHtml = `
<p class="kern-error" id="${errorId}" role="alert">
    <span class="kern-icon kern-icon--danger" aria-hidden="true"></span>
    <span class="kern-body">${escapeHtml(errorMessage)}</span>
</p>`;
	}

	const html = `<div class="${wrapperClass}">
    <input ${inputAttrs.join(" ")}>
    <label class="kern-label" for="${id}">${escapeHtml(label)}</label>${errorHtml}
</div>`;

	return { html, warnings };
}

/**
 * Build HTML for a checkbox list in a fieldset.
 */
function buildCheckboxList(
	params: ListCheckboxParams,
	locale: Locale,
): BuildResult {
	const warnings: string[] = [];

	const { legend, optional, hint, groupName, items, error } = params;

	const hasError = !!error;
	const errorId = error?.id ?? (hasError ? generateId("error") : undefined);
	const hintId = hint?.id ?? (hint ? generateId("hint") : undefined);

	// Warn if error message is empty
	if (error && error.message === "") {
		warnings.push(
			locale === "en"
				? "Warning: Error state is set but message is empty. Consider providing an error message for accessibility."
				: "Warnung: Fehlerzustand ist gesetzt, aber Meldung ist leer. Für Barrierefreiheit wird eine Fehlermeldung empfohlen.",
		);
	}

	// Build fieldset class
	const fieldsetClass = hasError
		? "kern-fieldset kern-fieldset--error"
		: "kern-fieldset";

	// Build aria-describedby
	const describedByParts: string[] = [];
	if (hintId) describedByParts.push(hintId);
	if (errorId) describedByParts.push(errorId);
	const ariaDescribedBy =
		describedByParts.length > 0
			? ` aria-describedby="${describedByParts.join(" ")}"`
			: "";

	// Build optional marker
	const optionalMarker = optional
		? `<span class="kern-label__optional">- ${LABELS.optional[locale]}</span>`
		: "";

	// Build hint HTML
	const hintHtml = hint
		? `<div class="kern-hint" id="${hintId}">${escapeHtml(hint.text)}</div>\n    `
		: "";

	// Build checkbox items
	const itemsHtml = items
		.map((item) => {
			const itemId = item.id ?? generateId("checkbox");
			const itemClass = hasError
				? "kern-form-check__checkbox kern-form-check__checkbox--error"
				: "kern-form-check__checkbox";

			const itemAttrs: string[] = [
				`class="${itemClass}"`,
				`id="${itemId}"`,
				`name="${escapeHtml(groupName)}"`,
				`type="checkbox"`,
			];
			if (item.checked) itemAttrs.push("checked");
			if (item.disabled) itemAttrs.push("disabled");

			return `<div class="kern-form-check">
            <input ${itemAttrs.join(" ")}>
            <label class="kern-label" for="${itemId}">${escapeHtml(item.label)}</label>
        </div>`;
		})
		.join("\n        ");

	// Build error HTML
	let errorHtml = "";
	if (hasError && errorId) {
		const errorMessage = error.message || "";
		errorHtml = `
    <p class="kern-error" id="${errorId}" role="alert">
        <span class="kern-icon kern-icon--danger" aria-hidden="true"></span>
        <span class="kern-body">${escapeHtml(errorMessage)}</span>
    </p>`;
	}

	const html = `<fieldset class="${fieldsetClass}"${ariaDescribedBy}>
    <legend class="kern-label">
        ${escapeHtml(legend)}
        ${optionalMarker}
    </legend>
    ${hintHtml}<div class="kern-fieldset__body">
        ${itemsHtml}
    </div>${errorHtml}
</fieldset>`;

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
