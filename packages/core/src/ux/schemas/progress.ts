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
export const progressSchema = z
	.object({
		...CommonParams,
		/** Current progress value */
		value: z
			.number()
			.min(0)
			.describe("Aktueller Fortschrittswert des nativen <progress>-Elements."),
		/** Maximum value (default: 100) */
		max: z
			.number()
			.min(1)
			.optional()
			.default(100)
			.describe(
				"Maximalwert des Fortschritts. Standard ist 100, kann aber auch fuer Schrittzaehlungen wie 2 von 5 gesetzt werden.",
			),
		/** Optional label text (e.g., "Step 2 of 5") */
		label: z
			.string()
			.optional()
			.describe(
				"Optionaler sichtbarer Label-Text wie 'Schritt 2 von 5'. Wenn gesetzt, wird er per for/id mit dem Progress-Element verknuepft.",
			),
		/** Label position: above or below the progress bar */
		labelPosition: z
			.enum(["top", "bottom"])
			.optional()
			.default("top")
			.describe(
				"Position des Labels relativ zum Balken: oberhalb oder unterhalb.",
			),
	})
	.describe(
		"Parameter fuer KERN UX Progress-Komponente. Diese Implementierung bildet das native HTML5-<progress>-Element in einem kern-progress-Wrapper nach und unterstuetzt optional einen verknuepften Label-Text.",
	);

export type ProgressInput = z.input<typeof progressSchema>;
export type ProgressParams = z.output<typeof progressSchema>;
