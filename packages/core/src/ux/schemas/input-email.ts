import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputEmailSchema = inputTextSchema
	.omit({ type: true })
	.extend({
		type: z
			.literal("email")
			.optional()
			.default("email")
			.describe("Fest auf HTML-Typ email gesetzt."),
	})
	.describe(
		"Parameter für KERN UX InputEmail-Komponente. Nur zur Eingabe von E-Mail-Adressen verwenden; Hinweistext sollte bei Bedarf das erwartete Format erläutern. Ohne abweichende Vorgabe wird autocomplete=email gesetzt.",
	);

export type InputEmailInput = z.input<typeof inputEmailSchema>;
