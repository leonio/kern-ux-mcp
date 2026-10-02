import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputEmailSchema = inputTextSchema.omit({ type: true }).extend({
	type: z.literal("email").optional().default("email"),
});

export type InputEmailInput = z.input<typeof inputEmailSchema>;
