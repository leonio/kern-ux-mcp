import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const bodyRenderSchema = z
	.object({
		text: z
			.string()
			.optional()
			.default("Beispieltext")
			.describe("Textinhalt des Absatzes."),
		size: z
			.enum(["default", "small", "large"])
			.optional()
			.default("default")
			.describe(
				"Body-Groesse: default, small oder large. Der Renderer unterstuetzt diese drei KERN-Modifier, nicht jedoch muted.",
			),
		bold: z
			.boolean()
			.optional()
			.default(false)
			.describe("Wenn true, wird kern-body--bold gesetzt."),
	})
	.describe(
		"Parameter fuer KERN UX Body-Typografie. Diese MCP-Variante deckt die haeufigen Groessen- und Bold-Kombinationen ab; die in den Stories sichtbare muted-Variante ist derzeit nicht Teil des oeffentlichen Schemas.",
	);

export const bodyToolSchema = bodyRenderSchema.merge(McpCommonSchema);

export type BodyRenderInput = z.input<typeof bodyRenderSchema>;
