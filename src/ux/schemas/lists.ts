import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const listsRenderSchema = z
	.object({
		text: z
			.string()
			.optional()
			.default("Beispieltext")
			.describe(
				"Basistext fuer die automatisch erzeugten Beispiel-Listeneintraege.",
			),
		ordered: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				'Wenn true, wird eine einfache geordnete Liste (<ol class="kern-list">) erzeugt; sonst eine einfache ungeordnete Liste (<ul class="kern-list">).',
			),
	})
	.describe(
		"Parameter fuer KERN UX Listen-Typografie. Diese MCP-Variante ist bewusst einfach und modelliert nur grundlegende ul/ol-Listen, nicht die vollstaendigen KERN-Varianten fuer bullet, number, small, large oder horizontal.",
	);

export const listsToolSchema = listsRenderSchema.merge(McpCommonSchema);

export type ListsRenderInput = z.input<typeof listsRenderSchema>;
