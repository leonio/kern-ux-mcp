import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Badge type variants (same as Alert types)
 */
export const badgeTypeSchema = z.enum(["info", "success", "warning", "danger"]);

/**
 * Schema for the Badge component
 */
export const badgeSchema = z
	.object({
		...CommonParams,
		/** Badge type/variant - determines color styling */
		type: badgeTypeSchema.describe(
			"Badge-Variante: info, success, warning oder danger. Steuert Farbe und optional das passende Status-Icon.",
		),
		/** Badge label text */
		text: z
			.string()
			.describe(
				"Sichtbarer Badge-Text. Sollte den Status oder die Kategorie knapp benennen.",
			),
		/** Whether to show an icon matching the type */
		showIcon: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				'Wenn true, wird ein passendes Status-Icon vor dem Text gerendert. In den KERN-Beispielen bleibt dieses Icon standardmaessig aria-hidden="true".',
			),
	})
	.describe(
		"Parameter fuer KERN UX Badge-Komponente. Geeignet fuer kompakte Status- oder Kategoriehinweise; das Badge ist rein darstellend und nicht als interaktives Element gedacht.",
	);

export type BadgeType = z.infer<typeof badgeTypeSchema>;
export type BadgeInput = z.input<typeof badgeSchema>;
