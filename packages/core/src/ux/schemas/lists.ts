import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const listsRenderSchema = z.object({
	text: z
		.string()
		.optional()
		.default("Beispieltext")
		.describe('Base text of the two example items, "<text> 1" and "<text> 2".'),
	ordered: z
		.boolean()
		.optional()
		.default(false)
		.describe("An ordered list (ol) instead of an unordered one (ul)."),
});

export const listsToolSchema = listsRenderSchema.extend(McpCommonSchema.shape);

export type ListsRenderInput = z.input<typeof listsRenderSchema>;
