import { z } from "zod";
import { iconNameHint, isValidIconName } from "../icons.js";

export const McpCommonSchema = z.object({
	locale: z
		.enum(["de", "en"])
		.optional()
		.describe("Language of generated labels and messages (default: de)."),
	strict: z
		.boolean()
		.optional()
		.describe(
			"If true, validation errors fail the call instead of returning HTML.",
		),
});

export const FormFieldBaseSchema = z.object({
	label: z
		.string()
		.optional()
		.describe(
			"Visible label: short, one line. A placeholder doesn't replace it.",
		),
	hint: z
		.string()
		.optional()
		.describe(
			"Help text below the field, linked via aria-describedby. One short sentence without links, e.g. the expected format.",
		),
	error: z
		.string()
		.optional()
		.describe(
			"Error message; puts the field in its error state. An empty string shows the error style without text.",
		),
	optional: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Shows the optional marker on the label. KERN marks optional fields, not required ones.",
		),
	disabled: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Not focusable and not submitted. Avoid where possible: hide a field that isn't needed.",
		),
	readonly: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Focusable but not editable, for a stored value that stays visible.",
		),
});

export const LabeledFormFieldBaseSchema = FormFieldBaseSchema.extend({
	label: z
		.string()
		.min(1)
		.describe(
			"Visible label: short, one line. A placeholder doesn't replace it.",
		),
});

/** Equal columns on kern-grid: kern-grid-cols-{n} goes from 1 to 12. */
export const GridColumnsSchema = z
	.number()
	.int()
	.min(1)
	.max(12)
	.describe("Equal-width columns, 1 to 12.");

export const HeadingLevelSchema = z
	.union([
		z.literal(1),
		z.literal(2),
		z.literal(3),
		z.literal(4),
		z.literal(5),
		z.literal(6),
	])
	.describe("Heading level, h1 to h6. Don't skip levels.");

export const ComponentSizeSchema = z
	.enum(["default", "small", "large"])
	.describe("Size, on KERN's spacing scale.");

export const IconRefSchema = z
	.object({
		name: z
			.string()
			.refine((val) => isValidIconName(val), {
				error: (issue) => iconNameHint(issue.input),
			})
			.describe("KERN icon name, e.g. arrow-forward. list_icons has them all."),
		position: z
			.enum(["left", "right"])
			.optional()
			.default("left")
			.describe("Which side of the label the icon sits on."),
	})
	.describe("An icon: its name and, optionally, its position.");
