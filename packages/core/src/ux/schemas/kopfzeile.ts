import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const kopfzeileRenderSchema = z
	.object({
		label: z
			.string()
			.min(1)
			.optional()
			.describe(
				"Text next to the flag; 'Offizielle Website – Bundesrepublik Deutschland' (or its English version) when omitted.",
			),
		fluid: z
			.boolean()
			.optional()
			.describe(
				"Stretch the bar's content across the full width (kern-container-fluid).",
			),
	})
	.describe(
		"KERN Kopfzeile: the thin bar with the German flag that marks an official website of the Federal Republic of Germany. Only for official federal websites.",
	);

export const kopfzeileToolSchema = kopfzeileRenderSchema.extend(
	McpCommonSchema.shape,
);

export type KopfzeileRenderInput = z.input<typeof kopfzeileRenderSchema>;
