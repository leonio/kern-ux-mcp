import type { BadgeInput } from "../schemas/badge.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build a Badge component
 */
export function buildBadge(params: BadgeInput, _locale: Locale): BuildResult {
	const warnings: string[] = [];

	const { type, text, showIcon } = params;

	// Build icon if requested
	const iconHtml = showIcon
		? `\n  <span class="kern-icon kern-icon--${type}" aria-hidden="true"></span>`
		: "";

	const html = `<span class="kern-badge kern-badge--${type}">${iconHtml}
  <span class="kern-label kern-label--small">${text}</span>
</span>`;

	return { html, warnings };
}
