import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import { type InputFileInput, inputFileSchema } from "../schemas/input-file.js";
import type { BuildResult, Locale } from "../types.js";
import { escapeHtml } from "./escape.js";

export function buildInputFile(
	input: InputFileInput,
	locale: Locale,
): BuildResult {
	const params = inputFileSchema.parse(input);
	const warnings: string[] = [];
	const effectiveHint =
		typeof params.hint === "string" && params.hint.trim().length > 0
			? params.hint
			: undefined;

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
		`name="${escapeHtml(params.name)}"`,
		'type="file"',
	];

	if (params.accept) {
		attrs.push(`accept="${escapeHtml(params.accept)}"`);
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
		? `\n  <div class="kern-hint" id="${hintId}">${escapeHtml(effectiveHint ?? "")}</div>`
		: "";

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

	const html = `<div class="${wrapperClasses.join(" ")}">
  <label class="kern-label" for="${id}">${escapeHtml(params.label)}${optionalMarker}</label>${hintHtml}
  <input ${attrs.join(" ")}>
${errorHtml}</div>`;

	return { html, warnings };
}
