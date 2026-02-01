import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const dividerRenderSchema = z
	.object({
		decorative: z
			.boolean()
			.optional()
			.default(true)
			.describe(
				'Wenn true, wird der Divider rein dekorativ mit aria-hidden="true" ausgegeben; andernfalls bleibt das <hr> fuer assistive Technologien sichtbar.',
			),
	})
	.describe(
		'Parameter fuer KERN UX Divider. Der KERN-Divider ist ein schlichtes <hr class="kern-divider">; zentral ist hier vor allem die Entscheidung, ob er nur visuell oder auch semantisch wahrnehmbar sein soll.',
	);

export const dividerToolSchema = dividerRenderSchema.merge(McpCommonSchema);

export type DividerRenderInput = z.input<typeof dividerRenderSchema>;
