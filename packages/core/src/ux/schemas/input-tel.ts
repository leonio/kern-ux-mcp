import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputTelSchema = inputTextSchema.omit({ type: true }).extend({
	type: z.literal("tel").optional().default("tel"),
});

export type InputTelInput = z.input<typeof inputTelSchema>;
