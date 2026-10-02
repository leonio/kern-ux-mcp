import { z } from "zod";

/**
 * Schema for the KERN UX utility-reference documentation tool.
 *
 * This tool covers CSS utility classes (flex, CSS Grid, gap, spacing, stack)
 * that are not full components but composable layout helpers.
 */

export const utilityCategories = [
	"all",
	"flex",
	"css-grid",
	"gap",
	"spacing",
	"surface",
	"stack",
	"alignment",
] as const;

export const UtilityReferenceSchema = z.object({
	category: z
		.enum(utilityCategories)
		.optional()
		.default("all")
		.describe("Limits the reference to one category; all by default."),
	locale: z
		.enum(["de", "en"])
		.optional()
		.describe("Language of the descriptions (default: de)."),
});

export type UtilityReferenceInput = z.input<typeof UtilityReferenceSchema>;
