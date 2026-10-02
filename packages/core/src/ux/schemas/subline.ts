import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const sublineRenderSchema = z.object({
	text: z.string().optional().default("Beispieltext").describe("Subline text."),
});

export const sublineToolSchema = sublineRenderSchema.extend(
	McpCommonSchema.shape,
);

export type SublineRenderInput = z.input<typeof sublineRenderSchema>;
