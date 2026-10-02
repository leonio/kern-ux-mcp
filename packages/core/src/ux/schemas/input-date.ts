import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputDateSchema = inputTextSchema.omit({ type: true }).extend({
	type: z.literal("date").optional().default("date"),
});

export type InputDateInput = z.input<typeof inputDateSchema>;
