import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a single checkbox item inside list mode.
 */
const CheckboxListItemSchema = z.object({
	id: z
		.string()
		.optional()
		.describe(
			"Optionale feste ID pro Checkbox. Ohne Angabe wird sie automatisch generiert.",
		),
	label: z
		.string()
		.min(1)
		.describe(
			"Sichtbarer Label-Text der Option. Mehrere Eintraege duerfen gleichzeitig ausgewaehlt sein.",
		),
	checked: z
		.boolean()
		.optional()
		.default(false)
		.describe("Checkbox ist aktiviert oder bereits vorselektiert."),
	disabled: z
		.boolean()
		.optional()
		.default(false)
		.describe("Checkbox ist deaktiviert und kann nicht geaendert werden."),
});

/**
 * Single checkbox mode schema.
 */
const SingleCheckboxSchema = z.object({
	mode: z.literal("single").default("single"),
	...CommonParams,
	id: z
		.string()
		.optional()
		.describe(
			"Optionale feste ID fuer die Checkbox. Ohne Angabe wird sie automatisch generiert.",
		),
	name: z
		.string()
		.min(1)
		.describe("Name-Attribut der Checkbox fuer den Form-Submit."),
	label: z
		.string()
		.min(1)
		.describe(
			"Sichtbarer Label-Text der Checkbox. Fuer einzelne Checkboxen idealerweise als bestaetigbare Aussage formulieren, z.B. Zustimmung zu Bedingungen.",
		),
	checked: z
		.boolean()
		.optional()
		.default(false)
		.describe("Checkbox ist aktiviert oder bereits vorselektiert."),
	disabled: z
		.boolean()
		.optional()
		.default(false)
		.describe("Checkbox ist deaktiviert und nicht fokussierbar."),
	error: z
		.object({
			message: z
				.string()
				.describe(
					"Konkrete Fehlermeldung fuer die einzelne Checkbox. Leerer String zeigt nur den Fehlerstil ohne Text.",
				),
			id: z
				.string()
				.optional()
				.describe(
					"Optionale ID fuer aria-describedby. Ohne Angabe wird sie automatisch generiert.",
				),
		})
		.optional()
		.describe(
			"Fehlerzustand fuer die einzelne Checkbox mit optionaler Meldung.",
		),
});

/**
 * Checkbox list mode schema (multiple checkboxes in a fieldset).
 */
const ListCheckboxSchema = z.object({
	mode: z.literal("list"),
	...CommonParams,
	legend: z
		.string()
		.min(1)
		.describe(
			"Fieldset-Legende fuer die Checkbox-Gruppe. Sollte die gemeinsame Frage oder Kategorie der Optionen benennen.",
		),
	optional: z
		.boolean()
		.optional()
		.default(false)
		.describe("Zeigt den Optional-Marker an der Legende an."),
	hint: z
		.object({
			text: z
				.string()
				.describe(
					"Hinweistext fuer die gesamte Gruppe, z.B. Auswahlregeln oder Kontext.",
				),
			id: z
				.string()
				.optional()
				.describe("Optionale ID fuer aria-describedby der Gruppe."),
		})
		.optional()
		.describe("Optionaler Hinweistext fuer die gesamte Checkbox-Gruppe."),
	groupName: z
		.string()
		.min(1)
		.describe(
			"Gemeinsames Name-Attribut fuer alle Checkboxen der Gruppe. Die einzelnen Items erben dieses Feld und benoetigen kein eigenes name-Attribut.",
		),
	items: z
		.array(CheckboxListItemSchema)
		.min(1)
		.describe(
			"Liste unabhaengiger Checkbox-Optionen. Anders als bei Radio duerfen mehrere Eintraege gleichzeitig ausgewaehlt sein.",
		),
	error: z
		.object({
			message: z
				.string()
				.describe(
					"Konkrete Fehlermeldung fuer die gesamte Gruppe. Leerer String zeigt nur den Fehlerstil ohne Text.",
				),
			id: z
				.string()
				.optional()
				.describe(
					"Optionale ID fuer aria-describedby der Gruppe. Ohne Angabe wird sie automatisch generiert.",
				),
		})
		.optional()
		.describe("Fehlerzustand mit optionaler Meldung fuer die gesamte Gruppe."),
});

/**
 * Discriminated union schema for Checkbox component.
 * Use mode: "single" for a single checkbox, mode: "list" for a group in a fieldset.
 */
export const CheckboxSchema = z
	.discriminatedUnion("mode", [SingleCheckboxSchema, ListCheckboxSchema])
	.describe(
		"Parameter fuer KERN UX Checkbox-Komponente (Einzel- oder Listen-Modus). Einzelmodus fuer eine unabhaengige Ja/Nein-Bestaetigung, Listenmodus fuer mehrere unabhaengige Auswahloptionen im Fieldset.",
	);

/** Type for checkbox input (before Zod parsing, allows missing defaulted fields) */
export type CheckboxInput = z.input<typeof CheckboxSchema>;
export type SingleCheckboxInput = z.input<typeof SingleCheckboxSchema>;
export type ListCheckboxInput = z.input<typeof ListCheckboxSchema>;
export type CheckboxItemInput = z.input<typeof CheckboxListItemSchema>;

/** Type for checkbox params after Zod parsing (all defaults applied) */
export type CheckboxParams = z.output<typeof CheckboxSchema>;
export type SingleCheckboxParams = z.output<typeof SingleCheckboxSchema>;
export type ListCheckboxParams = z.output<typeof ListCheckboxSchema>;
