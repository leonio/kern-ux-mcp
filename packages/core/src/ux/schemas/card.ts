import { z } from "zod";
import {
	contentBlocksSchema,
	RecursiveContentNodeSchema,
	simpleBlocksSchema,
} from "./content-union.js";
import {
	ComponentSizeSchema,
	HeadingLevelSchema,
	McpCommonSchema,
} from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for card media (image)
 */
const cardMediaSchema = z.object({
	/** Image source URL */
	src: z.string().describe("Image URL; at most one image per card."),
	/** Alt text for the image */
	alt: z
		.string()
		.describe("Alt text; required for an informative image (WCAG 1.1.1)."),
});

/**
 * Schema for card header
 */
const cardHeaderSchema = z.object({
	/** Optional preline text (above title) */
	preline: z
		.string()
		.optional()
		.describe("Short line above the title, e.g. a category."),
	/** Title text (required) */
	title: z.string().min(1).describe("Card title."),
	/** Heading level used for the card title */
	titleLevel: HeadingLevelSchema.optional()
		.default(2)
		.describe("Heading level of the title, h1 to h6. Don't skip levels."),
	/** Optional subline text (below title) */
	subline: z.string().optional().describe("Short line below the title."),
	/** Optional link URL - makes the card interactive with stretched link */
	href: z
		.string()
		.optional()
		.describe(
			"Makes the whole card a link. Only when the card has a single destination.",
		),
});

/**
 * Schema for card footer buttons
 */
const cardFooterSchema = z.object({
	/** Primary button label */
	primaryLabel: z
		.string()
		.optional()
		.describe("Label of the primary footer button."),
	/** Secondary button label */
	secondaryLabel: z
		.string()
		.optional()
		.describe("Label of the secondary footer button."),
});

/**
 * Backward-compatible alias for card content blocks.
 */
export const cardContentBlockSchema = RecursiveContentNodeSchema;

/**
 * What buildCard parses. A card block in render_composition can hold any block
 * except a card, so this takes the full content union; the get_card tool takes
 * cardSchema.
 */
export const cardRenderSchema = z.object({
	...CommonParams,
	/** Card size variant */
	size: ComponentSizeSchema.optional()
		.default("default")
		.describe("Card size; keep cards that sit together the same size."),
	/** Hug sizing - cards don't stretch to equal height */
	hug: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Keeps the card's own height instead of matching the tallest in its row.",
		),
	/** Optional media/image section */
	media: cardMediaSchema.optional(),
	/** Optional header section with title */
	header: cardHeaderSchema.optional(),
	/** Optional body text */
	body: z
		.string()
		.optional()
		.describe("Short body text, about 150 characters at most."),
	/** Whether body should be treated as raw HTML (not escaped) */
	bodyIsHtml: z
		.boolean()
		.optional()
		.default(false)
		.describe("Treat body as trusted HTML instead of escaping it."),
	contentBlocks: contentBlocksSchema("card").optional(),
	/** Optional footer with buttons */
	footer: cardFooterSchema.optional(),
});

/** The get_card tool's input: simple blocks only (roadmap R5, option B). */
export const cardSchema = cardRenderSchema.extend({
	contentBlocks: simpleBlocksSchema()
		.optional()
		.describe(
			"Optional body blocks: text, html, badge or field. Keep the card compact; actions go in footer.",
		),
});

export type CardMediaInput = z.input<typeof cardMediaSchema>;
export type CardHeaderInput = z.input<typeof cardHeaderSchema>;
export type CardFooterInput = z.input<typeof cardFooterSchema>;
export type CardContentBlockInput = z.input<typeof cardContentBlockSchema>;
export type CardInput = z.input<typeof cardRenderSchema>;
export type CardParams = z.output<typeof cardRenderSchema>;
