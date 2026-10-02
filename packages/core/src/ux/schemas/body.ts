import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const bodyRenderSchema = z.object({
	text: z
		.string()
		.optional()
		.default("Beispieltext")
		.describe("Paragraph text."),
	size: z
		.enum(["default", "small", "large"])
		.optional()
		.default("default")
		.describe("Text size."),
	bold: z
		.boolean()
		.optional()
		.default(false)
		.describe("Bold text (kern-body--bold)."),
});

export const bodyToolSchema = bodyRenderSchema.extend(McpCommonSchema.shape);

export type BodyRenderInput = z.input<typeof bodyRenderSchema>;
