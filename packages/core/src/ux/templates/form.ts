import { t } from "../i18n.js";
import { generateId } from "../id.js";
import type {
	FormBlockInput,
	RecursiveContentNodeInput,
} from "../schemas/content-union.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	standaloneContext,
} from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";

type ErrorEntry = { id: string; text: string };

const SUMMARY_TITLE = {
	de: "Bitte korrigieren Sie die folgenden Angaben",
	en: "Please correct the following",
};

/**
 * Build a form: an optional error summary, the content blocks and an actions row.
 * The summary is collected from the fields that have an error, not written by hand.
 */
export function buildForm(
	input: FormBlockInput,
	locale: Locale,
	context: BlockContext = standaloneContext(locale),
): BuildResult {
	const errors: ErrorEntry[] = [];
	const blocks = withErrorIds(input.contentBlocks, errors);
	const body = context.renderer.renderBlocks(blocks, context.depth + 1);
	const warnings = [...body.warnings];

	const attrs = [
		input.action === undefined ? "" : ` action="${escapeHtml(input.action)}"`,
		` method="${input.method ?? "post"}"`,
		" novalidate",
	].join("");

	let summaryHtml = "";
	if (input.errorSummary && errors.length > 0) {
		const title = input.errorSummary.title ?? t(locale, SUMMARY_TITLE);
		const items = errors
			.map(
				(entry) =>
					`<li><a class="kern-link" href="#${escapeHtml(entry.id)}">${escapeHtml(entry.text)}</a></li>`,
			)
			.join("\n        ");
		summaryHtml = `<div class="kern-alert kern-alert--danger" role="alert">
    <div class="kern-alert__header">
      <span class="kern-icon kern-icon--danger" aria-hidden="true"></span>
      <span class="kern-title">${escapeHtml(title)}</span>
    </div>
    <div class="kern-alert__body">
      <ul class="kern-list">
        ${items}
      </ul>
    </div>
  </div>
  `;
	} else if (errors.length > 0) {
		warnings.push(
			`${errors.length} field(s) in the form have an error, but the form has no errorSummary. Set errorSummary: {} to list them above the form.`,
		);
	}

	let actionsHtml = "";
	if (input.actions) {
		const buttons = [
			input.actions.secondaryLabel === undefined
				? ""
				: `<button type="button" class="kern-btn kern-btn--secondary">
      <span class="kern-label">${escapeHtml(input.actions.secondaryLabel)}</span>
    </button>
    `,
			`<button type="submit" class="kern-btn kern-btn--primary">
      <span class="kern-label">${escapeHtml(input.actions.submitLabel)}</span>
    </button>`,
		].join("");
		actionsHtml = `
  <div class="kern-flex kern-flex-wrap kern-gap-md">
    ${buttons}
  </div>`;
	}

	return {
		html: `<form${attrs}>
  ${summaryHtml}${body.html}${actionsHtml}
</form>`,
		warnings,
	};
}

/**
 * Gives every field with an error message an id (keeping the model's own) and
 * collects it, in document order, for the error summary.
 */
function withErrorIds(
	blocks: readonly RecursiveContentNodeInput[],
	errors: ErrorEntry[],
): RecursiveContentNodeInput[] {
	const visit = (children: readonly RecursiveContentNodeInput[]) =>
		withErrorIds(children, errors);

	return blocks.map((block): RecursiveContentNodeInput => {
		switch (block.kind) {
			case "field": {
				const { field } = block;
				if (!field.error) {
					return block;
				}
				const id = field.id ?? generateId("field");
				errors.push({ id, text: `${field.label}: ${field.error}` });
				return { ...block, field: { ...field, id } };
			}
			case "fieldset":
				return {
					...block,
					fieldset: {
						...block.fieldset,
						contentBlocks: visit(block.fieldset.contentBlocks),
					},
				};
			case "section":
				return {
					...block,
					section: {
						...block.section,
						contentBlocks:
							block.section.contentBlocks && visit(block.section.contentBlocks),
					},
				};
			case "disclosure":
				return {
					...block,
					disclosure: {
						...block.disclosure,
						contentBlocks:
							block.disclosure.contentBlocks &&
							visit(block.disclosure.contentBlocks),
					},
				};
			case "card":
				return {
					...block,
					card: {
						...block.card,
						contentBlocks:
							block.card.contentBlocks && visit(block.card.contentBlocks),
					},
				};
			case "grid":
				return {
					...block,
					grid: {
						...block.grid,
						columnsContent: block.grid.columnsContent?.map(visit),
					},
				};
			default:
				return block;
		}
	});
}
