import { z } from "zod";
import { LabeledFormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for the Textarea component
 * Very similar to InputText but for multi-line text input
 */
export const textareaSchema = z
	.object({
		...CommonParams,
		/** Name attribute for the textarea */
		name: z
			.string()
			.describe(
				"Name-Attribut des Textarea-Felds. Sollte zur fachlichen Bedeutung des Textinhalts passen.",
			),
		/** Optional initial value */
		value: z
			.string()
			.optional()
			.describe(
				"Optionaler Startwert des Textareas, z.B. bei Bearbeitungs- oder Review-Schritten.",
			),
		/** Optional placeholder text */
		placeholder: z
			.string()
			.optional()
			.describe(
				"Optionaler Platzhaltertext für ein kurzes Beispiel oder Formatmuster. Kein Ersatz für das Label.",
			),
		/** Number of visible text rows */
		rows: z
			.number()
			.positive()
			.optional()
			.describe(
				"Anzahl sichtbarer Zeilen (rows-Attribut). Proportional zur erwarteten Textmenge wählen.",
			),
		/** Number of visible text columns */
		cols: z
			.number()
			.positive()
			.optional()
			.describe(
				"Anzahl sichtbarer Spalten (cols-Attribut). Nur nutzen, wenn eine feste Breitensteuerung fachlich sinnvoll ist.",
			),
	})
	.merge(LabeledFormFieldBaseSchema)
	.describe(
		"Parameter für KERN UX Textarea-Komponente. Nur für mehrzeilige Eingaben oder längere Freitexte verwenden; für kurze einzeilige Werte InputText bevorzugen.",
	);

export type TextareaInput = z.input<typeof textareaSchema>;
export type TextareaParams = z.output<typeof textareaSchema>;
