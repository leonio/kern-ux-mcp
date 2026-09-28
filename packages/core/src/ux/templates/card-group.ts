import { type CardGroupInput, CardGroupSchema } from "../schemas/card-group.js";
import type { BuildResult, Locale } from "../types.js";
import { buildCard } from "./card.js";

/**
 * Build HTML for a KERN UX Card Group composition.
 * Wraps multiple cards in a responsive grid (kern-container/kern-row/kern-col).
 */
export function buildCardGroup(
	input: CardGroupInput,
	locale: Locale,
): BuildResult {
	const warnings: string[] = [];
	const params = CardGroupSchema.parse(input);

	const { cards, heading } = params;
	const columns = Math.min(
		cards.length,
		params.columns ?? Math.min(cards.length, 4),
	);

	// Build each card using the existing card builder
	const cardHtmlParts: string[] = [];
	for (const card of cards) {
		const cardResult = buildCard(card, locale);
		cardHtmlParts.push(cardResult.html);
		warnings.push(...cardResult.warnings);
	}

	// Calculate responsive column class: 12 / columns → kern-col-md-{n}
	// Always pair with kern-col-sm-12 for mobile stacking.
	const colSpan = Math.floor(12 / columns);
	const colClass = `kern-col-md-${colSpan} kern-col-sm-12`;

	// Wrap each card in a responsive column
	const colHtml = cardHtmlParts
		.map(
			(cardHtml) =>
				`    <div class="${colClass}">\n      ${cardHtml.replace(/\n/g, "\n      ")}\n    </div>`,
		)
		.join("\n");

	// Optional heading above the grid
	const headingHtml = heading
		? `  <h${heading.level} class="kern-heading-medium">${escapeHtml(heading.text)}</h${heading.level}>\n`
		: "";

	const html = `<div class="kern-container">
${headingHtml}  <div class="kern-row">
${colHtml}
  </div>
</div>`;

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
