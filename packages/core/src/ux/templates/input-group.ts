import { generateId } from "../id.js";
import {
	type InputGroupInput,
	inputGroupSchema,
} from "../schemas/input-group.js";
import type { BuildResult, Locale } from "../types.js";
import { escapeHtml } from "./escape.js";

export function buildInputGroup(
	input: InputGroupInput,
	_locale: Locale,
): BuildResult {
	const params = inputGroupSchema.parse(input);
	const warnings: string[] = [];
	const id = generateId("input");

	const disabledAttr = params.disabled ? " disabled" : "";
	const readonlyAttr = params.readonly ? " readonly" : "";
	const valueAttr =
		params.value !== undefined ? ` value="${escapeHtml(params.value)}"` : "";
	const placeholderAttr = params.placeholder
		? ` placeholder="${escapeHtml(params.placeholder)}"`
		: "";
	const affixModifier = params.disabled
		? " kern-input-group-text--disabled"
		: params.readonly
			? " kern-input-group-text--readonly"
			: "";

	const prefix = params.prefix
		? `<span class="kern-input-group-text${affixModifier}">${escapeHtml(params.prefix)}</span>\n  `
		: "";
	const suffix = params.suffix
		? `\n  <span class="kern-input-group-text${affixModifier}">${escapeHtml(params.suffix)}</span>`
		: "";

	const html = `<div class="kern-input-group">
  ${prefix}<input class="kern-form-input__input" id="${id}" name="${escapeHtml(params.name)}" type="text"${valueAttr}${placeholderAttr}${readonlyAttr}${disabledAttr} />${suffix}
</div>`;

	return { html, warnings };
}
