import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const prelineRenderSchema = z
	.object({
		text: z
			.string()
			.optional()
			.default("Beispieltext")
			.describe("Textinhalt der Preline."),
	})
	.describe(
		"Parameter fuer KERN UX Preline-Typografie. Die KERN-Stories zeigen auch small- und large-Modifier; diese MCP-Variante rendert derzeit nur die Standardklasse kern-preline.",
	);

export const prelineToolSchema = prelineRenderSchema.merge(McpCommonSchema);

export type PrelineRenderInput = z.input<typeof prelineRenderSchema>;
