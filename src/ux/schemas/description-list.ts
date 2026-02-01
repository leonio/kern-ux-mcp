import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const descriptionListItemSchema = z.object({
	key: z
		.string()
		.describe("Begriff oder Bezeichnung, die im <dt> gerendert wird."),
	value: z
		.string()
		.describe(
			"Zugehoeriger Wert als Textinhalt des <dd>. Die aktuelle MCP-Variante modelliert hier nur Text, kein verschachteltes HTML wie Listen oder Links.",
		),
});

export const descriptionListRenderSchema = z
	.object({
		items: z
			.array(descriptionListItemSchema)
			.min(1)
			.default([
				{ key: "Name", value: "Max" },
				{ key: "Vorname", value: "Mustermann" },
			])
			.describe("Mindestens ein Begriff-Wert-Paar fuer die Description List."),
		stacked: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird zusaetzlich kern-description-list--col gesetzt, um Begriffe und Werte direkt untereinander darzustellen.",
			),
	})
	.describe(
		"Parameter fuer KERN UX DescriptionList. Das Schema deckt die ueblichen zweispaltigen und gestapelten Varianten ab, beschraenkt Werte jedoch auf einfachen Text statt beliebiger HTML-Inhalte.",
	);

export const descriptionListToolSchema =
	descriptionListRenderSchema.merge(McpCommonSchema);

export type DescriptionListRenderInput = z.input<
	typeof descriptionListRenderSchema
>;
