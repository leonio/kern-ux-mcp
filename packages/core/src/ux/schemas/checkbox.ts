import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a single checkbox item inside list mode.
 */
const CheckboxListItemSchema = z.object({
	id: z.string().optional().describe("Element id; generated when omitted."),
	value: z
		.string()
		.optional()
		.describe(
			"Value submitted when this box is checked. Without one the browser sends 'on'.",
		),
	label: z.string().min(1).describe("Visible option text."),
	checked: z.boolean().optional().default(false).describe("Checked initially."),
	disabled: z.boolean().optional().default(false).describe("Can't be changed."),
});

/**
 * Single checkbox mode schema.
 */
const SingleCheckboxSchema = z
	.object({
		mode: z.literal("single").default("single"),
		...CommonParams,
		id: z.string().optional().describe("Element id; generated when omitted."),
		name: z.string().min(1).describe("Name submitted with the form."),
		label: z
			.string()
			.min(1)
			.describe(
				"Visible label, phrased as a statement to confirm, e.g. 'I accept the terms'.",
			),
		checked: z
			.boolean()
			.optional()
			.default(false)
			.describe("Checked initially."),
		disabled: z
			.boolean()
			.optional()
			.default(false)
			.describe("Not focusable and can't be changed."),
		error: z
			.object({
				message: z
					.string()
					.describe(
						"Error message. An empty string shows the error style without text.",
					),
				id: z
					.string()
					.optional()
					.describe(
						"Id of the message, for aria-describedby; generated when omitted.",
					),
			})
			.optional()
			.describe("Puts the checkbox in its error state."),
	})
	.describe("mode 'single' (the default): one checkbox on its own.");

/**
 * Checkbox list mode schema (multiple checkboxes in a fieldset).
 */
const ListCheckboxSchema = z
	.object({
		mode: z.literal("list"),
		...CommonParams,
		legend: z
			.string()
			.min(1)
			.describe("Fieldset legend: the question or topic the options share."),
		optional: z
			.boolean()
			.optional()
			.default(false)
			.describe("Shows the optional marker on the legend."),
		hint: z
			.object({
				text: z
					.string()
					.describe("Help text for the group, e.g. how many to choose."),
				id: z
					.string()
					.optional()
					.describe(
						"Id of the hint, for aria-describedby; generated when omitted.",
					),
			})
			.optional()
			.describe("Help text for the whole group."),
		groupName: z
			.string()
			.min(1)
			.describe(
				"Name shared by every checkbox in the group; items have no name of their own.",
			),
		items: z
			.array(CheckboxListItemSchema)
			.min(1)
			.describe("The checkboxes. Any number can be checked at once."),
		error: z
			.object({
				message: z
					.string()
					.describe(
						"Error message. An empty string shows the error style without text.",
					),
				id: z
					.string()
					.optional()
					.describe(
						"Id of the message, for aria-describedby; generated when omitted.",
					),
			})
			.optional()
			.describe("Puts the whole group in its error state."),
	})
	.describe("mode 'list': a group of checkboxes in a fieldset.");

/**
 * Discriminated union schema for Checkbox component.
 * Use mode: "single" for a single checkbox, mode: "list" for a group in a fieldset.
 */
export const CheckboxSchema = z.discriminatedUnion("mode", [
	SingleCheckboxSchema,
	ListCheckboxSchema,
]);

/** Type for checkbox input (before Zod parsing, allows missing defaulted fields) */
export type CheckboxInput = z.input<typeof CheckboxSchema>;
export type SingleCheckboxInput = z.input<typeof SingleCheckboxSchema>;
export type ListCheckboxInput = z.input<typeof ListCheckboxSchema>;
export type CheckboxItemInput = z.input<typeof CheckboxListItemSchema>;

/** Type for checkbox params after Zod parsing (all defaults applied) */
export type CheckboxParams = z.output<typeof CheckboxSchema>;
export type SingleCheckboxParams = z.output<typeof SingleCheckboxSchema>;
export type ListCheckboxParams = z.output<typeof ListCheckboxSchema>;
