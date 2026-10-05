import { z } from "zod";
import { simpleBlocksSchema } from "./content-union.js";
import {
	ComponentSizeSchema,
	GridColumnsSchema,
	HeadingLevelSchema,
	McpCommonSchema,
} from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

/**
 * Simplified card definition for use within a card group.
 * Mirrors the main card schema but omits locale/strict (those go on the group).
 */
const CardItemSchema = z.object({
	size: ComponentSizeSchema.optional()
		.default("default")
		.describe("Card size."),
	hug: z
		.boolean()
		.optional()
		.default(false)
		.describe("Keeps the card's own height instead of matching its row."),
	media: z
		.object({
			src: z.string().describe("Image URL."),
			alt: z.string().describe("Alt text; required for an informative image."),
		})
		.optional(),
	header: z
		.object({
			preline: z.string().optional().describe("Short line above the title."),
			title: z.string().min(1).describe("Card title."),
			titleLevel: HeadingLevelSchema.optional()
				.default(2)
				.describe("Heading level of the title, h1 to h6."),
			subline: z.string().optional().describe("Short line below the title."),
			href: z.string().optional().describe("Makes the whole card a link."),
		})
		.optional(),
	body: z.string().optional().describe("Short body text."),
	bodyIsHtml: z
		.boolean()
		.optional()
		.default(false)
		.describe("Treat body as trusted HTML instead of escaping it."),
	contentBlocks: simpleBlocksSchema()
		.optional()
		.describe("Optional body blocks: text, html, badge or field."),
	footer: z
		.object({
			primaryLabel: z
				.string()
				.optional()
				.describe("Label of the primary button."),
			secondaryLabel: z
				.string()
				.optional()
				.describe("Label of the secondary button."),
		})
		.optional(),
});

/**
 * Zod schema for Card Group composition tool.
 * Produces multiple cards inside a responsive grid layout.
 */
export const CardGroupSchema = z.object({
	...CommonParams,
	cards: z.array(CardItemSchema).min(1).max(6).describe("The cards, 1 to 6."),
	columns: GridColumnsSchema.optional().describe(
		"Columns from md up, at most one per card; by default the number of cards, at most 4.",
	),
	heading: z
		.object({
			text: z.string().min(1).describe("Heading above the cards."),
			level: HeadingLevelSchema.optional()
				.default(2)
				.describe("Its level; h2 by default."),
		})
		.optional(),
});

export type CardGroupInput = z.input<typeof CardGroupSchema>;
export type CardGroupParams = z.output<typeof CardGroupSchema>;
