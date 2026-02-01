import { z } from "zod";
import {
	RecursiveContentBlocksSchema,
	RecursiveContentNodeSchema,
} from "./content-union.js";
import {
	ComponentSizeSchema,
	HeadingLevelSchema,
	McpCommonSchema,
} from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for card media (image)
 */
const cardMediaSchema = z.object({
	/** Image source URL */
	src: z
		.string()
		.describe(
			"Bild-URL für den optionalen Medienbereich. Pro Card höchstens ein Medieninhalt verwenden.",
		),
	/** Alt text for the image */
	alt: z
		.string()
		.describe(
			"Aussagekräftiger Alt-Text für das Card-Bild. Bei informativen Bildern erforderlich, damit WCAG 1.1.1 erfüllt bleibt.",
		),
});

/**
 * Schema for card header
 */
const cardHeaderSchema = z.object({
	/** Optional preline text (above title) */
	preline: z
		.string()
		.optional()
		.describe(
			"Optionale Vorzeile oberhalb des Titels für knappe Einordnung oder Kategorie.",
		),
	/** Title text (required) */
	title: z
		.string()
		.min(1)
		.describe(
			"Pflichttitel der Card. Soll den klaren Fokus der Informationseinheit benennen.",
		),
	/** Heading level used for the card title */
	titleLevel: HeadingLevelSchema.optional()
		.default(2)
		.describe(
			"Heading-Ebene für den Card-Titel (h1-h6). Im Seitenkontext hierarchisch und ohne Sprünge verwenden (WCAG 2.4.6).",
		),
	/** Optional subline text (below title) */
	subline: z
		.string()
		.optional()
		.describe(
			"Optionale Unterzeile unterhalb des Titels für zusätzliche, knappe Kontextinformation.",
		),
	/** Optional link URL - makes the card interactive with stretched link */
	href: z
		.string()
		.optional()
		.describe(
			"Optionaler Link für eine flächig interaktive Card. Nur setzen, wenn die gesamte Card genau ein gemeinsames Navigationsziel hat.",
		),
});

/**
 * Schema for card footer buttons
 */
const cardFooterSchema = z.object({
	/** Primary button label */
	primaryLabel: z
		.string()
		.optional()
		.describe(
			"Text der primären Footer-Aktion. Cards sollten insgesamt sparsam mit Aktionen umgehen.",
		),
	/** Secondary button label */
	secondaryLabel: z
		.string()
		.optional()
		.describe(
			"Text der sekundären Footer-Aktion. Zusammen mit primaryLabel maximal zwei Aktionen pro Card.",
		),
});

/**
 * Backward-compatible alias for card content blocks.
 */
export const cardContentBlockSchema = RecursiveContentNodeSchema;

/**
 * Schema for the Card component
 */
export const cardSchema = z.object({
	...CommonParams,
	/** Card size variant */
	size: ComponentSizeSchema.optional()
		.default("default")
		.describe(
			"Card-Größe: small, default oder large. Innerhalb eines gemeinsamen Kontexts möglichst konsistent halten.",
		),
	/** Hug sizing - cards don't stretch to equal height */
	hug: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Wenn true: Card behält ihre eigene Höhe statt sich in einer Reihe auf Equal Height auszudehnen.",
		),
	/** Optional media/image section */
	media: cardMediaSchema.optional(),
	/** Optional header section with title */
	header: cardHeaderSchema.optional(),
	/** Optional body text */
	body: z
		.string()
		.optional()
		.describe(
			"Optionaler einfacher Body-Text. Kurz halten; KERN empfiehlt kompakte Inhalte und höchstens etwa 150 Zeichen als Richtwert. Nicht für lange Texte oder komplexe Tabellen verwenden.",
		),
	/** Whether body should be treated as raw HTML (not escaped) */
	bodyIsHtml: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Wenn true wird body als Roh-HTML gerendert. Nur für vertrauenswürdige, semantisch passende Inhalte verwenden.",
		),
	/** Optional typed content blocks (text/html/button/badge) for rich card composition */
	contentBlocks: RecursiveContentBlocksSchema.optional().describe(
		"Optionale strukturierte Body-Blöcke für kompakte, zusammengehörige Inhalte. Erlaubt rekursive Komposition, sollte aber denselben fokussierten Charakter wie eine klassische Card behalten.",
	),
	/** Optional footer with buttons */
	footer: cardFooterSchema.optional(),
});

export type CardMediaInput = z.input<typeof cardMediaSchema>;
export type CardHeaderInput = z.input<typeof cardHeaderSchema>;
export type CardFooterInput = z.input<typeof cardFooterSchema>;
export type CardContentBlockInput = z.input<typeof cardContentBlockSchema>;
export type CardInput = z.input<typeof cardSchema>;
export type CardParams = z.output<typeof cardSchema>;
