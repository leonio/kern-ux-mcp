import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a dropdown option
 */
export const dropdownOptionSchema = z.object({
	/** Option value */
	value: z.string().describe("Submitted value."),
	/** Option label text */
	label: z.string().describe("Visible option text."),
	/** Whether this option is selected/checked */
	checked: z
		.boolean()
		.optional()
		.default(false)
		.describe("Checked initially. With inputType radio, at most one option."),
	/** Whether this option is disabled */
	disabled: z.boolean().optional().default(false).describe("Can't be chosen."),
});

/**
 * Schema for the Dropdown component
 * Note: This component is EXPERIMENTAL and uses native <details>/<summary>
 */
export const dropdownSchema = z.object({
	...CommonParams,
	/** Trigger button/label text */
	triggerLabel: z
		.string()
		.describe("Text of the <summary> that opens the dropdown."),
	/** Name attribute for the input group */
	name: z.string().describe("Name shared by every option."),
	/** Array of options */
	options: z
		.array(dropdownOptionSchema)
		.min(1)
		.describe("The options, rendered as radios or checkboxes (inputType)."),
	/** Input type - radio for single select, checkbox for multi-select */
	inputType: z
		.enum(["radio", "checkbox"])
		.optional()
		.default("radio")
		.describe("radio (the default) for one choice, checkbox for several."),
	/** Whether the dropdown is initially open */
	open: z
		.boolean()
		.optional()
		.default(false)
		.describe("Open initially (<details open>)."),
});

export type DropdownOptionInput = z.input<typeof dropdownOptionSchema>;
export type DropdownInput = z.input<typeof dropdownSchema>;
