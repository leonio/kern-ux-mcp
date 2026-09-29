import { t } from "../i18n.js";
import { generateId } from "../id.js";
import type {
	FormBlockInput,
	RecursiveContentNodeInput,
} from "../schemas/content-union.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	renderChildBlocks,
	standaloneContext,
} from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";

export type FieldError = { id: string; text: string };

/** A vertical stack with KERN's large spacing between its children. */
export const STACK_CLASSES = "kern-flex kern-flex-col kern-gap-lg";

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
	const errors: FieldError[] = [];
	const blocks = withErrorIds(input.contentBlocks, errors);
	const body = renderChildBlocks(context, blocks);
	const summary = renderErrorSummary(errors, input.errorSummary, locale);

	let actionsHtml = "";
	if (input.actions) {
		const buttons = [
			input.actions.secondaryLabel === undefined
				? undefined
				: formButton("button", "secondary", input.actions.secondaryLabel),
			formButton("submit", "primary", input.actions.submitLabel),
		];
		actionsHtml = `
  ${buttonRow(buttons)}`;
	}

	return {
		html: `${formOpenTag(input)}
  ${summary.html}${body.html}${actionsHtml}
</form>`,
		warnings: [...body.warnings, ...summary.warnings],
	};
}

/**
 * `<form … novalidate>`, stacking its content with KERN spacing: fields outside a
 * fieldset have no spacing of their own. Posts unless the method says otherwise.
 */
export function formOpenTag(
	input: Pick<FormBlockInput, "action" | "method">,
): string {
	const action =
		input.action === undefined ? "" : ` action="${escapeHtml(input.action)}"`;
	return `<form class="${STACK_CLASSES}"${action} method="${input.method ?? "post"}" novalidate>`;
}

/**
 * The error summary alert with a link per field error, or a warning when fields
 * have errors but no summary was asked for. Its HTML ends with a line break.
 */
export function renderErrorSummary(
	errors: readonly FieldError[],
	errorSummary: FormBlockInput["errorSummary"],
	locale: Locale,
): BuildResult {
	if (errors.length === 0) {
		return { html: "", warnings: [] };
	}
	if (!errorSummary) {
		return {
			html: "",
			warnings: [
				`${errors.length} field(s) in the form have an error, but the form has no errorSummary. Set errorSummary: {} to list them above the form.`,
			],
		};
	}

	const title = errorSummary.title ?? t(locale, SUMMARY_TITLE);
	const items = errors
		.map(
			(entry) =>
				`<li><a class="kern-link" href="#${escapeHtml(entry.id)}">${escapeHtml(entry.text)}</a></li>`,
		)
		.join("\n        ");

	return {
		html: `<div class="kern-alert kern-alert--danger" role="alert">
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
  `,
		warnings: [],
	};
}

/** A KERN button for a form's button row. */
export function formButton(
	type: "button" | "submit",
	variant: "primary" | "secondary",
	label: string,
): string {
	return `<button type="${type}" class="kern-btn kern-btn--${variant}">
      <span class="kern-label">${escapeHtml(label)}</span>
    </button>`;
}

/** Lays out buttons in a wrapping row; skips missing ones. */
export function buttonRow(
	buttons: ReadonlyArray<string | undefined>,
	className = "",
): string {
	const classes = ["kern-flex", "kern-flex-wrap", "kern-gap-md", className]
		.filter(Boolean)
		.join(" ");
	return `<div class="${classes}">
    ${buttons.filter(Boolean).join("\n    ")}
  </div>`;
}

/**
 * Gives every field with an error message an id (keeping the model's own) and
 * collects it, in document order, for the error summary.
 */
export function withErrorIds(
	blocks: readonly RecursiveContentNodeInput[],
	errors: FieldError[],
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
