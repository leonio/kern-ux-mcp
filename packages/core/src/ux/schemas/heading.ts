import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const headingRenderSchema = z.object({
	text: z.string().optional().default("Beispieltext").describe("Heading text."),
	level: z
		.union([
			z.literal(1),
			z.literal(2),
			z.literal(3),
			z.literal(4),
			z.literal(5),
			z.literal(6),
		])
		.optional()
		.default(2)
		.describe("Heading level, h1 to h6. Don't skip levels."),
});

export const headingToolSchema = headingRenderSchema.extend(
	McpCommonSchema.shape,
);

export type HeadingRenderInput = z.input<typeof headingRenderSchema>;
