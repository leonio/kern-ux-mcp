import { z } from "zod";
import { isValidIconName } from "../types.js";

export const McpCommonSchema = z.object({
	locale: z
		.enum(["de", "en"])
		.optional()
		.describe("Sprache für Beschriftungen und Fehlermeldungen (Standard: de)."),
	strict: z
		.boolean()
		.optional()
		.describe(
			"Wenn true: Validierungsfehler blockieren die HTML-Ausgabe (BITV-strikt).",
		),
});

export const FormFieldBaseSchema = z.object({
	label: z
		.string()
		.optional()
		.describe(
			"Sichtbare Feldbeschriftung. Kurz, präzise und möglichst einzeilig formulieren; kein Ersatz durch Placeholder.",
		),
	hint: z
		.string()
		.optional()
		.describe(
			"Optionaler Hinweistext unterhalb des Feldes. Für hilfreichen Kontext oder Formatbeispiele, möglichst als kurzer ganzer Satz ohne Links; wird per aria-describedby mit dem Feld verknüpft.",
		),
	error: z
		.string()
		.optional()
		.describe(
			"Konstruktive, konkrete Fehlermeldung pro Fehlerzustand. Ein leerer String aktiviert nur den Fehlerstil ohne sichtbaren Text.",
		),
	optional: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Zeigt den Optional-Marker am Label an. KERN bevorzugt wenige optionale Felder statt viele Pflicht-Markierungen.",
		),
	disabled: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Deaktiviert das Feld (nicht fokussierbar, nicht submit-bar). Nach KERN möglichst vermeiden; wenn ein Feld nicht gebraucht wird, eher ausblenden oder mit aria-disabled gesondert steuern.",
		),
	readonly: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Feld ist schreibgeschützt (fokussierbar, aber nicht editierbar). Nur nutzen, wenn der gespeicherte Wert für Nutzende weiterhin sinnvoll einsehbar sein soll.",
		),
});

export const LabeledFormFieldBaseSchema = FormFieldBaseSchema.extend({
	label: z
		.string()
		.min(1)
		.describe(
			"Pflicht-Beschriftung des Feldes für barrierefreie Formulare. Kurz, präzise und möglichst einzeilig formulieren.",
		),
});

export const BreakpointSchema = z
	.enum(["xs", "sm", "md", "lg", "xl", "xxl"])
	.describe(
		"KERN UX Breakpoints (Mobile First): xs<576px, sm>=576px, md>=768px, lg>=992px, xl>=1200px, xxl>=1600px. " +
			"Typische Grid-Klassen: kern-col-sm-*, kern-col-md-*, kern-col-lg-* usw.",
	);

export const GridColumnsSchema = z
	.union([
		z.literal(1),
		z.literal(2),
		z.literal(3),
		z.literal(4),
		z.literal(6),
		z.literal(12),
	])
	.describe(
		"Spaltenanzahl im 12-Spalten-Grid. Gültig sind 1, 2, 3, 4, 6, 12, damit 12 / columns eine ganze Zahl ergibt. " +
			"Für mobile Darstellung wird typischerweise kern-col-sm-12 zum Stapeln verwendet.",
	);

export const SpacingTokenSchema = z
	.enum(["none", "xxs", "xs", "sm", "md", "lg", "xl"])
	.describe(
		"KERN UX Space-Token: none=0px, xxs=2px, xs=4px, sm=8px, md=16px, lg=24px, xl=32px. " +
			"Nutze diese Token für margin/padding/gap statt freier Pixelwerte.",
	);

export const HeadingLevelSchema = z
	.union([
		z.literal(1),
		z.literal(2),
		z.literal(3),
		z.literal(4),
		z.literal(5),
		z.literal(6),
	])
	.describe(
		"HTML-Überschriftenebene von h1 bis h6. Hierarchisch ohne Sprünge verwenden.",
	);

export const ComponentSizeSchema = z
	.enum(["default", "small", "large"])
	.describe(
		"Komponentengröße: default, small oder large (entsprechend KERN Space-Token).",
	);

export const IconRefSchema = z
	.object({
		name: z
			.string()
			.refine((val) => isValidIconName(val), {
				message: "Invalid icon name. Use list_icons for allowed names.",
			})
			.describe(
				"Icon-Name aus dem KERN-Iconset. Bei Unsicherheit zuerst list_icons aufrufen.",
			),
		position: z
			.enum(["left", "right"])
			.optional()
			.default("left")
			.describe("Icon-Position relativ zum Label."),
	})
	.describe("Icon-Referenz mit Namen und optionaler Position.");
