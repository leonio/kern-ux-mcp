import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import {
	type SingleSummaryInput,
	type SummaryInput,
	type SummaryItemInput,
	summarySchema,
} from "../schemas/summary.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Build a single summary element
 */
function buildSingleSummary(
	summary: SingleSummaryInput,
	locale: Locale,
): string {
	const titleId = generateId("summary-title");
	const headingTag = `h${summary.headingLevel ?? "3"}`;

	// Build header with optional number
	const numberHtml =
		summary.number !== undefined
			? `<span class="kern-number">${escapeHtml(String(summary.number))}</span>\n    `
			: "";

	const headerHtml = `<div class="kern-summary__header">
    ${numberHtml}<${headingTag} class="kern-title kern-title--small" id="${titleId}">${escapeHtml(summary.title)}</${headingTag}>
  </div>`;

	// Build description list items
	const itemsHtml = summary.items
		.map((item: SummaryItemInput) => {
			const valueContent = item.valueIsHtml
				? item.value
				: escapeHtml(item.value);
			return `<div class="kern-description-list-item">
        <dt class="kern-description-list-item__key">${escapeHtml(item.key)}</dt>
        <dd class="kern-description-list-item__value">${valueContent}</dd>
      </div>`;
		})
		.join("\n      ");

	const dlHtml = `<dl class="kern-description-list">
      ${itemsHtml}
    </dl>`;

	// Build action if present
	let actionsHtml = "";
	if (summary.action) {
		const actionLabel = summary.action.label ?? LABELS.edit[locale];
		const iconName = summary.action.icon ?? "edit";
		actionsHtml = `

    <div class="kern-summary__actions">
      <a href="${escapeHtml(summary.action.href)}" class="kern-link" aria-describedby="${titleId}">
        <span class="kern-icon kern-icon--${iconName}" aria-hidden="true"></span>
        ${escapeHtml(actionLabel)}
      </a>
    </div>`;
	}

	return `<div class="kern-summary">
  ${headerHtml}

  <div class="kern-summary__body">
    ${dlHtml}${actionsHtml}
  </div>
</div>`;
}

/**
 * Build HTML for a KERN UX Summary component
 */
export function buildSummary(input: SummaryInput, locale: Locale): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = summarySchema.parse(input);

	if (params.mode === "single") {
		const html = buildSingleSummary(params, locale);
		return { html, warnings };
	}

	// Group mode
	const groupHeadingTag = `h${params.groupHeadingLevel}`;

	const summariesHtml = params.summaries
		.map((s: SingleSummaryInput) => buildSingleSummary(s, locale))
		.join("\n\n  ");

	const html = `<div class="kern-summary-group">
  <div class="kern-summary-group__header">
    <${groupHeadingTag} class="kern-heading-medium">${escapeHtml(params.groupTitle)}</${groupHeadingTag}>
  </div>

  ${summariesHtml}
</div>`;

	return { html, warnings };
}
