import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import type {
	RadioInput,
	RadioItemInput,
	RadioListInput,
} from "../schemas/radio.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build a single radio input wrapped in kern-form-check
 */
function buildSingleRadio(
	name: string,
	value: string,
	label: string,
	id: string,
	checked: boolean,
	disabled: boolean,
): string {
	const checkedAttr = checked ? " checked" : "";
	const disabledAttr = disabled ? " disabled" : "";

	return `<div class="kern-form-check">
  <input class="kern-form-check__radio" id="${id}" name="${name}" type="radio" value="${value}"${checkedAttr}${disabledAttr}>
  <label class="kern-label" for="${id}">${label}</label>
</div>`;
}

/**
 * Build a radio group (list mode) wrapped in fieldset
 */
function buildRadioList(
	params: RadioListInput,
	locale: Locale,
	warnings: string[],
): string {
	const hintId = params.hint ? generateId("hint") : undefined;
	const errorId = params.error !== undefined ? generateId("error") : undefined;

	// Build aria-describedby
	const describedBy = [hintId, errorId].filter(Boolean).join(" ");
	const ariaDescribedBy = describedBy
		? ` aria-describedby="${describedBy}"`
		: "";

	// Fieldset classes
	const fieldsetClasses = ["kern-fieldset"];
	if (params.error !== undefined) {
		fieldsetClasses.push("kern-fieldset--error");
	}

	// Body classes
	const bodyClasses = ["kern-fieldset__body"];
	if (params.horizontal) {
		bodyClasses.push("kern-fieldset__body--horizontal");
	}

	// Optional marker
	const optionalMarker = params.optional
		? `\n    <span class="kern-label__optional">${LABELS.optional[locale]}</span>`
		: "";

	// Build items
	const items = params.items.map((item: RadioItemInput) => {
		const itemId = item.id || generateId("radio");
		return buildSingleRadio(
			params.name,
			item.value,
			item.label,
			itemId,
			item.checked ?? false,
			item.disabled ?? false,
		);
	});

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

	return `<fieldset class="${fieldsetClasses.join(" ")}"${ariaDescribedBy}>
  <legend class="kern-label">${params.legend}${optionalMarker}
  </legend>${hintHtml}
  <div class="${bodyClasses.join(" ")}">
    ${items.join("\n    ")}
  </div>${errorHtml}
</fieldset>`;
}

/**
 * Build a Radio component
 * Supports single mode (standalone radio) and list mode (radio group in fieldset)
 */
export function buildRadio(params: RadioInput, locale: Locale): BuildResult {
	const warnings: string[] = [];

	if (params.mode === "single") {
		const id = generateId("radio");
		const html = buildSingleRadio(
			params.name,
			params.value,
			params.label,
			id,
			params.checked ?? false,
			params.disabled ?? false,
		);
		return { html, warnings };
	}

	// List mode
	const html = buildRadioList(params, locale, warnings);
	return { html, warnings };
}
