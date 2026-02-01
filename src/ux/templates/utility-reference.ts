import type { UtilityReferenceInput } from "../schemas/utility-reference.js";
import { UtilityReferenceSchema } from "../schemas/utility-reference.js";

/* ------------------------------------------------------------------ */
/*  Structured reference data for KERN UX CSS utility classes          */
/* ------------------------------------------------------------------ */

export type UtilityEntry = {
	/** CSS class name */
	className: string;
	/** Short description (German) */
	de: string;
	/** Short description (English) */
	en: string;
	/** Optional example HTML snippet */
	example?: string;
};

export type UtilitySection = {
	id: string;
	titleDe: string;
	titleEn: string;
	descriptionDe: string;
	descriptionEn: string;
	entries: UtilityEntry[];
};

/* ---------- Flex utilities ---------- */

const FLEX_SECTION: UtilitySection = {
	id: "flex",
	titleDe: "Flex-Layout",
	titleEn: "Flex Layout",
	descriptionDe: "CSS-Flex-Hilfsklassen für flexible Layouts ohne eigenes CSS.",
	descriptionEn:
		"CSS flex utility classes for flexible layouts without custom CSS.",
	entries: [
		{
			className: "kern-flex",
			de: "Aktiviert Flexbox (row, nowrap als Standard).",
			en: "Activates flexbox (row, nowrap by default).",
			example:
				'<div class="kern-flex kern-gap-md">\n  <div>Item 1</div>\n  <div>Item 2</div>\n</div>',
		},
		{
			className: "kern-flex-row",
			de: "Flex-Richtung: Zeile (Standard).",
			en: "Flex direction: row (default).",
		},
		{
			className: "kern-flex-row-reverse",
			de: "Flex-Richtung: Zeile umgekehrt.",
			en: "Flex direction: row reverse.",
		},
		{
			className: "kern-flex-col",
			de: "Flex-Richtung: Spalte.",
			en: "Flex direction: column.",
		},
		{
			className: "kern-flex-col-reverse",
			de: "Flex-Richtung: Spalte umgekehrt.",
			en: "Flex direction: column reverse.",
		},
		{
			className: "kern-flex-wrap",
			de: "Flex-Umbruch aktivieren.",
			en: "Enable flex wrapping.",
		},
	],
};

/* ---------- CSS Grid utilities ---------- */

const CSS_GRID_SECTION: UtilitySection = {
	id: "css-grid",
	titleDe: "CSS-Grid-Layout",
	titleEn: "CSS Grid Layout",
	descriptionDe:
		"CSS-Grid-Hilfsklassen für spaltenbasierte Layouts (Alternative zum 12-Spalten-Grid).",
	descriptionEn:
		"CSS grid utility classes for column-based layouts (alternative to the 12-column grid).",
	entries: [
		{
			className: "kern-grid",
			de: "Aktiviert CSS Grid.",
			en: "Activates CSS grid.",
			example:
				'<div class="kern-grid kern-grid-cols-3 kern-gap-md">\n  <div>A</div>\n  <div>B</div>\n  <div>C</div>\n</div>',
		},
		{
			className: "kern-grid-cols-{1–12}",
			de: "Definiert die Anzahl gleichmäßiger Spalten (1–12). Beispiel: kern-grid-cols-4.",
			en: "Defines the number of equal columns (1–12). Example: kern-grid-cols-4.",
		},
		{
			className: "kern-col-span-{1–12}",
			de: "Element über N Spalten spannen. Beispiel: kern-col-span-8.",
			en: "Span an element across N columns. Example: kern-col-span-8.",
			example:
				'<div class="kern-grid kern-grid-cols-12 kern-gap-md">\n  <div class="kern-col-span-8">Breit</div>\n  <div class="kern-col-span-4">Schmal</div>\n</div>',
		},
	],
};

/* ---------- Gap utilities ---------- */

const GAP_SECTION: UtilitySection = {
	id: "gap",
	titleDe: "Abstände (Gap)",
	titleEn: "Gap Spacing",
	descriptionDe:
		"Gap-Klassen für Flex- und Grid-Layouts. Basiert auf KERN-Spacing-Tokens.",
	descriptionEn:
		"Gap classes for flex and grid layouts. Based on KERN spacing tokens.",
	entries: [
		{ className: "kern-gap-xxs", de: "Gap: 2x-small.", en: "Gap: 2x-small." },
		{ className: "kern-gap-xs", de: "Gap: x-small.", en: "Gap: x-small." },
		{ className: "kern-gap-sm", de: "Gap: small.", en: "Gap: small." },
		{
			className: "kern-gap-md",
			de: "Gap: medium (Standard).",
			en: "Gap: medium (default).",
		},
		{ className: "kern-gap-lg", de: "Gap: large.", en: "Gap: large." },
		{ className: "kern-gap-xl", de: "Gap: x-large.", en: "Gap: x-large." },
	],
};

/* ---------- Spacing utilities ---------- */

const SPACING_SECTION: UtilitySection = {
	id: "spacing",
	titleDe: "Spacing (Margin & Padding)",
	titleEn: "Spacing (Margin & Padding)",
	descriptionDe:
		"Margin- und Padding-Hilfsklassen basierend auf KERN-Spacing-Tokens. Auch CSS-Variablen für eigene Layouts verfügbar.",
	descriptionEn:
		"Margin and padding utility classes based on KERN spacing tokens. CSS custom properties also available for custom layouts.",
	entries: [
		{
			className: "kern-m-{none|xxs|xs|sm|md|lg|xl}",
			de: "Margin (alle Seiten). Beispiel: kern-m-md.",
			en: "Margin (all sides). Example: kern-m-md.",
		},
		{
			className: "kern-p-{none|xxs|xs|sm|md|lg|xl}",
			de: "Padding (alle Seiten). Beispiel: kern-p-sm.",
			en: "Padding (all sides). Example: kern-p-sm.",
		},
		{
			className: "--kern-metric-space-none",
			de: "CSS-Variable: 0.",
			en: "CSS variable: 0.",
		},
		{
			className: "--kern-metric-space-2x-small",
			de: "CSS-Variable: 2px.",
			en: "CSS variable: 2px.",
		},
		{
			className: "--kern-metric-space-x-small",
			de: "CSS-Variable: 4px.",
			en: "CSS variable: 4px.",
		},
		{
			className: "--kern-metric-space-small",
			de: "CSS-Variable: 8px.",
			en: "CSS variable: 8px.",
		},
		{
			className: "--kern-metric-space-default",
			de: "CSS-Variable: 16px (Standard-Spacing).",
			en: "CSS variable: 16px (default spacing).",
		},
		{
			className: "--kern-metric-space-large",
			de: "CSS-Variable: 24px.",
			en: "CSS variable: 24px.",
		},
		{
			className: "--kern-metric-space-x-large",
			de: "CSS-Variable: 32px.",
			en: "CSS variable: 32px.",
		},
	],
};

/* ---------- Surface / Background ---------- */

const SURFACE_SECTION: UtilitySection = {
	id: "surface",
	titleDe: "Oberflächen & Hintergrund",
	titleEn: "Surface & Background",
	descriptionDe:
		"KERN UX bietet KEINE Background-Hilfsklassen (kein kern-bg-*, kein kern-surface-*). " +
		"Hintergrundfarben werden ausschließlich über CSS Custom Properties gesteuert. " +
		"Verwende diese Variablen in eigenem CSS oder style-Attribut.",
	descriptionEn:
		"KERN UX provides NO background utility classes (no kern-bg-*, no kern-surface-*). " +
		"Background colors are controlled exclusively via CSS custom properties. " +
		"Use these variables in custom CSS or style attributes.",
	entries: [
		{
			className: "--kern-color-background-default",
			de: "Standard-Hintergrund (weiß im hellen Theme).",
			en: "Default background (white in light theme).",
			example:
				'<div style="background-color: var(--kern-color-background-default)">…</div>',
		},
		{
			className: "--kern-color-background-subtle",
			de: "Dezenter Hintergrund für Abschnitte oder Karten (hellgrau im hellen Theme).",
			en: "Subtle background for sections or cards (light gray in light theme).",
			example:
				'<div style="background-color: var(--kern-color-background-subtle); padding: var(--kern-metric-space-default)">…</div>',
		},
		{
			className: "--kern-color-background-inverse",
			de: "Invertierter Hintergrund (dunkel im hellen Theme).",
			en: "Inverse background (dark in light theme).",
		},
		{
			className: "--kern-color-background-brand",
			de: "Marken-Hintergrund (Primärfarbe).",
			en: "Brand background (primary color).",
		},
		{
			className: "--kern-color-surface-info",
			de: "Oberfläche für Info-Elemente (z.B. Hinweis-Boxen).",
			en: "Surface for informational elements (e.g. hint boxes).",
		},
		{
			className: "--kern-color-surface-success",
			de: "Oberfläche für Erfolgs-Elemente.",
			en: "Surface for success elements.",
		},
		{
			className: "--kern-color-surface-warning",
			de: "Oberfläche für Warn-Elemente.",
			en: "Surface for warning elements.",
		},
		{
			className: "--kern-color-surface-danger",
			de: "Oberfläche für Fehler-Elemente.",
			en: "Surface for danger/error elements.",
		},
	],
};

/* ---------- Stack utilities ---------- */

const STACK_SECTION: UtilitySection = {
	id: "stack",
	titleDe: "Stack-Layout",
	titleEn: "Stack Layout",
	descriptionDe:
		"Vertikales Flex-Layout mit Standard-Abstand zwischen Kindelementen.",
	descriptionEn: "Vertical flex layout with default gap between children.",
	entries: [
		{
			className: "kern-stack",
			de: "Vertikaler Flex-Container mit Standard-Gap.",
			en: "Vertical flex container with default gap.",
			example:
				'<div class="kern-stack">\n  <p class="kern-body">Zeile 1</p>\n  <p class="kern-body">Zeile 2</p>\n</div>',
		},
	],
};

/* ---------- Alignment utilities ---------- */

const ALIGNMENT_SECTION: UtilitySection = {
	id: "alignment",
	titleDe: "Ausrichtung (Alignment)",
	titleEn: "Alignment",
	descriptionDe: "Ausrichtungs-Hilfsklassen für Grid-Zeilen und -Spalten.",
	descriptionEn: "Alignment utility classes for grid rows and columns.",
	entries: [
		{
			className: "kern-align-items-start",
			de: "Vertikale Ausrichtung: oben.",
			en: "Vertical alignment: top.",
		},
		{
			className: "kern-align-items-center",
			de: "Vertikale Ausrichtung: mittig.",
			en: "Vertical alignment: center.",
		},
		{
			className: "kern-align-items-end",
			de: "Vertikale Ausrichtung: unten.",
			en: "Vertical alignment: bottom.",
		},
		{
			className: "kern-justify-content-start",
			de: "Horizontale Ausrichtung: links.",
			en: "Horizontal alignment: start.",
		},
		{
			className: "kern-justify-content-center",
			de: "Horizontale Ausrichtung: mittig.",
			en: "Horizontal alignment: center.",
		},
		{
			className: "kern-justify-content-end",
			de: "Horizontale Ausrichtung: rechts.",
			en: "Horizontal alignment: end.",
		},
		{
			className: "kern-justify-content-around",
			de: "Gleichmäßiger Abstand um jede Spalte.",
			en: "Equal space around each column.",
		},
		{
			className: "kern-justify-content-between",
			de: "Maximaler Abstand zwischen den Spalten.",
			en: "Maximum space between columns.",
		},
		{
			className: "kern-justify-content-evenly",
			de: "Gleicher Abstand zwischen und um jede Spalte.",
			en: "Equal space between and around each column.",
		},
		{
			className: "kern-align-self-start",
			de: "Einzelne Spalte: oben ausrichten.",
			en: "Single column: align top.",
		},
		{
			className: "kern-align-self-center",
			de: "Einzelne Spalte: mittig ausrichten.",
			en: "Single column: align center.",
		},
		{
			className: "kern-align-self-end",
			de: "Einzelne Spalte: unten ausrichten.",
			en: "Single column: align bottom.",
		},
	],
};

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

const ALL_SECTIONS: UtilitySection[] = [
	FLEX_SECTION,
	CSS_GRID_SECTION,
	GAP_SECTION,
	SPACING_SECTION,
	SURFACE_SECTION,
	STACK_SECTION,
	ALIGNMENT_SECTION,
];

export type UtilityReferenceResult = {
	sections: UtilitySection[];
};

/**
 * Build the utility reference output, optionally filtered by category.
 */
export function buildUtilityReference(
	input: UtilityReferenceInput,
): UtilityReferenceResult {
	const params = UtilityReferenceSchema.parse(input);
	const category = params.category ?? "all";

	if (category === "all") {
		return { sections: ALL_SECTIONS };
	}

	const filtered = ALL_SECTIONS.filter((s) => s.id === category);
	return { sections: filtered };
}
