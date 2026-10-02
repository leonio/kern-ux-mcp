import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a single accordion item
 */
export const accordionItemSchema = z.object({
	/** Accordion header/title text */
	title: z.string().min(1).describe("Header text, in the <summary>."),
	/** Accordion body content (text or HTML) */
	content: z.string().min(1).describe("Body content."),
	/** Whether this accordion is initially open */
	open: z.boolean().optional().default(false).describe("Open initially."),
	/** Whether content should be treated as raw HTML (not escaped) */
	contentIsHtml: z
		.boolean()
		.optional()
		.default(false)
		.describe("Treat content as trusted HTML instead of escaping it."),
});

/**
 * Schema for single accordion mode
 */
export const accordionSingleSchema = z
	.object({
		...CommonParams,
		mode: z.literal("single").default("single"),
		/** Accordion header/title text */
		title: z.string().min(1).describe("Header text, in the <summary>."),
		/** Accordion body content (text or HTML) */
		content: z.string().min(1).describe("Body content."),
		/** Whether this accordion is initially open */
		open: z.boolean().optional().default(false).describe("Open initially."),
		/** Whether content should be treated as raw HTML (not escaped) */
		contentIsHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe("Treat content as trusted HTML instead of escaping it."),
	})
	.describe(
		"mode 'single' (the default): one accordion, a <details>/<summary>.",
	);

/**
 * Schema for accordion group mode (multiple accordions)
 */
export const accordionGroupSchema = z
	.object({
		...CommonParams,
		mode: z.literal("group"),
		/** Array of accordion items */
		items: z
			.array(accordionItemSchema)
			.min(1)
			.describe("The accordions, each with title and content."),
	})
	.describe("mode 'group': several accordions in a kern-accordion-group.");

/**
 * Discriminated union for accordion: single vs group mode
 */
export const accordionSchema = z.discriminatedUnion("mode", [
	accordionSingleSchema,
	accordionGroupSchema,
]);

export type AccordionItemInput = z.input<typeof accordionItemSchema>;
export type AccordionSingleInput = z.input<typeof accordionSingleSchema>;
export type AccordionGroupInput = z.input<typeof accordionGroupSchema>;
export type AccordionInput = z.input<typeof accordionSchema>;
export type AccordionParams = z.output<typeof accordionSchema>;
