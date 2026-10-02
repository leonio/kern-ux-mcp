import { z } from "zod";
import { LabeledFormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for the InputText component
 * This schema can be extended/reused for other input types (email, tel, url, etc.)
 */
export const inputTextSchema = z
	.object({
		...CommonParams,
		/** Name attribute for the input */
		name: z.string().describe("Name submitted with the form."),
		/** Optional initial value */
		value: z.string().optional().describe("Initial value."),
		/** Optional placeholder text */
		placeholder: z
			.string()
			.optional()
			.describe("A short format example. It doesn't replace the label."),
		/** Optional autocomplete token */
		autocomplete: z
			.string()
			.optional()
			.describe(
				"Standard HTML autocomplete token, e.g. name, given-name, family-name, email, tel, street-address. Set it for personal data.",
			),
		/** Input type - defaults to "text", can be extended for other input components */
		type: z
			.enum(["text", "email", "tel", "url", "number", "date", "password"])
			.optional()
			.default("text")
			.describe(
				"HTML input type. get_inputemail and the other typed tools set it for you.",
			),
	})
	.extend(LabeledFormFieldBaseSchema.shape);

export type InputTextInput = z.input<typeof inputTextSchema>;
