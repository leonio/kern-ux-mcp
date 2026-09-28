import { z } from "zod";
import { RecursiveContentBlocksSchema } from "./content-union.js";
import {
	ComponentSizeSchema,
	GridColumnsSchema,
	HeadingLevelSchema,
	McpCommonSchema,
} from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

/**
 * Simplified card definition for use within a card group.
 * Mirrors the main card schema but omits locale/strict (those go on the group).
 */
const CardItemSchema = z.object({
	size: ComponentSizeSchema.optional()
		.default("default")
		.describe("Card-Größe."),
	hug: z
		.boolean()
		.optional()
		.default(false)
		.describe("Hug-Modus (Karte dehnt sich nicht auf gleiche Höhe)."),
	media: z
		.object({
			src: z.string().describe("Bild-URL."),
			alt: z.string().describe("Alt-Text für das Bild."),
		})
		.optional()
		.describe("Optionaler Medien-/Bildbereich."),
	header: z
		.object({
			preline: z
				.string()
				.optional()
				.describe("Optionale Preline über dem Titel."),
			title: z.string().min(1).describe("Titel-Text."),
			titleLevel: HeadingLevelSchema.optional()
				.default(2)
				.describe("Heading-Ebene für den Karten-Titel (h1–h6)."),
			subline: z
				.string()
				.optional()
				.describe("Optionale Subline unter dem Titel."),
			href: z
				.string()
				.optional()
				.describe("Link-URL – macht die Karte interaktiv."),
		})
		.optional()
		.describe("Optionaler Header mit Titel."),
	body: z.string().optional().describe("Body-Text der Karte."),
	bodyIsHtml: z
		.boolean()
		.optional()
		.default(false)
		.describe("Wenn true: body wird als HTML interpretiert."),
	contentBlocks: RecursiveContentBlocksSchema.optional().describe(
		"Optionale strukturierte Body-Blöcke (text/html/button/badge/card).",
	),
	footer: z
		.object({
			primaryLabel: z.string().optional().describe("Primärer Button Text."),
			secondaryLabel: z.string().optional().describe("Sekundärer Button Text."),
		})
		.optional()
		.describe("Optionaler Footer mit Buttons."),
});

/**
 * Zod schema for Card Group composition tool.
 * Produces multiple cards inside a responsive grid layout.
 */
export const CardGroupSchema = z
	.object({
		...CommonParams,
		cards: z
			.array(CardItemSchema)
			.min(1)
			.max(6)
			.describe("Array von 1–6 Karten-Definitionen."),
		columns: GridColumnsSchema.optional().describe(
			"Anzahl der Spalten im Grid. Standard: Anzahl der Karten (max 4).",
		),
		heading: z
			.object({
				text: z.string().min(1).describe("Gruppen-Überschrift."),
				level: HeadingLevelSchema.optional()
					.default(2)
					.describe("Heading-Ebene (h1–h6). Standard: h2."),
			})
			.optional()
			.describe("Optionale Gruppen-Überschrift über den Karten."),
	})
	.describe(
		"Parameter für KERN UX Card-Group-Komposition (mehrere Karten im Grid).",
	);

export type CardGroupInput = z.input<typeof CardGroupSchema>;
export type CardGroupParams = z.output<typeof CardGroupSchema>;
