import { z } from "zod";
import { LabeledFormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for the InputText component
 * This schema can be extended/reused for other input types (email, tel, url, etc.)
 */
export const inputTextSchema = z
	.object({
		...CommonParams,
		/** Name attribute for the input */
		name: z
			.string()
			.describe(
				"Name-Attribut für das Feld (wird beim Submit übertragen). Sollte zur fachlichen Bedeutung des Werts passen.",
			),
		/** Optional initial value */
		value: z
			.string()
			.optional()
			.describe("Optionaler vorbefüllter oder bereits bekannter Feldwert."),
		/** Optional placeholder text */
		placeholder: z
			.string()
			.optional()
			.describe(
				"Optionaler Platzhaltertext für ein kurzes Format- oder Beispielmuster. Kein Ersatz für das Label.",
			),
		/** Optional autocomplete token */
		autocomplete: z
			.string()
			.optional()
			.describe(
				"Optionaler HTML-autocomplete-Token wie email, tel, name, given-name, family-name, street-address oder one-time-code. Nur standardisierte Tokens verwenden.",
			),
		/** Input type - defaults to "text", can be extended for other input components */
		type: z
			.enum(["text", "email", "tel", "url", "number", "date", "password"])
			.optional()
			.default("text")
			.describe(
				"HTML input type. Spezifische Tools setzen feste Typen (z.B. get_inputemail => email). Für freie Einzelauswahl mit bekannten Optionen besser Select, Radios oder Checkboxes verwenden.",
			),
	})
	.merge(LabeledFormFieldBaseSchema)
	.describe(
		"Parameter für KERN UX InputText-Komponente (Basis für abgeleitete Input-Typen). Für einzeilige, nicht vorhersehbare Eingaben; für mehrzeilige Texte Textarea und für bekannte Optionen Select, Radios oder Checkboxes bevorzugen. Bei personenbezogenen oder bekannten Daten wenn moeglich passende autocomplete-Tokens setzen.",
	);

export type InputTextInput = z.input<typeof inputTextSchema>;
