import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const sublineRenderSchema = z
	.object({
		text: z
			.string()
			.optional()
			.default("Beispieltext")
			.describe("Textinhalt der Subline."),
	})
	.describe(
		"Parameter fuer KERN UX Subline-Typografie. Die KERN-Stories zeigen auch small- und large-Modifier; diese MCP-Variante rendert derzeit nur die Standardklasse kern-subline.",
	);

export const sublineToolSchema = sublineRenderSchema.merge(McpCommonSchema);

export type SublineRenderInput = z.input<typeof sublineRenderSchema>;
