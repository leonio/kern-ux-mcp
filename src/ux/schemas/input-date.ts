import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputDateSchema = inputTextSchema
	.omit({ type: true })
	.extend({
		type: z
			.literal("date")
			.optional()
			.default("date")
			.describe("Fest auf HTML-Typ date gesetzt."),
	})
	.describe(
		"Parameter fuer KERN UX InputDate-Komponente. Dieses Repo modelliert hier bewusst ein einzelnes browsernatives Datumsfeld als vereinfachte Annaeherung; die KERN-Quelle zeigt stattdessen ein Fieldset mit getrennten Eingaben fuer Tag, Monat und Jahr.",
	);

export type InputDateInput = z.input<typeof inputDateSchema>;
