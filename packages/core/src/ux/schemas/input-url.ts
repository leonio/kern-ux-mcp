import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputUrlSchema = inputTextSchema.omit({ type: true }).extend({
	type: z.literal("url").optional().default("url"),
});

export type InputUrlInput = z.input<typeof inputUrlSchema>;
