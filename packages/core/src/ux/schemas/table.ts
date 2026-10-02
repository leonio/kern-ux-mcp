import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a table header cell
 */
export const tableHeaderSchema = z.object({
	/** Header text */
	text: z.string().describe('Column heading, rendered as <th scope="col">.'),
	/** Whether this is a numeric column (right-aligned) */
	numeric: z
		.boolean()
		.optional()
		.default(false)
		.describe("A numeric or currency column: its cells are right-aligned."),
});

/**
 * Schema for a table data cell
 */
export const tableCellSchema = z.object({
	/** Cell content (text or HTML if cellIsHtml is true) */
	content: z.string().describe("Cell content."),
	/** Whether content is raw HTML */
	isHtml: z
		.boolean()
		.optional()
		.default(false)
		.describe("Treat content as trusted HTML instead of escaping it."),
	/** Whether this is a numeric cell (right-aligned) */
	numeric: z
		.boolean()
		.optional()
		.default(false)
		.describe("Right-aligns this cell; a numeric column does it for you."),
});

/**
 * Schema for a table row
 */
export const tableRowSchema = z.object({
	/** Optional row header (first cell as <th scope="row">) */
	rowHeader: z
		.string()
		.optional()
		.describe('Row heading, rendered as <th scope="row">.'),
	/** Array of cell values */
	cells: z.array(tableCellSchema).describe("The cells, in column order."),
});

/**
 * Schema for the Table component
 */
export const tableSchema = z.object({
	...CommonParams,
	/** Optional table caption for accessibility */
	caption: z
		.string()
		.optional()
		.describe(
			'Caption (<caption class="kern-title">); it helps users find and understand the table.',
		),
	/** Column headers */
	headers: z
		.array(tableHeaderSchema)
		.min(1)
		.describe("Column headings, at least one."),
	/** Data rows */
	rows: z.array(tableRowSchema).describe("The rows."),
	/** Optional footer row */
	footer: z
		.array(tableCellSchema)
		.optional()
		.describe("A footer row of data cells, e.g. totals."),
	/** Table size variant */
	size: z
		.enum(["default", "small"])
		.optional()
		.default("default")
		.describe("small renders the compact kern-table--small."),
	/** Enable striped row styling */
	striped: z
		.boolean()
		.optional()
		.default(false)
		.describe("Alternating row backgrounds (kern-table--striped)."),
	/** Wrap in responsive container for horizontal scrolling */
	responsive: z
		.boolean()
		.optional()
		.default(true)
		.describe(
			'Wraps the table in a horizontally scrolling container; with a caption, it becomes a role="region" labelled by the caption.',
		),
});

export type TableHeaderInput = z.input<typeof tableHeaderSchema>;
export type TableCellInput = z.input<typeof tableCellSchema>;
export type TableRowInput = z.input<typeof tableRowSchema>;
export type TableInput = z.input<typeof tableSchema>;
