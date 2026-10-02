import { z } from "zod";
import { IconRefSchema, McpCommonSchema } from "./foundations.js";

/**
 * Zod schema for Button component parameters.
 */
export const ButtonSchema = z.object({
	...McpCommonSchema.shape,
	variant: z
		.enum(["primary", "secondary", "tertiary"])
		.default("primary")
		.describe("Visual weight: primary (the default), secondary or tertiary."),
	label: z
		.string()
		.min(1)
		.describe(
			"Button text. Required for icon-only buttons too: it becomes their sr-only label.",
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
		.describe("Full width (kern-btn--block)."),
	type: z
		.enum(["button", "submit"])
		.optional()
		.default("button")
		.describe(
			"HTML button type. submit sends the enclosing form; button (the default) does nothing on its own.",
		),
	disabled: z.boolean().optional().default(false).describe("Disabled."),
	icon: z
		.object({
			...IconRefSchema.shape,
		})
		.optional()
		.describe(
			'Decorative icon (aria-hidden="true"); icon.position sets its side.',
		),
	labelVisibility: z
		.enum(["visible", "sr-only", "sr-only-mobile"])
		.optional()
		.default("visible")
		.describe(
			"sr-only hides the label visually, for an icon-only button; sr-only-mobile hides it on small screens only.",
		),
});

/** Type for button input (before Zod parsing, allows missing defaulted fields) */
export type ButtonInput = z.input<typeof ButtonSchema>;

/** Type for button params after Zod parsing (all defaults applied) */
export type ButtonParams = z.output<typeof ButtonSchema>;
