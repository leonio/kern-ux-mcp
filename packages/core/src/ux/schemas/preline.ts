import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const prelineRenderSchema = z.object({
	text: z.string().optional().default("Beispieltext").describe("Preline text."),
});

export const prelineToolSchema = prelineRenderSchema.extend(
	McpCommonSchema.shape,
);

export type PrelineRenderInput = z.input<typeof prelineRenderSchema>;
