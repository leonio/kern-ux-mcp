import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import { type InputFileInput, inputFileSchema } from "../schemas/input-file.js";
import type { BuildResult, Locale } from "../types.js";

function formatAcceptForHint(accept?: string): string | undefined {
	if (!accept) {
		return undefined;
	}

	const tokens = accept
		.split(",")
		.map((token) => token.trim())
		.filter((token) => token.length > 0)
		.map((token) => token.replace(/^\./, ""))
		.map((token) => token.toUpperCase());

	if (tokens.length === 0) {
		return undefined;
	}

	return tokens.join(", ");
}

function getDefaultFileHint(locale: Locale, accept?: string): string {
	const acceptText = formatAcceptForHint(accept);

	if (locale === "en") {
		if (acceptText) {
			return `Required format: ${acceptText}; maximum file size 10 MB.`;
		}
		return "Required format: upload a readable file (for example PDF, JPG, PNG), maximum file size 10 MB.";
	}

	if (acceptText) {
		return `Pflichtformat: ${acceptText}; maximale Dateigroesse 10 MB.`;
	}
	return "Pflichtformat: lesbare Datei hochladen (zum Beispiel PDF, JPG, PNG), maximale Dateigroesse 10 MB.";
}

export function buildInputFile(
	input: InputFileInput,
	locale: Locale,
): BuildResult {
	const params = inputFileSchema.parse(input);
	const warnings: string[] = [];
	const effectiveHint =
		typeof params.hint === "string" && params.hint.trim().length > 0
			? params.hint
			: getDefaultFileHint(locale, params.accept);

	const id = generateId("input");
	const hintId = effectiveHint ? generateId("hint") : undefined;
	const errorId = params.error !== undefined ? generateId("error") : undefined;

	const describedByParts = [hintId, errorId].filter(Boolean);
	const ariaDescribedBy =
		describedByParts.length > 0
			? ` aria-describedby="${describedByParts.join(" ")}"`
			: "";

	const wrapperClasses = ["kern-form-input"];
	if (params.error !== undefined) {
		wrapperClasses.push("kern-form-input--error");
	}

	const inputClasses = ["kern-form-input__input"];
	if (params.error !== undefined) {
		inputClasses.push("kern-form-input__input--error");
	}

	const attrs: string[] = [
		`class="${inputClasses.join(" ")}"`,
		`id="${id}"`,
		`name="${params.name}"`,
		'type="file"',
	];

	if (params.accept) {
		attrs.push(`accept="${params.accept}"`);
	}
	if (params.disabled) {
		attrs.push("disabled");
	}
	if (ariaDescribedBy) {
		attrs.push(ariaDescribedBy.trim());
	}

	const optionalMarker = params.optional
		? `<span class="kern-label__optional">${LABELS.optional[locale]}</span>`
		: "";

	const hintHtml = hintId
		? `\n  <div class="kern-hint" id="${hintId}">${effectiveHint}</div>`
		: "";

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
