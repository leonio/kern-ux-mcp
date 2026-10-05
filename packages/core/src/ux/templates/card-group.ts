import { type CardGroupInput, CardGroupSchema } from "../schemas/card-group.js";
import type { BuildResult, Locale } from "../types.js";
import { buildCard } from "./card.js";
import { escapeHtml } from "./escape.js";
import { STACK_CLASSES } from "./form.js";
import { equalColumnsGridClasses } from "./grid.js";

/**
 * Build HTML for a KERN UX Card Group composition: the cards side by side on
 * kern-grid, one per row on small screens.
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

	// The cards are the grid's items, so a row's cards stretch to one height.
	const cardsHtml = cards
		.map((card) => {
			const cardResult = buildCard(card, locale);
			warnings.push(...cardResult.warnings);
			return `      ${cardResult.html.replace(/\n/g, "\n      ")}`;
		})
		.join("\n");

	const headingHtml = heading
		? `    <h${heading.level} class="kern-heading-medium">${escapeHtml(heading.text)}</h${heading.level}>\n`
		: "";
	// A kern-grid right inside kern-container takes the container's padding
	// away (see grid.ts), so the grid sits in a div of its own.
	const wrapper = heading ? `<div class="${STACK_CLASSES}">` : "<div>";

	const html = `<div class="kern-container">
  ${wrapper}
${headingHtml}    <div class="${equalColumnsGridClasses(columns)}">
${cardsHtml}
    </div>
  </div>
</div>`;

	return { html, warnings };
}
