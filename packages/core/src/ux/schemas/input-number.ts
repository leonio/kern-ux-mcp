import type { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputNumberSchema = inputTextSchema
	.omit({ type: true })
	.describe(
		'Parameter fuer KERN UX InputNumber-Komponente. Fuer numerische Eingaben ohne Rechen- oder Spinbox-Bedienung; Rendering folgt KERN als Textfeld mit inputmode="numeric" und pattern="[0-9]*" statt nativer type="number".',
	);

export type InputNumberInput = z.input<typeof inputNumberSchema>;
