import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const FieldsetRenderSchema = z
	.object({
		legend: z
			.string()
			.optional()
			.default("Ansprechpartner")
			.describe(
				"Legend-Text des Fieldsets als gruppierende Ueberschrift fuer zusammengehoerige Felder. Die KERN-Stories zeigen sowohl kompakte als auch grosse Legends; der aktuelle Renderer nutzt immer kern-label ohne Groessenwahl oder Optional-Zusatz.",
			),
		includeHint: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird ein zusaetzlicher Hinweistext unterhalb der Legend angezeigt. Die aktuelle MCP-Variante setzt dafuer keinen aria-describedby-Bezug am <fieldset> wie im KERN-Hint-Beispiel.",
			),
		hintText: z
			.string()
			.optional()
			.describe(
				"Optionaler Hinweistext fuer die Feldgruppe (nur relevant bei includeHint=true).",
			),
		horizontal: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Horizontale Ausrichtung der enthaltenen Feld-Elemente aktivieren ueber kern-fieldset__body--horizontal.",
			),
	})
	.describe(
		"Parameter fuer KERN UX Fieldset-Starterstruktur. Diese MCP-Variante rendert ein festes Beispiel-Fieldset mit zwei Textfeldern und dokumentiert nur einen kleinen, bewusst vereinfachten Ausschnitt der umfangreicheren KERN-Patterns fuer Hint, Error und unterschiedliche Legend-Auspraegungen.",
	);

export const FieldsetToolSchema = FieldsetRenderSchema.merge(McpCommonSchema);

export type FieldsetRenderInput = z.input<typeof FieldsetRenderSchema>;
