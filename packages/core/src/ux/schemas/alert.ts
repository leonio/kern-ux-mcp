import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Zod schema for Alert component parameters.
 */
export const AlertSchema = z.object({
	...McpCommonSchema.shape,
	type: z
		.enum(["info", "success", "warning", "danger"])
		.default("info")
		.describe("Sets the colour and the status icon in the header."),
	title: z
		.string()
		.min(1)
		.describe("Heading: short; it carries the main message."),
	body: z
		.object({
			text: z.string().optional().describe("Body text."),
			links: z
				.array(
					z.object({
						href: z.string().describe("Link target."),
						text: z.string().describe("Link text."),
					}),
				)
				.optional()
				.describe(
					"Links, rendered as KERN links with a decorative arrow-forward icon.",
				),
			listItems: z
				.array(z.string())
				.optional()
				.describe("List items, e.g. several points or steps."),
			listStyle: z
				.enum(["default", "bullet"])
				.optional()
				.default("default")
				.describe("default: kern-list; bullet: kern-list kern-list--bullet."),
		})
		.optional()
		.describe("Optional content below the heading."),
});

/** Type for alert input (before Zod parsing, allows missing defaulted fields) */
export type AlertInput = z.input<typeof AlertSchema>;

/** Type for alert params after Zod parsing (all defaults applied) */
export type AlertParams = z.output<typeof AlertSchema>;
