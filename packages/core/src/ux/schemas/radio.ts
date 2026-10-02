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
	label: z.string().min(1).describe("Visible label: short and unambiguous."),
});
const RadioListFieldSchema = FormFieldBaseSchema.pick({
	hint: true,
	error: true,
	optional: true,
});

/**
 * Schema for a single radio item
 */
export const radioItemSchema = z.object({
	/** Optional custom ID, auto-generated if not provided */
	id: z.string().optional().describe("Element id; generated when omitted."),
	/** Value attribute for the radio input */
	value: z.string().describe("Submitted value."),
	/** Label text for the radio */
	label: z
		.string()
		.describe(
			"Visible option text. Options exclude each other, so make them distinct.",
		),
	/** Whether this radio is checked */
	checked: z
		.boolean()
		.optional()
		.default(false)
		.describe("Selected initially. Set it on at most one option."),
	/** Whether this radio is disabled */
	disabled: z
		.boolean()
		.optional()
		.default(false)
		.describe("Can't be selected."),
});

/**
 * Schema for single radio mode - one standalone radio
 */
export const radioSingleSchema = z
	.object({
		...CommonParams,
		mode: z.literal("single"),
		/** Name attribute for the radio (required for form submission) */
		name: z.string().describe("Name submitted with the form."),
		/** Value attribute */
		value: z.string().describe("Submitted value."),
		/** Whether checked */
		checked: z
			.boolean()
			.optional()
			.default(false)
			.describe("Selected initially."),
	})
	.extend(SingleRadioFieldSchema.shape)
	.describe("mode 'single': one radio button on its own.");

/**
 * Schema for radio list/group mode - multiple radios in a fieldset
 */
export const radioListSchema = z
	.object({
		...CommonParams,
		mode: z.literal("list"),
		/** Name attribute shared by all radios in the group */
		name: z.string().describe("Name shared by every option in the group."),
		/** Legend text for the fieldset */
		legend: z
			.string()
			.describe(
				"Fieldset legend: the question or decision the options answer.",
			),
		/** Array of radio items */
		items: z
			.array(radioItemSchema)
			.min(1)
			.describe("The options; exactly one can be selected."),
		/** Horizontal layout for items */
		horizontal: z
			.boolean()
			.optional()
			.default(false)
			.describe("Options side by side. Only for a few short options."),
	})
	.extend(RadioListFieldSchema.shape)
	.describe("mode 'list': a group of radio buttons in a fieldset.");

/**
 * Discriminated union for radio: single vs list mode
 */
export const radioSchema = z.discriminatedUnion("mode", [
	radioSingleSchema,
	radioListSchema,
]);

export type RadioSingleInput = z.input<typeof radioSingleSchema>;
export type RadioListInput = z.input<typeof radioListSchema>;
export type RadioInput = z.input<typeof radioSchema>;
export type RadioItemInput = z.input<typeof radioItemSchema>;
