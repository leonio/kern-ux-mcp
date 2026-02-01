import { z } from "zod";
import { FormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;
const SelectFieldSchema = FormFieldBaseSchema.pick({
	label: true,
	hint: true,
	error: true,
	optional: true,
	disabled: true,
}).extend({
	label: z
		.string()
		.min(1)
		.describe(
			"Sichtbares Label des Select-Felds. Kurz, präzise und ohne Doppelpunkt formulieren.",
		),
});

/**
 * Schema for a select option
 */
export const selectOptionSchema = z
	.object({
		/** Value attribute for the option */
		value: z.string().describe("Technischer Option-Wert für Form-Submit."),
		/** Display text for the option */
		text: z
			.string()
			.describe(
				"Sichtbarer Option-Text im Dropdown. Möglichst kurz halten, damit die Liste gut scannbar bleibt.",
			),
		/** Whether this option is selected */
		selected: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Markiert die Option als vorausgewählt. Nur sinnvoll, wenn dies bereits die aktive Einstellung oder ein fachlich legitimer Default ist.",
			),
		/** Whether this option is disabled */
		disabled: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Option kann nicht ausgewählt werden, z.B. wenn sie fachlich nicht verfügbar ist.",
			),
	})
	.describe("Ein einzelner Select-Optionseintrag.");

/**
 * Schema for the Select component
 */
export const selectSchema = z
	.object({
		...CommonParams,
		/** Name attribute for the select */
		name: z
			.string()
			.describe(
				"Name-Attribut des Select-Felds. Sollte die ausgewählte Information fachlich benennen.",
			),
		/** Array of options */
		options: z
			.array(selectOptionSchema)
			.min(1)
			.describe(
				"Optionenliste; mindestens eine Option erforderlich. Geeignet vor allem für einzelne Auswahl aus vordefinierten Optionen, typischerweise bei ungefähr 5 bis 15 Einträgen.",
			),
	})
	.merge(SelectFieldSchema)
	.describe(
		"Parameter für KERN UX Select-Komponente. Für genau eine Auswahl aus vordefinierten Optionen; nicht für Aktionen oder Navigation verwenden. Wenn Radios möglich sind, diese oft bevorzugen.",
	);

export type SelectOptionInput = z.input<typeof selectOptionSchema>;
export type SelectInput = z.input<typeof selectSchema>;
