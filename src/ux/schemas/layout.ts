import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Shared schema for foundational layout starter rendering.
 */
export const LayoutRenderSchema = z
	.object({
		pattern: z
			.enum(["container"])
			.default("container")
			.describe(
				"Layout-Muster: container (grid/section sind als dedizierte Tools verfügbar).",
			),
		columns: z
			.number()
			.int()
			.min(1)
			.max(6)
			.optional()
			.describe("Legacy-Feld ohne Wirkung im container-only Layout-Starter."),
		includeHeading: z
			.boolean()
			.optional()
			.describe("Optional eine Heading oberhalb des Inhalts einfügen."),
		headingText: z.string().optional().describe("Text der optionalen Heading."),
	})
	.describe(
		"Parameter für foundational Layout-Starter (Container). Grid und Section haben dedizierte Tools.",
	);

/**
 * Schema for component-specific layout tools including common params.
 */
export const LayoutToolSchema = LayoutRenderSchema.merge(McpCommonSchema);

/** Type for layout starter input (before Zod parsing, allows missing defaulted fields) */
export type LayoutRenderInput = z.input<typeof LayoutRenderSchema>;

/** Type for layout tool input (before Zod parsing, allows missing defaulted fields) */
export type LayoutToolInput = z.input<typeof LayoutToolSchema>;
