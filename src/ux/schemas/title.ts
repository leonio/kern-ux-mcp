import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const titleRenderSchema = z
	.object({
		text: z
			.string()
			.optional()
			.default("Beispieltext")
			.describe("Textinhalt des Title-Elements."),
		size: z
			.enum(["default", "small", "large"])
			.optional()
			.default("default")
			.describe(
				"Title-Groesse: default, small oder large ueber die entsprechenden KERN-Modifier.",
			),
	})
	.describe(
		"Parameter fuer KERN UX Title-Typografie. Der aktuelle Renderer verwendet immer ein <h2> mit kern-title und optionalem Groessen-Modifier, nicht frei waehlbare HTML-Tags.",
	);

export const titleToolSchema = titleRenderSchema.merge(McpCommonSchema);

export type TitleRenderInput = z.input<typeof titleRenderSchema>;
