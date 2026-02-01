import { z } from "zod";
import { RecursiveContentBlocksSchema } from "./content-union.js";
import { McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

/**
 * Zod schema for Disclosure (expand/collapse) component.
 * Uses native <details>/<summary> with KERN UX accordion styling.
 */
export const DisclosureSchema = z
	.object({
		...CommonParams,
		triggerLabel: z
			.string()
			.min(1)
			.describe(
				"Text für den Expand/Collapse-Trigger im <summary>. Kurz, eindeutig und als aufklappbare Information verständlich formulieren.",
			),
		contentBlocks: RecursiveContentBlocksSchema.optional().describe(
			"Primärer Disclosure-Inhalt als rekursive Content-Blöcke (empfohlen). Eignet sich für strukturierte, aber kompakte Zusatzinformationen.",
		),
		content: z
			.string()
			.min(1)
			.optional()
			.describe(
				"Legacy-Inhalt des auf-/zuklappbaren Bereichs als Text oder HTML-String. Für neue Aufrufe contentBlocks bevorzugen.",
			),
		contentIsHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Legacy-Kompatibilität: Wenn true wird content als HTML interpretiert. Nur für vertrauenswürdige Inhalte verwenden.",
			),
		open: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true: Bereich ist initial geöffnet. Standardmäßig geschlossen lassen, außer der Kontext erfordert sofort sichtbare Zusatzinformationen.",
			),
	})
	.superRefine((params, ctx) => {
		const hasBlocks =
			Array.isArray(params.contentBlocks) && params.contentBlocks.length > 0;
		const hasLegacyContent =
			typeof params.content === "string" && params.content.length > 0;

		if (!hasBlocks && !hasLegacyContent) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["contentBlocks"],
				message: "Mindestens contentBlocks oder content muss gesetzt sein.",
			});
		}
	})
	.describe(
		"Parameter für KERN UX Disclosure (Expand/Collapse mit <details>/<summary> und Accordion-Styling). " +
			"Dies ist eine repo-eigene Kompositionshilfe für einzelne Disclosure-Blöcke, keine offizielle Upstream-Akkordeon-Komponente.",
	);

export type DisclosureInput = z.input<typeof DisclosureSchema>;
export type DisclosureParams = z.output<typeof DisclosureSchema>;
