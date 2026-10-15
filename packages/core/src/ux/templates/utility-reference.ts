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
		"CSS-Grid-Hilfsklassen für spaltenbasierte Layouts. kern-grid ersetzt das veraltete Container-Grid (kern-row, kern-col-md-*); beides nicht mischen.",
	descriptionEn:
		"CSS grid utility classes for column-based layouts. kern-grid replaces the deprecated container grid (kern-row, kern-col-md-*); don't mix the two.",
	entries: [
		{
			className: "kern-grid",
			de: "Aktiviert CSS Grid, mit 12 Spalten und ohne Abstand: Spaltenzahl und kern-gap-* immer angeben. Nicht als direktes Kind von kern-container: KERN nimmt dem Container dann das Padding.",
			en: "Activates CSS grid, with 12 columns and no gap: always set the column count and kern-gap-*. Not as a direct child of kern-container: KERN then removes the container's padding.",
			example:
				'<div class="kern-grid kern-grid-cols-1 kern-grid-cols-3-md kern-gap-lg">\n  <div>A</div>\n  <div>B</div>\n  <div>C</div>\n</div>',
		},
		{
			className: "kern-grid-cols-{1–12}[-{breakpoint}]",
			de: "Anzahl gleich breiter Spalten (1–12). kern-grid-cols-1 kern-grid-cols-3-md: eine Spalte auf kleinen Bildschirmen, drei ab md.",
			en: "Number of equal columns (1–12). kern-grid-cols-1 kern-grid-cols-3-md: one column on small screens, three from md.",
		},
		{
			className: "kern-col-{1–12}[-{breakpoint}]",
			de: "Element über N Spalten spannen. Beispiel: kern-col-8-md.",
			en: "Span an element across N columns. Example: kern-col-8-md.",
			example:
				'<div class="kern-grid kern-grid-cols-1 kern-grid-cols-12-md kern-gap-lg">\n  <div class="kern-col-8-md">Breit</div>\n  <div class="kern-col-4-md">Schmal</div>\n</div>',
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
		"KERN UX hat keine kern-bg-*-Klassen. Einen Hintergrund bekommt ein Bereich über kern-layer " +
		"zusammen mit einer Ebene: kern-level-1 oder kern-level-2; kern-level-0 ist die Seite. " +
		"Die Ebene stellt auch die kontextuellen Farben ihres Inhalts um, sodass Rahmen, Oberflächen und Text ihren Kontrast behalten. " +
		"In eigenem CSS die kontextuellen Variablen statt fester Farben verwenden.",
	descriptionEn:
		"KERN UX has no kern-bg-* classes. A region gets its background from kern-layer " +
		"together with a level: kern-level-1 or kern-level-2; kern-level-0 is the page. " +
		"The level also switches the contextual colours of its content, so borders, surfaces and text keep their contrast. " +
		"In custom CSS, use the contextual variables instead of fixed colours.",
	entries: [
		{
			className: "kern-layer",
			de: "Gibt dem Element den Hintergrund seiner Ebene. Nur zusammen mit einer kern-level-*-Klasse.",
			en: "Gives the element the background of its level. Use it only together with a kern-level-* class.",
			example: '<section class="kern-layer kern-level-1">…</section>',
		},
		{
			className: "kern-level-0",
			de: "Ebene 0: die Seite selbst (weiß im hellen Theme).",
			en: "Level 0: the page itself (white in the light theme).",
		},
		{
			className: "kern-level-1",
			de: "Ebene 1: ein Bereich, der sich von der Seite abhebt (hellgrau im hellen Theme).",
			en: "Level 1: a region that stands out from the page (light grey in the light theme).",
			example: '<div class="kern-layer kern-level-1">…</div>',
		},
		{
			className: "kern-level-2",
			de: "Ebene 2: ein Element in Ebene 1, das sich weiter abhebt (weiß im hellen Theme).",
			en: "Level 2: an element inside level 1 that stands out further (white in the light theme).",
			example:
				'<div class="kern-layer kern-level-1"><div class="kern-layer kern-level-2">…</div></div>',
		},
		{
			className: "--kern-color-layout-background-default-contextual",
			de: "CSS-Variable: der Hintergrund der aktuellen Ebene, für eigenes CSS.",
			en: "CSS variable: the background of the current level, for custom CSS.",
			example:
				'<div style="background-color: var(--kern-color-layout-background-default-contextual)">…</div>',
		},
		{
			className: "--kern-color-layout-layer-surface-contextual",
			de: "CSS-Variable: die Oberfläche einer Komponente auf der aktuellen Ebene, wie bei Karten und Eingabefeldern.",
			en: "CSS variable: the surface of a component on the current level, as cards and inputs use.",
		},
		{
			className: "--kern-color-feedback-info-background-contextual",
			de: "CSS-Variable: Hintergrund für Info-Hinweise, wie bei Alerts.",
			en: "CSS variable: background for info messages, as alerts use.",
		},
		{
			className: "--kern-color-feedback-success-background-contextual",
			de: "CSS-Variable: Hintergrund für Erfolgsmeldungen.",
			en: "CSS variable: background for success messages.",
		},
		{
			className: "--kern-color-feedback-warning-background-contextual",
			de: "CSS-Variable: Hintergrund für Warnungen.",
			en: "CSS variable: background for warnings.",
		},
		{
			className: "--kern-color-feedback-danger-background-contextual",
			de: "CSS-Variable: Hintergrund für Fehlermeldungen.",
			en: "CSS variable: background for error messages.",
		},
		{
			className: "--kern-color-decorative-brand-contextual",
			de: "CSS-Variable: die Markenfarbe für Schmuckelemente wie Formen oder Linien. Nicht als Hintergrund für Text, denn sie muss keinen Kontrast einhalten.",
			en: "CSS variable: the brand colour for ornament such as shapes or lines. Not a background for text, since it need not meet contrast requirements.",
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
