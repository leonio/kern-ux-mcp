import { z } from "zod";
import { inputTextSchema } from "./input-text.js";

export const inputPasswordSchema = inputTextSchema
	.omit({ type: true, readonly: true, disabled: true })
	.extend({
		type: z
			.literal("password")
			.optional()
			.default("password")
			.describe("Fest auf HTML-Typ password gesetzt."),
	})
	.strict()
	.describe(
		"Parameter für KERN UX InputPassword-Komponente. Nur für Passwort-Eingabe oder -Erstellung verwenden. Dieses Schema modelliert das Passwortfeld selbst, aber keinen Passwort-vergessen-Link und keinen Sichtbarkeits-Toggle.",
	);

export type InputPasswordInput = z.input<typeof inputPasswordSchema>;
