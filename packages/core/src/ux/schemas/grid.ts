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
export const GridRenderSchema = z.object({
	columns: GridColumnsSchema.optional().describe(
		"Equal-width columns, 1 to 12; one column on small screens. Default: one per columnsContent list, or 2.",
	),
	containerFluid: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"kern-container-fluid instead of kern-container: the full viewport width, e.g. for a banner.",
		),
	rowAlignment: z
		.enum(["start", "center", "end"])
		.optional()
		.describe("Vertical alignment of the columns (kern-align-items-*)."),
	includeHeading: z
		.boolean()
		.optional()
		.default(false)
		.describe("Adds a heading above the grid."),
	headingText: z
		.string()
		.optional()
		.describe("Text of the heading, with includeHeading: true."),
	headingLevel: HeadingLevelSchema.optional()
		.default(2)
		.describe("Level of the heading, h1 to h6. Don't skip levels."),
	columnsContent: z.array(contentBlocksSchema("grid")).max(12).optional(),
});

/** The get_grid tool's input: simple blocks only (roadmap R5, option B). */
export const GridToolSchema = GridRenderSchema.extend({
	columnsContent: z
		.array(simpleBlocksSchema())
		.max(12)
		.optional()
		.describe(
			"Optional content per column, one block list per column: text, html, badge or field blocks. For cards in a grid use get_card_group; for other containers in columns, use render_composition with a grid block.",
		),
	...McpCommonSchema.shape,
});

export type GridRenderInput = z.input<typeof GridRenderSchema>;
