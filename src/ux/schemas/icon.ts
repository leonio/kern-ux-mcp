import { z } from "zod";
import { IconRefSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for the Icon component
 */
export const iconSchema = z
	.object({
		...CommonParams,
		/** Icon name from VALID_ICON_NAMES */
		name: IconRefSchema.shape.name.describe(
			"Icon-Name aus der bekannten KERN-Iconliste. Die Grundklasse kern-icon ist immer enthalten; ein default-Modifier wird nicht benoetigt.",
		),
		/** Icon size variant */
		size: z
			.enum(["default", "small", "large", "x-large"])
			.optional()
			.default("default")
			.describe(
				"Icon-Groesse: default ohne Zusatzklasse oder small, large, x-large mit entsprechendem Modifier.",
			),
		/** Whether icon is decorative (aria-hidden) or meaningful (needs aria-label) */
		decorative: z
			.boolean()
			.optional()
			.default(true)
			.describe(
				'Wenn true, wird aria-hidden="true" gesetzt und das Icon bleibt rein dekorativ. Wenn false, muss ariaLabel gesetzt werden.',
			),
		/** Accessible label - required when icon is not decorative */
		ariaLabel: z
			.string()
			.optional()
			.describe(
				"Zugaengliche Beschreibung fuer bedeutungstragende Icons. Nur notwendig, wenn decorative=false ist.",
			),
	})
	.refine((data) => data.decorative !== false || data.ariaLabel, {
		message: "ariaLabel is required when icon is not decorative",
		path: ["ariaLabel"],
	})
	.describe(
		'Parameter fuer KERN UX Icon-Komponente. KERN behandelt Icons standardmaessig als dekorativ; nur bedeutungstragende Icons sollten mit aria-hidden="false" und aria-label exponiert werden.',
	);

export type IconInput = z.input<typeof iconSchema>;
export type IconParams = z.output<typeof iconSchema>;
