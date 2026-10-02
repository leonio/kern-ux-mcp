import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const dividerRenderSchema = z.object({
	decorative: z
		.boolean()
		.optional()
		.default(true)
		.describe(
			'Hides the divider from assistive technology (aria-hidden="true"). false keeps the <hr> as a semantic break.',
		),
});

export const dividerToolSchema = dividerRenderSchema.extend(
	McpCommonSchema.shape,
);

export type DividerRenderInput = z.input<typeof dividerRenderSchema>;
