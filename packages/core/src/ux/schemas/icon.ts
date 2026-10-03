import { z } from "zod";
import { IconRefSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for the Icon component
 */
export const iconSchema = z
	.object({
		...CommonParams,
		/** Icon name from VALID_ICON_NAMES (icons.ts) */
		name: IconRefSchema.shape.name,
		/** Icon size variant */
		size: z
			.enum(["default", "small", "large", "x-large"])
			.optional()
			.default("default")
			.describe("Size; every size but default adds a modifier."),
		/** Whether icon is decorative (aria-hidden) or meaningful (needs aria-label) */
		decorative: z
			.boolean()
			.optional()
			.default(true)
			.describe(
				'Decorative (aria-hidden="true"), the default. false needs ariaLabel.',
			),
		/** Accessible label - required when icon is not decorative */
		ariaLabel: z
			.string()
			.optional()
			.describe("Accessible name of a meaningful icon (decorative: false)."),
	})
	.refine((data) => data.decorative !== false || data.ariaLabel, {
		error: "ariaLabel is required when icon is not decorative",
		path: ["ariaLabel"],
	});

export type IconInput = z.input<typeof iconSchema>;
export type IconParams = z.output<typeof iconSchema>;
