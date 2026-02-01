import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const TypographyKindSchema = z.enum([
	"heading",
	"body",
	"label",
	"link",
	"list",
	"preline",
	"subline",
	"title",
]);

export const TypographyRenderSchema = z
	.object({
		kind: TypographyKindSchema,
		level: z
			.union([
				z.literal(1),
				z.literal(2),
				z.literal(3),
				z.literal(4),
				z.literal(5),
				z.literal(6),
			])
			.optional(),
		text: z.string().optional(),
		href: z.string().optional(),
		ordered: z.boolean().optional(),
	})
	.describe("Parameter für foundational Typography-Bausteine.");

export const TypographyToolSchema = TypographyRenderSchema.extend({
	kind: TypographyKindSchema.optional(),
}).merge(McpCommonSchema);

/** Type for typography starter input (before Zod parsing, allows missing defaulted fields) */
export type TypographyRenderInput = z.input<typeof TypographyRenderSchema>;

/** Type for typography tool input (before Zod parsing, allows missing defaulted fields) */
export type TypographyToolInput = z.input<typeof TypographyToolSchema>;
