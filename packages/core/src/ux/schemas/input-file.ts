import { z } from "zod";
import { FormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;
const FileFieldSchema = FormFieldBaseSchema.pick({
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
			"Visible label naming the file expected, e.g. 'Proof of income', not just 'Upload'.",
		),
});

export const inputFileSchema = z
	.object({
		...CommonParams,
		name: z.string().describe("Name submitted with the form."),
		accept: z
			.string()
			.optional()
			.describe(
				"File types the picker offers, e.g. 'image/*,.pdf'. Only a UI filter: validate on the server too.",
			),
	})
	.extend(FileFieldSchema.shape);

export type InputFileInput = z.input<typeof inputFileSchema>;
