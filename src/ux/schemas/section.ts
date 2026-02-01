import { z } from "zod";
import { RecursiveContentBlocksSchema } from "./content-union.js";
import {
	ComponentSizeSchema,
	HeadingLevelSchema,
	McpCommonSchema,
} from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

/**
 * Zod schema for Section composition tool.
 * Produces a <section> with heading + body paragraphs + optional divider.
 */
export const SectionSchema = z
	.object({
		...CommonParams,
		headingText: z
			.string()
			.min(1)
			.describe(
				"Abschnitts-Überschrift für diese Komposition. Sollte den Inhalt des folgenden Blocks präzise benennen.",
			),
		headingLevel: HeadingLevelSchema.optional()
			.default(2)
			.describe(
				"Heading-Ebene (h1–h6). Im Seitenkontext hierarchisch ohne Sprünge verwenden. Standard: h2.",
			),
		contentBlocks: RecursiveContentBlocksSchema.optional().describe(
			"Primärer Inhaltsbereich als rekursive Content-Blöcke (empfohlen). Geeignet für strukturierte Section-Inhalte mit Grid, Card, Disclosure oder Text.",
		),
		paragraphs: z
			.array(z.string().min(1))
			.min(1)
			.optional()
			.describe(
				"Legacy-Kompatibilität: Ein oder mehrere Absätze als String-Liste. Für neue Aufrufe contentBlocks bevorzugen.",
			),
		paragraphSize: ComponentSizeSchema.optional()
			.default("default")
			.describe("Legacy-Kompatibilität: gemeinsame Textgröße für paragraphs."),
		paragraphBold: z
			.boolean()
			.optional()
			.default(false)
			.describe("Legacy-Kompatibilität: macht paragraphs fett."),
		divider: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Optionale Trennlinie am Ende des Abschnitts, wenn der Bereich visuell klar vom nächsten Block getrennt werden soll.",
			),
	})
	.superRefine((params, ctx) => {
		const hasBlocks =
			Array.isArray(params.contentBlocks) && params.contentBlocks.length > 0;
		const hasParagraphs =
			Array.isArray(params.paragraphs) && params.paragraphs.length > 0;

		if (!hasBlocks && !hasParagraphs) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["contentBlocks"],
				message: "Mindestens contentBlocks oder paragraphs muss gesetzt sein.",
			});
		}
	})
	.describe(
		"Parameter für KERN UX Section-Komposition (Heading + rekursiver Body + optionaler Divider). " +
			"Dies ist eine repo-eigene Kompositionshilfe, keine offizielle Upstream-Einzelkomponente. " +
			"Empfohlen: contentBlocks verwenden. Legacy: paragraphs wird weiterhin unterstützt.",
	);

export type SectionInput = z.input<typeof SectionSchema>;
export type SectionParams = z.output<typeof SectionSchema>;
