import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import {
	type FieldsetRenderInput,
	FieldsetRenderSchema,
} from "../schemas/fieldset.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	standaloneContext,
} from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";

/**
 * Build a KERN fieldset around its content blocks, following the upstream
 * markup: legend, hint and group error, both linked via aria-describedby.
 */
export function buildFieldset(
	input: FieldsetRenderInput,
	locale: Locale,
	context: BlockContext = standaloneContext(locale),
): BuildResult {
	const params = FieldsetRenderSchema.parse(input);
	const warnings: string[] = [];
	const hasError = params.error !== undefined;

	const hintId = params.hint ? generateId("hint") : undefined;
	const errorId = hasError ? generateId("error") : undefined;
	const describedBy = [hintId, errorId].filter(Boolean).join(" ");

	const fieldsetClasses = ["kern-fieldset"];
	if (hasError) {
		fieldsetClasses.push("kern-fieldset--error");
	}
	const legendClasses = ["kern-label"];
	if (params.legendSize === "large") {
		legendClasses.push("kern-label--large");
	}
	const bodyClasses = ["kern-fieldset__body"];
	if (params.horizontal) {
		bodyClasses.push("kern-fieldset__body--horizontal");
	}

	const optionalMarker = params.optional
		? `\n    <span class="kern-label__optional">- ${LABELS.optional[locale]}</span>`
		: "";
	const hintHtml = hintId
		? `\n  <div class="kern-hint" id="${hintId}">${escapeHtml(params.hint ?? "")}</div>`
		: "";

	let errorHtml = "";
	if (hasError) {
		if (params.error === "") {
			warnings.push("Error message is empty");
		}
		errorHtml = `
  <p class="kern-error" id="${errorId}" role="alert">
    <span class="kern-icon kern-icon--danger" aria-hidden="true"></span>
    <span class="kern-body">${escapeHtml(params.error ?? "")}</span>
  </p>`;
	}

	const body = context.renderer.renderBlocks(
		params.contentBlocks,
		context.depth + 1,
	);
	warnings.push(...body.warnings);

	const describedByAttr = describedBy
		? ` aria-describedby="${describedBy}"`
		: "";

	return {
		html: `<fieldset class="${fieldsetClasses.join(" ")}"${describedByAttr}>
  <legend class="${legendClasses.join(" ")}">
    ${escapeHtml(params.legend)}${optionalMarker}
  </legend>${hintHtml}
  <div class="${bodyClasses.join(" ")}">
    ${body.html}
  </div>${errorHtml}
</fieldset>`,
		warnings,
	};
}
