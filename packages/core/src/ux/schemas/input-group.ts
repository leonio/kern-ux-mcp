import { z } from "zod";
import { FormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;
const InputGroupFieldSchema = FormFieldBaseSchema.pick({
	disabled: true,
	readonly: true,
});

export const inputGroupSchema = z
	.object({
		...CommonParams,
		name: z.string().describe("Name submitted with the form."),
		label: z
			.string()
			.min(1)
			.describe(
				"Visible label: short, one line, e.g. 'Monatliche Miete in €'. A placeholder doesn't replace it.",
			),
		prefix: z
			.string()
			.optional()
			.describe(
				"Text before the input, e.g. 'https://' or '€'. Screen readers don't announce it: repeat it in the label if it matters.",
			),
		suffix: z
			.string()
			.optional()
			.describe(
				"Text after the input, e.g. '.de' or 'EUR'. Screen readers don't announce it: repeat it in the label if it matters.",
			),
		value: z.string().optional().describe("Initial value."),
		placeholder: z.string().optional().describe("Placeholder in the input."),
	})
	.extend(InputGroupFieldSchema.shape);

export type InputGroupInput = z.input<typeof inputGroupSchema>;
