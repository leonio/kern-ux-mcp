import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const labelRenderSchema = z
	.object({
		text: z
			.string()
			.optional()
			.default("Beispieltext")
			.describe("Sichtbarer Label-Text."),
	})
	.describe(
		"Parameter fuer KERN UX Label-Typografie. Obwohl die KERN-Dokumentation Labels in verschiedenen HTML-Tags zeigt, rendert diese MCP-Variante immer ein echtes <label>-Element mit kern-label.",
	);

export const labelToolSchema = labelRenderSchema.merge(McpCommonSchema);

export type LabelRenderInput = z.input<typeof labelRenderSchema>;
