import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const titleRenderSchema = z.object({
	text: z.string().optional().default("Beispieltext").describe("Title text."),
	size: z
		.enum(["default", "small", "large"])
		.optional()
		.default("default")
		.describe("Title size."),
});

export const titleToolSchema = titleRenderSchema.extend(McpCommonSchema.shape);

export type TitleRenderInput = z.input<typeof titleRenderSchema>;
