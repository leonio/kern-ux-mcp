import { z } from "zod";
import { FormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;
const SingleRadioFieldSchema = FormFieldBaseSchema.pick({
	label: true,
	disabled: true,
}).extend({
	label: z
		.string()
		.min(1)
		.describe(
			"Sichtbarer Label-Text des Einzel-Radiofelds. Kurz und eindeutig formulieren.",
		),
});
const RadioListFieldSchema = FormFieldBaseSchema.pick({
	hint: true,
	error: true,
	optional: true,
});

/**
 * Schema for a single radio item
 */
export const radioItemSchema = z
	.object({
		/** Optional custom ID, auto-generated if not provided */
		id: z
			.string()
			.optional()
			.describe("Optionale feste ID; ohne Angabe wird sie generiert."),
		/** Value attribute for the radio input */
		value: z
			.string()
			.describe("Technischer Wert der Radio-Option fuer den Form-Submit."),
		/** Label text for the radio */
		label: z
			.string()
			.describe(
				"Sichtbarer Label-Text der Option. Radio-Optionen sollten sich gegenseitig ausschliessen und gut unterscheidbar sein.",
			),
		/** Whether this radio is checked */
		checked: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Option ist vorausgewaehlt. Innerhalb einer Gruppe fachlich hoechstens eine Option auf true setzen.",
			),
		/** Whether this radio is disabled */
		disabled: z
			.boolean()
			.optional()
			.default(false)
			.describe("Option ist deaktiviert und kann nicht ausgewaehlt werden."),
	})
	.describe("Ein einzelner Radio-Eintrag in Listenmodus.");

/**
 * Schema for single radio mode - one standalone radio
 */
export const radioSingleSchema = z
	.object({
		...CommonParams,
		mode: z.literal("single"),
		/** Name attribute for the radio (required for form submission) */
		name: z
			.string()
			.describe("Name-Attribut des Radiofelds fuer den Form-Submit."),
		/** Value attribute */
		value: z.string().describe("Wert des Einzel-Radiofelds."),
		/** Whether checked */
		checked: z
			.boolean()
			.optional()
			.default(false)
			.describe("Radio ist vorausgewaehlt."),
	})
	.merge(SingleRadioFieldSchema)
	.describe(
		"Parameter fuer einen einzelnen Radio-Button (mode='single'). Geeignet fuer einen einzelnen exklusiven Auswahlpunkt ausserhalb einer groesseren Gruppe.",
	);

/**
 * Schema for radio list/group mode - multiple radios in a fieldset
 */
export const radioListSchema = z
	.object({
		...CommonParams,
		mode: z.literal("list"),
		/** Name attribute shared by all radios in the group */
		name: z
			.string()
			.describe("Gemeinsames Name-Attribut fuer alle Optionen der Gruppe."),
		/** Legend text for the fieldset */
		legend: z
			.string()
			.describe(
				"Fieldset-Legende fuer die gesamte Radio-Gruppe. Sollte die gemeinsame Frage oder Entscheidung klar benennen.",
			),
		/** Array of radio items */
		items: z
			.array(radioItemSchema)
			.min(1)
			.describe(
				"Radio-Optionen der Gruppe; genau eine Auswahl ist vorgesehen. Wenn ein Default gesetzt wird, hoechstens eine Option mit checked=true markieren.",
			),
		/** Horizontal layout for items */
		horizontal: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Horizontale Darstellung der Optionen in einer Zeile. Nur fuer wenige kurze Optionen verwenden.",
			),
	})
	.merge(RadioListFieldSchema)
	.describe(
		"Parameter fuer eine Radio-Gruppe im Fieldset (mode='list'). Verwenden, wenn genau eine Option aus mehreren moeglichen Antworten gewaehlt werden soll.",
	);

/**
 * Discriminated union for radio: single vs list mode
 */
export const radioSchema = z
	.discriminatedUnion("mode", [radioSingleSchema, radioListSchema])
	.describe(
		"Parameter fuer KERN UX Radio-Komponente (Einzel- oder Listen-Modus).",
	);

export type RadioSingleInput = z.input<typeof radioSingleSchema>;
export type RadioListInput = z.input<typeof radioListSchema>;
export type RadioInput = z.input<typeof radioSchema>;
export type RadioItemInput = z.input<typeof radioItemSchema>;
