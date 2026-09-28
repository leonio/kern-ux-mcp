import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputUrlSchema = inputTextSchema
	.omit({ type: true })
	.extend({
		type: z
			.literal("url")
			.optional()
			.default("url")
			.describe(
				"Fest auf HTML-Typ url gesetzt. Erwartet vollstaendige Adressen inklusive https://, falls ein Web-Link eingegeben werden soll.",
			),
	})
	.describe(
		"Parameter fuer KERN UX InputUrl-Komponente. Nur fuer vollstaendige Web- oder Service-Adressen verwenden; Hinweistext sollte das erwartete Format inklusive Protokoll klar machen.",
	);

export type InputUrlInput = z.input<typeof inputUrlSchema>;
