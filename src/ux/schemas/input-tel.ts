import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputTelSchema = inputTextSchema
	.omit({ type: true })
	.extend({
		type: z
			.literal("tel")
			.optional()
			.default("tel")
			.describe(
				'Fest auf HTML-Typ tel gesetzt. Ohne abweichende Vorgabe wird autocomplete="tel" gesetzt.',
			),
	})
	.describe(
		'Parameter fuer KERN UX InputTel-Komponente. Nur fuer Telefonnummern verwenden; Hinweistext sollte bei Bedarf Vorwahl, Laendercode oder das erwartete Nummernformat erklaeren. KERN-Beispiele setzen hier standardmaessig autocomplete="tel".',
	);

export type InputTelInput = z.input<typeof inputTelSchema>;
