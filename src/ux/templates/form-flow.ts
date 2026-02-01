import { t } from "../i18n.js";
import type { FormFlowInput } from "../schemas/form-flow.js";
import type { BuildResult, Locale } from "../types.js";
import type { RecursiveContentRenderOptions } from "./content-union.js";
import { renderRecursiveContentBlocks } from "./content-union.js";
import { buildProgress } from "./progress.js";
import { buildTasklist } from "./tasklist.js";

type FormFlowRenderOptions = Omit<
	RecursiveContentRenderOptions,
	"locale" | "currentDepth" | "maxDepth"
> & {
	depth: number;
	maxDepth: number;
};

const STATUS_LABELS = {
	completed: { de: "Erledigt", en: "Completed" },
	active: { de: "Aktuell", en: "Current" },
	pending: { de: "Offen", en: "Pending" },
} as const;

export function buildFormFlow(
	input: FormFlowInput,
	locale: Locale,
	options?: FormFlowRenderOptions,
): BuildResult {
	const warnings: string[] = [];

	const { steps, heading, headingLevel, showProgress, navigation } = input;

	// Clamp currentStep (1-based) to valid range, then convert to 0-based index
	const clampedStep = Math.min(Math.max(1, input.currentStep), steps.length);
	const activeIndex = clampedStep - 1;

	if (input.currentStep > steps.length) {
		warnings.push(
			`currentStep ${input.currentStep} exceeds steps.length ${steps.length} — clamped to ${steps.length}.`,
		);
	}

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
			heading: heading ?? (locale === "en" ? "Progress" : "Fortschritt"),
			numbered: true,
			items: tasklistItems,
		},
		locale,
	);
	warnings.push(...tasklistResult.warnings);

	// Patch heading level in tasklist HTML (buildTasklist hardcodes h2)
	const hTag = `h${headingLevel ?? 2}`;
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

	// --- Active step content ---
	const activeStep = steps[activeIndex];
	let stepContentHtml = "";

	if (activeStep?.contentBlocks && activeStep.contentBlocks.length > 0) {
		const depth = options?.depth ?? 1;
		const maxDepth = options?.maxDepth ?? 4;

		const contentResult = renderRecursiveContentBlocks(
			activeStep.contentBlocks,
			{
				locale,
				currentDepth: depth,
				maxDepth,
				renderCardNode: options?.renderCardNode,
				renderGridNode: options?.renderGridNode,
				renderSectionNode: options?.renderSectionNode,
				renderDisclosureNode: options?.renderDisclosureNode,
			},
		);
		stepContentHtml = contentResult.html;
		warnings.push(...contentResult.warnings);
	}

	// --- Navigation buttons ---
	let navHtml = "";
	if (navigation) {
		const buttons: string[] = [];
		const isFirst = activeIndex === 0;
		const isLast = activeIndex === steps.length - 1;

		if (!isFirst && navigation.backLabel) {
			buttons.push(
				`<button type="button" class="kern-button kern-button--secondary">${escapeHtml(navigation.backLabel)}</button>`,
			);
		}

		if (isLast && navigation.submitLabel) {
			buttons.push(
				`<button type="submit" class="kern-button kern-button--primary">${escapeHtml(navigation.submitLabel)}</button>`,
			);
		} else if (!isLast && navigation.nextLabel) {
			buttons.push(
				`<button type="button" class="kern-button kern-button--primary">${escapeHtml(navigation.nextLabel)}</button>`,
			);
		}

		if (buttons.length > 0) {
			navHtml = `<div class="kern-form-flow__navigation">\n    ${buttons.join("\n    ")}\n  </div>`;
		}
	}

	// --- Assemble ---
	const parts: string[] = [];
	parts.push(tasklistHtml);
	if (progressHtml) parts.push(progressHtml);
	if (stepContentHtml) {
		parts.push(
			`<div class="kern-form-flow__step" data-step="${clampedStep}">\n    ${stepContentHtml}\n  </div>`,
		);
	}
	if (navHtml) parts.push(navHtml);

	const html = `<div class="kern-form-flow">\n  ${parts.join("\n  ")}\n</div>`;

	return { html, warnings };
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
