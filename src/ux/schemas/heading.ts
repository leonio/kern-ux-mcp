import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const headingRenderSchema = z
	.object({
		text: z
			.string()
			.optional()
			.default("Beispieltext")
			.describe("Textinhalt der Ueberschrift."),
		level: z
			.union([
				z.literal(1),
				z.literal(2),
				z.literal(3),
				z.literal(4),
				z.literal(5),
				z.literal(6),
			])
			.optional()
			.default(2)
			.describe(
				"Ueberschriftenebene h1-h6; ohne Hierarchiespruenge im Seitenaufbau verwenden. Der aktuelle Renderer kombiniert jede Ebene mit der Klasse kern-heading-medium und bildet nicht die volle KERN-Skala von display bis small ab.",
			),
	})
	.describe(
		"Parameter fuer KERN UX Heading-Typografie. Diese MCP-Variante ist bewusst vereinfacht und rendert immer kern-heading-medium bei frei waehlbarem h-Level.",
	);

export const headingToolSchema = headingRenderSchema.merge(McpCommonSchema);

export type HeadingRenderInput = z.input<typeof headingRenderSchema>;
