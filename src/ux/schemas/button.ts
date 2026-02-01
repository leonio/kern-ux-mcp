import { z } from "zod";
import { IconRefSchema, McpCommonSchema } from "./foundations.js";

/**
 * Zod schema for Button component parameters.
 */
export const ButtonSchema = z
	.object({
		...McpCommonSchema.shape,
		variant: z
			.enum(["primary", "secondary", "tertiary"])
			.default("primary")
			.describe("Button-Variante: primary, secondary oder tertiary."),
		label: z
			.string()
			.min(1)
			.describe(
				"Sichtbarer Button-Text. Auch bei Icon-only-Varianten erforderlich, damit ein sr-only oder sr-only-mobile Label gerendert werden kann.",
			),
		size: z
			.enum(["default", "x-small", "small"])
			.optional()
			.default("default")
			.describe(
				"Button-Groesse: default oder x-small. Der Wert small bleibt als Legacy-Alias erhalten und wird wie x-small gerendert.",
			),
		block: z
			.boolean()
			.optional()
			.default(false)
			.describe("Volle Breite als kern-btn--block."),
		disabled: z
			.boolean()
			.optional()
			.default(false)
			.describe("Button deaktiviert."),
		icon: z
			.object({
				...IconRefSchema.shape,
			})
			.optional()
			.describe(
				'Optionales Icon im Button. In den KERN-Beispielen dekorativ mit aria-hidden="true"; Position wird ueber icon.position gesteuert.',
			),
		labelVisibility: z
			.enum(["visible", "sr-only", "sr-only-mobile"])
			.optional()
			.default("visible")
			.describe(
				"Label-Sichtbarkeit: visible, sr-only oder sr-only-mobile. Die Icon-only-Varianten der KERN-Beispiele nutzen sr-only bzw. sr-only-mobile fuer zugaengliche Beschriftung.",
			),
	})
	.describe(
		"Parameter fuer KERN UX Button-Komponente. Unterstuetzt KERN-Varianten primary, secondary und tertiary sowie Icon-only-Muster mit verstecktem, aber zugaenglichem Label.",
	);

/** Type for button input (before Zod parsing, allows missing defaulted fields) */
export type ButtonInput = z.input<typeof ButtonSchema>;

/** Type for button params after Zod parsing (all defaults applied) */
export type ButtonParams = z.output<typeof ButtonSchema>;
