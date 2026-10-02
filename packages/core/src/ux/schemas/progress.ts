import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for the Progress component
 * Native HTML5 progress bar with optional label
 */
export const progressSchema = z.object({
	...CommonParams,
	/** Current progress value */
	value: z.number().min(0).describe("Current value."),
	/** Maximum value (default: 100) */
	max: z
		.number()
		.min(1)
		.optional()
		.default(100)
		.describe("Maximum; 100 by default, or e.g. 5 for steps."),
	/** Optional label text (e.g., "Step 2 of 5") */
	label: z
		.string()
		.optional()
		.describe("Visible label linked to the bar, e.g. 'Schritt 2 von 5'."),
	/** Label position: above or below the progress bar */
	labelPosition: z
		.enum(["top", "bottom"])
		.optional()
		.default("top")
		.describe("Label above (top, the default) or below the bar."),
});

export type ProgressInput = z.input<typeof progressSchema>;
export type ProgressParams = z.output<typeof progressSchema>;
