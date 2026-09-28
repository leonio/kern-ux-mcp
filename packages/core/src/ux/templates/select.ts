import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import type { SelectInput, SelectOptionInput } from "../schemas/select.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build a Select component
 */
export function buildSelect(params: SelectInput, locale: Locale): BuildResult {
	const warnings: string[] = [];

	const id = generateId("select");
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

	// Select classes
	const selectClasses = ["kern-form-input__select"];
	if (params.error !== undefined) {
		selectClasses.push("kern-form-input__select--error");
	}

	// Disabled attribute
	const disabledAttr = params.disabled ? " disabled" : "";

	// Optional marker
	const optionalMarker = params.optional
		? `<span class="kern-label__optional">${LABELS.optional[locale]}</span>`
		: "";

	// Build options
	const options = params.options
		.map((opt: SelectOptionInput) => {
			const selectedAttr = opt.selected ? " selected" : "";
			const disabledOptAttr = opt.disabled ? " disabled" : "";
			return `<option value="${opt.value}"${selectedAttr}${disabledOptAttr}>${opt.text}</option>`;
		})
		.join("\n        ");

	// Build hint
	const hintHtml = hintId
		? `\n  <div class="kern-hint" id="${hintId}">${params.hint}</div>`
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
    <span class="kern-body">${params.error}</span>
  </p>`;
	}

	const html = `<div class="${wrapperClasses.join(" ")}">
  <label class="kern-label" for="${id}">${params.label}${optionalMarker}</label>${hintHtml}
  <div class="kern-form-input__select-wrapper">
    <select class="${selectClasses.join(" ")}" name="${params.name}" id="${id}"${disabledAttr}${ariaDescribedBy}>
        ${options}
    </select>
  </div>${errorHtml}
</div>`;

	return { html, warnings };
}
