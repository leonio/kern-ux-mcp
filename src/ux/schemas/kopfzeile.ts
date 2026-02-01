import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const kopfzeileRenderSchema = z
	.object({
		title: z
			.string()
			.optional()
			.default("Kopfzeile")
			.describe(
				"Textinhalt der vereinfachten MCP-Kopfzeile. Upstream zeigt statt eines Seitentitels vor allem den Hinweis 'Offizielle Website - Bundesrepublik Deutschland'.",
			),
		includeNav: z
			.boolean()
			.optional()
			.default(true)
			.describe(
				"Wenn true, wird ein einfacher Navigationsbereich gerendert. Diese Repo-Variante modelliert damit eine vereinfachte Header-Struktur und nicht die eigentliche KERN-Kopfzeile mit Flagge, Label, fluidem Container oder Web-Component-Properties.",
			),
	})
	.describe(
		"Parameter fuer eine stark vereinfachte KERN-UX-Kopfzeile. Die upstream Stories beschreiben primär eine Infoleiste beziehungsweise Web Component mit Flagge, Label, fluid-Option und konfigurierbaren Breakpoints; dieses MCP-Schema bildet davon derzeit nur einen placeholderartigen Header mit optionaler Navigation ab.",
	);

export const kopfzeileToolSchema = kopfzeileRenderSchema.merge(McpCommonSchema);

export type KopfzeileRenderInput = z.input<typeof kopfzeileRenderSchema>;
