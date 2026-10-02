import { z } from "zod";
import { contentBlocksSchema, simpleBlocksSchema } from "./content-union.js";
import {
	GridColumnsSchema,
	HeadingLevelSchema,
	McpCommonSchema,
} from "./foundations.js";

/**
 * What buildGrid parses. A grid block in render_composition can hold any block
 * in its columns, so this takes the full content union; the get_grid tool takes
 * GridToolSchema.
 */
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
		columnsContent: z.array(contentBlocksSchema("grid")).optional(),
	})
	.describe(
		"Parameter für KERN UX 12-Spalten-Grid (kern-container/kern-row/kern-col-{breakpoint}-{span}). " +
			"Breakpoints: xs (<576px), sm (>=576px), md (>=768px), lg (>=992px), xl (>=1200px), xxl (>=1600px). " +
			"Spalten müssen Teiler von 12 sein: 1, 2, 3, 4, 6, 12. Für 5 oder 7 gleich breite Spalten verwende get_grid nicht; nutze stattdessen CSS-Grid-Utilities über get_utility_reference (kern-grid-cols-{n}). " +
			"Dieses Tool bildet das mobile-first Container/Row/Column-Modell ab; für speziellere Offsets oder horizontale Verteilungen ist direkte Grid-Klassensteuerung außerhalb dieses Schemas sinnvoller.",
	);

/** The get_grid tool's input: simple blocks only (roadmap R5, option B). */
export const GridToolSchema = GridRenderSchema.extend({
	columnsContent: z
		.array(simpleBlocksSchema())
		.optional()
		.describe(
			"Optional content per column, one block list per column: text, html, badge or field blocks. For cards in a grid use get_card_group; for other containers in columns, use render_composition with a grid block.",
		),
	...McpCommonSchema.shape,
});

export type GridRenderInput = z.input<typeof GridRenderSchema>;
