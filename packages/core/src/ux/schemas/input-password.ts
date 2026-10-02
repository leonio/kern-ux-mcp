import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputPasswordSchema = inputTextSchema
	.omit({ type: true, readonly: true, disabled: true })
	.extend({
		type: z.literal("password").optional().default("password"),
	})
	.strict();

export type InputPasswordInput = z.input<typeof inputPasswordSchema>;
