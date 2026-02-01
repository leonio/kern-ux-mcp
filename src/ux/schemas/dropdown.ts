import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a dropdown option
 */
export const dropdownOptionSchema = z
	.object({
		/** Option value */
		value: z
			.string()
			.describe("Technischer Wert der Option fuer den Form-Submit."),
		/** Option label text */
		label: z.string().describe("Sichtbarer Label-Text der Option."),
		/** Whether this option is selected/checked */
		checked: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Markiert die Option als initial aktiviert. Bei inputType='radio' fachlich hoechstens eine Option auf true setzen.",
			),
		/** Whether this option is disabled */
		disabled: z
			.boolean()
			.optional()
			.default(false)
			.describe("Option ist deaktiviert und kann nicht ausgewaehlt werden."),
	})
	.describe("Ein einzelner Dropdown-Eintrag innerhalb der Liste.");

/**
 * Schema for the Dropdown component
 * Note: This component is EXPERIMENTAL and uses native <details>/<summary>
 */
export const dropdownSchema = z
	.object({
		...CommonParams,
		/** Trigger button/label text */
		triggerLabel: z
			.string()
			.describe("Sichtbarer Text im <summary>-Trigger des Dropdowns."),
		/** Name attribute for the input group */
		name: z
			.string()
			.describe(
				"Gemeinsames Name-Attribut fuer alle enthaltenen Input-Optionen.",
			),
		/** Array of options */
		options: z
			.array(dropdownOptionSchema)
			.min(1)
			.describe(
				"Optionenliste innerhalb des geoeffneten Dropdowns. Je nach inputType als exklusive Radio- oder mehrfache Checkbox-Auswahl gerendert.",
			),
		/** Input type - radio for single select, checkbox for multi-select */
		inputType: z
			.enum(["radio", "checkbox"])
			.optional()
			.default("radio")
			.describe(
				"Typ der inneren Inputs: radio fuer genau eine Auswahl, checkbox fuer Mehrfachauswahl.",
			),
		/** Whether the dropdown is initially open */
		open: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird das zugrunde liegende <details>-Element initial mit open gerendert.",
			),
	})
	.describe(
		"Parameter fuer KERN UX Dropdown-Komponente. Diese Implementierung ist experimentell und bildet ein einfaches <details>/<summary>-Muster mit eingebetteten Radio- oder Checkbox-Optionen nach, nicht eine umfangreiche Menue- oder Select-Komponente.",
	);

export type DropdownOptionInput = z.input<typeof dropdownOptionSchema>;
export type DropdownInput = z.input<typeof dropdownSchema>;
