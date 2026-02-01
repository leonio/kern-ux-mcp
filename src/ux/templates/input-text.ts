import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import type { InputTextInput } from "../schemas/input-text.js";
import type { BuildResult, Locale } from "../types.js";

function getDefaultFormatHint(type: string, locale: Locale): string {
	if (locale === "en") {
		switch (type) {
			case "number":
				return "Required format: digits only (for example 35000).";
			case "email":
				return "Required format: valid email address (for example name@example.com).";
			case "tel":
				return "Required format: phone number including area code.";
			case "url":
				return "Required format: full URL including https://.";
			case "date":
				return "Required format: date in the input format shown by your browser.";
			case "password":
				return "Required format: strong password according to your policy.";
			default:
				return "Required format: enter your full name (for example Max Mustermann).";
		}
	}

	switch (type) {
		case "number":
			return "Pflichtformat: nur Ziffern (zum Beispiel 35000).";
		case "email":
			return "Pflichtformat: gueltige E-Mail-Adresse (zum Beispiel name@example.com).";
		case "tel":
			return "Pflichtformat: Telefonnummer inklusive Vorwahl.";
		case "url":
			return "Pflichtformat: vollstaendige URL inklusive https://.";
		case "date":
			return "Pflichtformat: Datum im vom Browser angezeigten Eingabeformat.";
		case "password":
			return "Pflichtformat: sicheres Passwort gemaess Richtlinie.";
		default:
			return "Pflichtformat: vollstaendigen Namen angeben (zum Beispiel Max Mustermann).";
	}
}

function getEffectiveAutocomplete(
	type: string,
	autocomplete?: string,
): string | undefined {
	if (typeof autocomplete === "string" && autocomplete.trim().length > 0) {
		return autocomplete;
	}

	switch (type) {
		case "email":
			return "email";
		case "tel":
			return "tel";
		default:
			return undefined;
	}
}

/**
 * Build an InputText component (or other input type variant)
 */
export function buildInputText(
	params: InputTextInput,
	locale: Locale,
): BuildResult {
	const warnings: string[] = [];
	const inputType = params.type ?? "text";
	const autocomplete = getEffectiveAutocomplete(inputType, params.autocomplete);
	const effectiveHint =
		typeof params.hint === "string" && params.hint.trim().length > 0
			? params.hint
			: getDefaultFormatHint(inputType, locale);

	const id = generateId("input");
	const hintId = effectiveHint ? generateId("hint") : undefined;
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

	// Input classes
	const inputClasses = ["kern-form-input__input"];
	if (params.error !== undefined) {
		inputClasses.push("kern-form-input__input--error");
	}

	// Build attributes
	const renderedType = inputType === "number" ? "text" : inputType;
	const attrs: string[] = [
		`class="${inputClasses.join(" ")}"`,
		`id="${id}"`,
		`name="${params.name}"`,
		`type="${renderedType}"`,
	];

	if (inputType === "number") {
		attrs.push('inputmode="numeric"');
		attrs.push('pattern="[0-9]*"');
	}

	if (params.value !== undefined) {
		attrs.push(`value="${params.value}"`);
	}
	if (params.placeholder) {
		attrs.push(`placeholder="${params.placeholder}"`);
	}
	if (autocomplete) {
		attrs.push(`autocomplete="${autocomplete}"`);
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
		? `\n  <div class="kern-hint" id="${hintId}">${effectiveHint}</div>`
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
  <input ${attrs.join(" ")}>
${errorHtml}</div>`;

	return { html, warnings };
}
