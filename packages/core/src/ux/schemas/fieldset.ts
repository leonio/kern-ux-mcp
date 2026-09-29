import type { z } from "zod";
import { RecursiveContentBlocksSchema } from "./content-union.js";
import { FieldsetBaseSchema } from "./field.js";
import { McpCommonSchema } from "./foundations.js";

export const FieldsetRenderSchema = FieldsetBaseSchema.extend({
	contentBlocks: RecursiveContentBlocksSchema.min(1).describe(
		"The grouped content, usually field blocks, e.g. [{ kind: 'field', field: { type: 'text', name: 'street', label: 'Street' } }].",
	),
}).describe(
	"KERN fieldset: groups related form fields under a legend, with an optional hint and a group error.",
);

export const FieldsetToolSchema = FieldsetRenderSchema.extend(
	McpCommonSchema.shape,
);

export type FieldsetRenderInput = z.input<typeof FieldsetRenderSchema>;
