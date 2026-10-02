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
		.describe("Visible label: short, without a trailing colon."),
});

/**
 * Schema for a select option
 */
export const selectOptionSchema = z.object({
	/** Value attribute for the option */
	value: z.string().describe("Submitted value."),
	/** Display text for the option */
	text: z.string().describe("Visible option text; keep it short."),
	/** Whether this option is selected */
	selected: z
		.boolean()
		.optional()
		.default(false)
		.describe("Pre-selected: the current setting or a sensible default."),
	/** Whether this option is disabled */
	disabled: z
		.boolean()
		.optional()
		.default(false)
		.describe("Shown but can't be chosen."),
});

/**
 * Schema for the Select component
 */
export const selectSchema = z
	.object({
		...CommonParams,
		/** Name attribute for the select */
		name: z.string().describe("Name submitted with the form."),
		/** Array of options */
		options: z
			.array(selectOptionSchema)
			.min(1)
			.describe("The options, at least one."),
	})
	.extend(SelectFieldSchema.shape);

export type SelectOptionInput = z.input<typeof selectOptionSchema>;
export type SelectInput = z.input<typeof selectSchema>;
