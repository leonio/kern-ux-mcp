import type { z } from "zod";
import { contentBlocksSchema, simpleBlocksSchema } from "./content-union.js";
import { FieldsetBaseSchema } from "./field.js";
import { McpCommonSchema } from "./foundations.js";

/**
 * What buildFieldset parses. A fieldset block in render_composition can hold any
 * block except a form, so this takes the full content union; the get_fieldset
 * tool takes FieldsetToolSchema.
 */
export const FieldsetRenderSchema = FieldsetBaseSchema.extend({
	contentBlocks: contentBlocksSchema("fieldset").min(1),
}).describe(
	"KERN fieldset: groups related form fields under a legend, with an optional hint and a group error.",
);

/** The get_fieldset tool's input: simple blocks only (roadmap R5, option B). */
export const FieldsetToolSchema = FieldsetRenderSchema.extend({
	contentBlocks: simpleBlocksSchema()
		.min(1)
		.describe(
			"The grouped content: field blocks, plus text, html or badge, e.g. [{ kind: 'field', field: { type: 'text', name: 'street', label: 'Street' } }].",
		),
	...McpCommonSchema.shape,
});

export type FieldsetRenderInput = z.input<typeof FieldsetRenderSchema>;
