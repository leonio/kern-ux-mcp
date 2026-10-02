import { z } from "zod";
import { LabeledFormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for the Textarea component
 * Very similar to InputText but for multi-line text input
 */
export const textareaSchema = z
	.object({
		...CommonParams,
		/** Name attribute for the textarea */
		name: z.string().describe("Name submitted with the form."),
		/** Optional initial value */
		value: z.string().optional().describe("Initial text."),
		/** Optional placeholder text */
		placeholder: z
			.string()
			.optional()
			.describe("A short example. It doesn't replace the label."),
		/** Number of visible text rows */
		rows: z
			.number()
			.positive()
			.optional()
			.describe("Visible rows, in proportion to the text expected."),
		/** Number of visible text columns */
		cols: z
			.number()
			.positive()
			.optional()
			.describe("Visible columns. Only when a fixed width is needed."),
	})
	.extend(LabeledFormFieldBaseSchema.shape);

export type TextareaInput = z.input<typeof textareaSchema>;
export type TextareaParams = z.output<typeof textareaSchema>;
