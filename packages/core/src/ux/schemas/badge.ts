import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Badge type variants (same as Alert types)
 */
export const badgeTypeSchema = z.enum(["info", "success", "warning", "danger"]);

/**
 * Schema for the Badge component
 */
export const badgeSchema = z.object({
	...CommonParams,
	/** Badge type/variant - determines color styling */
	type: badgeTypeSchema.describe("Sets the colour and the status icon."),
	/** Badge label text */
	text: z.string().describe("Badge text: a short status or category."),
	/** Whether to show an icon matching the type */
	showIcon: z
		.boolean()
		.optional()
		.default(false)
		.describe('Shows the status icon before the text, aria-hidden="true".'),
});

export type BadgeType = z.infer<typeof badgeTypeSchema>;
export type BadgeInput = z.input<typeof badgeSchema>;
