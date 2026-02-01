import { z } from "zod";
import { RecursiveContentBlocksSchema } from "./content-union.js";
import {
	GridColumnsSchema,
	HeadingLevelSchema,
	McpCommonSchema,
} from "./foundations.js";

export const GridRenderSchema = z
	.object({
		columns: GridColumnsSchema.optional()
			.default(2)
			.describe(
				"Anzahl gleich breiter Spalten im 12-Spalten-Grid. Erlaubt sind nur 1, 2, 3, 4, 6 und 12, damit jede Spalte sauber in das KERN Raster passt.",
			),
		containerFluid: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true: kern-container-fluid statt kern-container. Nur für Layouts verwenden, die bewusst über die gesamte Viewport-Breite laufen sollen, z.B. Banner oder Hintergrundflächen.",
			),
		rowAlignment: z
			.enum(["start", "center", "end"])
			.optional()
			.describe(
				"Vertikale Ausrichtung der Spalten innerhalb der kern-row über kern-align-items-{start|center|end}.",
			),
		includeHeading: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true wird oberhalb des Grids eine Abschnittsüberschrift ausgegeben.",
			),
		headingText: z
			.string()
			.optional()
			.describe(
				"Optionaler Überschriftentext für das Grid, wenn includeHeading=true gesetzt ist.",
			),
		headingLevel: HeadingLevelSchema.optional()
			.default(2)
			.describe(
				"Heading-Ebene der optionalen Grid-Überschrift (h1-h6). Hierarchisch ohne Sprünge verwenden.",
			),
		columnsContent: z
			.array(RecursiveContentBlocksSchema)
			.optional()
			.describe(
				"Optionale Inhalte pro Spalte. Jede Spalte ist ein rekursiver Content-Block-Array und erlaubt z.B. Cards in Grid-Spalten. " +
					"Für Side-by-Side-Layouts musst du mehrere Zellen definieren: Für zwei gleich breite Komponenten setze columns=2 (ergibt zwei kern-col-md-6-Zellen) und platziere je Komponente in eine eigene Zelle. " +
					"Mehrere große Komponenten (z.B. mehrere Cards) in derselben Zelle werden vertikal untereinander gerendert. Zu viele verschachtelte Rows/Container vermeiden; das Grid soll die Struktur vereinfachen, nicht verkomplizieren.",
			),
	})
	.describe(
		"Parameter für KERN UX 12-Spalten-Grid (kern-container/kern-row/kern-col-{breakpoint}-{span}). " +
			"Breakpoints: xs (<576px), sm (>=576px), md (>=768px), lg (>=992px), xl (>=1200px), xxl (>=1600px). " +
			"Spalten müssen Teiler von 12 sein: 1, 2, 3, 4, 6, 12. Für 5 oder 7 gleich breite Spalten verwende get_grid nicht; nutze stattdessen CSS-Grid-Utilities über get_utility_reference (kern-grid-cols-{n}). " +
			"Dieses Tool bildet das mobile-first Container/Row/Column-Modell ab; für speziellere Offsets oder horizontale Verteilungen ist direkte Grid-Klassensteuerung außerhalb dieses Schemas sinnvoller.",
	);

export const GridToolSchema = GridRenderSchema.merge(McpCommonSchema);

export type GridRenderInput = z.input<typeof GridRenderSchema>;
