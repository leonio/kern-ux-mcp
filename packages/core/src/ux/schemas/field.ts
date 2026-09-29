import { z } from "zod";

export const FIELD_TYPES = [
	"text",
	"email",
	"tel",
	"url",
	"number",
	"date",
	"password",
	"textarea",
	"select",
	"radio",
	"checkbox",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** Types that render an option list and need `options`. */
const TYPES_NEEDING_OPTIONS: ReadonlySet<FieldType> = new Set([
	"select",
	"radio",
]);

const fieldOptionSchema = z.object({
	value: z.string().describe("Submitted value."),
	label: z.string().min(1).describe("Visible option text."),
	selected: z
		.boolean()
		.optional()
		.describe("Pre-selected (select) or checked (radio, checkbox)."),
	disabled: z.boolean().optional(),
});

/**
 * One form field of any type, flattened so the recursive block union stays small.
 * The field block renders through the same templates as the get_input*, get_select,
 * get_radio, get_checkbox and get_textarea tools.
 */
export const FieldSchema = z
	.object({
		type: z
			.enum(FIELD_TYPES)
			.describe(
				"Field type. select and radio need options; checkbox with options renders a checkbox group.",
			),
		name: z.string().min(1).describe("Name submitted with the form."),
		label: z
			.string()
			.min(1)
			.describe("Visible label; the legend for radio and checkbox groups."),
		id: z
			.string()
			.min(1)
			.optional()
			.describe(
				"Element id (the first option's for radio and checkbox groups). Generated when omitted.",
			),
		hint: z
			.string()
			.optional()
			.describe(
				"Short help text below the label, linked via aria-describedby.",
			),
		error: z
			.string()
			.optional()
			.describe(
				"Error message; puts the field in its error state. A form's errorSummary lists it.",
			),
		optional: z.boolean().optional().describe("Marks the field as optional."),
		value: z
			.string()
			.optional()
			.describe("Initial value (text-like types and textarea)."),
		placeholder: z.string().optional(),
		autocomplete: z
			.string()
			.optional()
			.describe("HTML autocomplete token, e.g. given-name, email."),
		rows: z.number().int().min(1).optional().describe("Textarea rows."),
		options: z.array(fieldOptionSchema).min(1).optional(),
	})
	.superRefine((field, ctx) => {
		if (TYPES_NEEDING_OPTIONS.has(field.type) && !field.options) {
			ctx.addIssue({
				code: "custom",
				path: ["options"],
				message: `A ${field.type} field needs options.`,
			});
		}
	});

export type FieldInput = z.input<typeof FieldSchema>;

/**
 * A group of related fields under a legend, without its contentBlocks: the block
 * union and the get_fieldset schema each add their own.
 */
export const FieldsetBaseSchema = z.object({
	legend: z
		.string()
		.min(1)
		.describe(
			"Group heading that screen readers announce, e.g. 'Your address'.",
		),
	legendSize: z
		.enum(["default", "large"])
		.optional()
		.describe(
			"large for a main section of a form (address, payment details); default for a choice group.",
		),
	optional: z
		.boolean()
		.optional()
		.describe("Marks the whole group as optional."),
	hint: z
		.string()
		.optional()
		.describe("Help text for the group, linked via aria-describedby."),
	error: z
		.string()
		.optional()
		.describe("Error message for the group as a whole."),
	horizontal: z
		.boolean()
		.optional()
		.describe("Lays the group's fields out side by side."),
});

export type FieldsetBaseInput = z.input<typeof FieldsetBaseSchema>;

/**
 * A form, without its contentBlocks: the block union adds them. Fields with an
 * error are collected into the optional error summary.
 */
export const FormBaseSchema = z.object({
	action: z.string().optional().describe("URL the form submits to."),
	method: z
		.enum(["get", "post"])
		.optional()
		.describe("Submit method; post when omitted."),
	errorSummary: z
		.object({
			title: z
				.string()
				.min(1)
				.optional()
				.describe("Summary heading; a localized default when omitted."),
		})
		.optional()
		.describe(
			"Shows a summary above the form that links to every field with an error. Set it whenever fields have errors.",
		),
	actions: z
		.object({
			submitLabel: z.string().min(1).describe("Label of the submit button."),
			secondaryLabel: z
				.string()
				.min(1)
				.optional()
				.describe(
					"Label of a secondary button (type=button), e.g. to go back.",
				),
		})
		.optional()
		.describe("Button row at the end of the form."),
});

export type FormBaseInput = z.input<typeof FormBaseSchema>;
