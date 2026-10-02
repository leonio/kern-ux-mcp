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
export const loaderSchema = z.object({
	...CommonParams,
	/** Whether the loader is visible (adds --visible modifier) */
	visible: z
		.boolean()
		.optional()
		.default(true)
		.describe(
			"Adds kern-loader--visible; without it only the markup renders, hidden.",
		),
	/** Screen reader text, localized default will be used if not provided */
	srText: z
		.string()
		.optional()
		.describe("Screen-reader text; 'Wird geladen' or 'Loading' by default."),
});

export type LoaderInput = z.input<typeof loaderSchema>;
