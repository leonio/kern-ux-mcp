import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const labelRenderSchema = z.object({
	text: z.string().optional().default("Beispieltext").describe("Label text."),
});

export const labelToolSchema = labelRenderSchema.extend(McpCommonSchema.shape);

export type LabelRenderInput = z.input<typeof labelRenderSchema>;
