import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for the Loader component
 * Simple spinner/loading indicator with screen reader support
 */
export const loaderSchema = z
	.object({
		...CommonParams,
		/** Whether the loader is visible (adds --visible modifier) */
		visible: z
			.boolean()
			.optional()
			.default(true)
			.describe(
				"Wenn true, wird der Modifier kern-loader--visible gesetzt. Ohne diesen Modifier bleibt nur die Grundstruktur erhalten.",
			),
		/** Screen reader text, localized default will be used if not provided */
		srText: z
			.string()
			.optional()
			.describe(
				"Optionaler Screenreader-Text innerhalb von kern-sr-only. Ohne Angabe wird der lokalisierte Standardtext fuer 'Wird geladen' bzw. 'Loading' verwendet.",
			),
	})
	.describe(
		'Parameter fuer KERN UX Loader-Komponente. Der Renderer erzeugt einen visuellen Ladeindikator mit role="status" und verborgenem Screenreader-Text.',
	);

export type LoaderInput = z.input<typeof loaderSchema>;
