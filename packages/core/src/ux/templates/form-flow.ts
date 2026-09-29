import { t } from "../i18n.js";
import type { FormFlowInput } from "../schemas/content-union.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	standaloneContext,
} from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";
import {
	buttonRow,
	type FieldError,
	formButton,
	formOpenTag,
	renderErrorSummary,
	STACK_CLASSES,
	withErrorIds,
} from "./form.js";
import { buildProgress } from "./progress.js";
import { buildTasklist } from "./tasklist.js";

const STATUS_LABELS = {
	completed: { de: "Erledigt", en: "Completed" },
	active: { de: "Aktuell", en: "Current" },
	pending: { de: "Offen", en: "Pending" },
} as const;

const TASKLIST_HEADING = { de: "Fortschritt", en: "Progress" };

/**
 * Build a multi-step form: an optional heading, the step list, progress, and a
 * <form> holding the active step (or every step, the inactive ones hidden).
 */
export function buildFormFlow(
	input: FormFlowInput,
	locale: Locale,
	context: BlockContext = standaloneContext(locale),
): BuildResult {
	const warnings: string[] = [];

	const { steps, heading, showProgress, navigation, renderAllSteps } = input;
	const headingLevel = input.headingLevel ?? 2;

	// Clamp currentStep (1-based) to valid range, then convert to 0-based index
	const clampedStep = Math.min(Math.max(1, input.currentStep), steps.length);
	const activeIndex = clampedStep - 1;

	if (input.currentStep > steps.length) {
		warnings.push(
			`currentStep ${input.currentStep} exceeds steps.length ${steps.length} — clamped to ${steps.length}.`,
		);
	}

	// --- Heading ---
	const headingHtml = heading
		? `<h${headingLevel} class="kern-heading-medium">${escapeHtml(heading)}</h${headingLevel}>`
		: "";

	// --- Tasklist ---
	const tasklistItems = steps.map((step, i) => {
		let statusType: "success" | "info" | "warning";
		let statusText: string;

		if (i < activeIndex) {
			statusType = "success";
			statusText = step.statusText ?? t(locale, STATUS_LABELS.completed);
		} else if (i === activeIndex) {
			statusType = "info";
			statusText = step.statusText ?? t(locale, STATUS_LABELS.active);
		} else {
			statusType = "warning";
			statusText = step.statusText ?? t(locale, STATUS_LABELS.pending);
		}

		return {
			title: step.label,
			status: statusText,
			statusType,
		};
	});

	const tasklistResult = buildTasklist(
		{
			heading: input.tasklistHeading ?? t(locale, TASKLIST_HEADING),
			numbered: true,
			items: tasklistItems,
		},
		locale,
	);
	warnings.push(...tasklistResult.warnings);

	// The step list sits one level below the form heading. buildTasklist hardcodes h2.
	const tasklistLevel = heading ? Math.min(headingLevel + 1, 6) : headingLevel;
	const hTag = `h${tasklistLevel}`;
	let tasklistHtml = tasklistResult.html;
	if (hTag !== "h2") {
		tasklistHtml = tasklistHtml
			.replace("<h2 ", `<${hTag} `)
			.replace("</h2>", `</${hTag}>`);
	}

	// --- Progress ---
	let progressHtml = "";
	if (showProgress !== false) {
		const progressValue = Math.round((clampedStep / steps.length) * 100);
		const progressLabel =
			locale === "en"
				? `Step ${clampedStep} of ${steps.length}`
				: `Schritt ${clampedStep} von ${steps.length}`;

		const progressResult = buildProgress(
			{ value: progressValue, max: 100, label: progressLabel },
			locale,
		);
		progressHtml = progressResult.html;
		warnings.push(...progressResult.warnings);
	}

	// --- Steps, inside the form ---
	// Only the active step's field errors go into the summary: the others are hidden.
	const errors: FieldError[] = [];
	const stepsHtml = steps
		.map((step, index) => {
			const isActive = index === activeIndex;
			if (!isActive && !renderAllSteps) {
				return "";
			}

			const blocks =
				isActive && step.contentBlocks
					? withErrorIds(step.contentBlocks, errors)
					: step.contentBlocks;
			const content = context.renderer.renderBlocks(blocks, context.depth + 1);
			warnings.push(...content.warnings);

			const nav = stepNavigation(index, steps.length, input);
			const parts = [content.html, nav].filter(Boolean);
			if (parts.length === 0) {
				return "";
			}

			const hidden = isActive ? "" : " hidden";
			// The stack is an inner element: a flex class would override the hidden attribute.
			return `<div class="kern-form-flow__step" data-step="${index + 1}"${hidden}>
      <div class="${STACK_CLASSES}">
        ${parts.join("\n        ")}
      </div>
    </div>`;
		})
		.filter(Boolean);

	const summary = renderErrorSummary(errors, input.errorSummary, locale);
	warnings.push(...summary.warnings);

	const formHtml = `${formOpenTag(input)}
    ${summary.html}${stepsHtml.join("\n    ")}
  </form>`;

	// --- Assemble ---
	const parts = [headingHtml, tasklistHtml, progressHtml, formHtml].filter(
		Boolean,
	);
	const html = `<div class="kern-form-flow">\n  ${parts.join("\n  ")}\n</div>`;

	return { html, warnings };

	function stepNavigation(
		index: number,
		stepCount: number,
		flow: FormFlowInput,
	): string {
		if (!navigation) {
			return "";
		}
		const isFirst = index === 0;
		const isLast = index === stepCount - 1;
		// Without renderAllSteps each step is its own page, so "next" submits it.
		const nextType = flow.renderAllSteps ? "button" : "submit";

		const buttons = [
			!isFirst && navigation.backLabel
				? formButton("button", "secondary", navigation.backLabel)
				: undefined,
			isLast && navigation.submitLabel
				? formButton("submit", "primary", navigation.submitLabel)
				: undefined,
			!isLast && navigation.nextLabel
				? formButton(nextType, "primary", navigation.nextLabel)
				: undefined,
		];
		if (!buttons.some(Boolean)) {
			return "";
		}
		return buttonRow(buttons, "kern-form-flow__navigation");
	}
}
