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
			.enum(["x-small", "small", "default", "large", "x-large"])
			.optional()
			.default("default")
			.describe(
				"Height: x-small 32 px, small 40, default 48, large 56, x-large 64.",
			),
		block: z
			.boolean()
			.optional()
			.default(false)
			.describe("Volle Breite als kern-btn--block."),
		type: z
			.enum(["button", "submit"])
			.optional()
			.default("button")
			.describe(
				"HTML button type. submit sends the enclosing form; button (the default) does nothing on its own.",
			),
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
