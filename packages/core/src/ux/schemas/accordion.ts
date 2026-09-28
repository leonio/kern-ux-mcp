import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a single accordion item
 */
export const accordionItemSchema = z
	.object({
		/** Accordion header/title text */
		title: z
			.string()
			.min(1)
			.describe("Titel des einzelnen Accordion-Headers im <summary>."),
		/** Accordion body content (text or HTML) */
		content: z.string().min(1).describe("Inhalt des Accordion-Bodys."),
		/** Whether this accordion is initially open */
		open: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird das einzelne <details>-Element initial mit open gerendert.",
			),
		/** Whether content should be treated as raw HTML (not escaped) */
		contentIsHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird content als vertrauenswuerdiges HTML interpretiert statt escaped.",
			),
	})
	.describe("Ein einzelner Accordion-Eintrag fuer den Gruppenmodus.");

/**
 * Schema for single accordion mode
 */
export const accordionSingleSchema = z
	.object({
		...CommonParams,
		mode: z.literal("single").default("single"),
		/** Accordion header/title text */
		title: z
			.string()
			.min(1)
			.describe("Titel des einzelnen Accordions im <summary>."),
		/** Accordion body content (text or HTML) */
		content: z.string().min(1).describe("Inhalt des Accordion-Bodys."),
		/** Whether this accordion is initially open */
		open: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird das <details>-Element initial geoeffnet gerendert.",
			),
		/** Whether content should be treated as raw HTML (not escaped) */
		contentIsHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird content als vertrauenswuerdiges HTML interpretiert statt escaped.",
			),
	})
	.describe(
		"Parameter fuer ein einzelnes Accordion auf Basis von <details>/<summary>.",
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
			.describe(
				"Accordion-Eintraege innerhalb einer kern-accordion-group. Der Wrapper dient laut KERN vor allem zur Isolation gegen aeussere Flex- oder Grid-Einfluesse.",
			),
	})
	.describe(
		"Parameter fuer eine Accordion-Gruppe mit mehreren <details>-Elementen im kern-accordion-group-Wrapper.",
	);

/**
 * Discriminated union for accordion: single vs group mode
 */
export const accordionSchema = z
	.discriminatedUnion("mode", [accordionSingleSchema, accordionGroupSchema])
	.describe("Parameter fuer KERN UX Accordion-Komponente (single oder group).");

export type AccordionItemInput = z.input<typeof accordionItemSchema>;
export type AccordionSingleInput = z.input<typeof accordionSingleSchema>;
export type AccordionGroupInput = z.input<typeof accordionGroupSchema>;
export type AccordionInput = z.input<typeof accordionSchema>;
export type AccordionParams = z.output<typeof accordionSchema>;
