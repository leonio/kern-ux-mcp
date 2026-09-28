import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a table header cell
 */
export const tableHeaderSchema = z
	.object({
		/** Header text */
		text: z
			.string()
			.describe("Spaltenüberschrift (wird als <th scope='col'> gerendert)."),
		/** Whether this is a numeric column (right-aligned) */
		numeric: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"KERN UX: true für numerische/monetäre Spalten, damit Werte rechtsbündig ausgerichtet werden.",
			),
	})
	.describe("Definition einer Tabellenkopfzelle.");

/**
 * Schema for a table data cell
 */
export const tableCellSchema = z
	.object({
		/** Cell content (text or HTML if cellIsHtml is true) */
		content: z
			.string()
			.describe("Zelleninhalt als Text oder HTML (abhängig von isHtml)."),
		/** Whether content is raw HTML */
		isHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe("Wenn true wird content als HTML gerendert, sonst escaped."),
		/** Whether this is a numeric cell (right-aligned) */
		numeric: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Explizite Rechtsausrichtung dieser Zelle; wird zusätzlich automatisch von numeric-Headern abgeleitet.",
			),
	})
	.describe("Definition einer Tabellen-Datenzelle.");

/**
 * Schema for a table row
 */
export const tableRowSchema = z
	.object({
		/** Optional row header (first cell as <th scope="row">) */
		rowHeader: z
			.string()
			.optional()
			.describe("Optionale Zeilenüberschrift (<th scope='row'>)."),
		/** Array of cell values */
		cells: z
			.array(tableCellSchema)
			.describe("Zellen der Zeile in Spaltenreihenfolge."),
	})
	.describe("Definition einer Tabellenzeile.");

/**
 * Schema for the Table component
 */
export const tableSchema = z
	.object({
		...CommonParams,
		/** Optional table caption for accessibility */
		caption: z
			.string()
			.optional()
			.describe(
				'Optionale Tabellenbeschriftung als <caption class="kern-title">. Hilft laut KERN beim Auffinden, Verstehen und Navigieren der Tabelle.',
			),
		/** Column headers */
		headers: z
			.array(tableHeaderSchema)
			.min(1)
			.describe(
				'Spaltenkoepfe; mindestens eine Kopfzelle erforderlich. Scope="col" wird automatisch gesetzt.',
			),
		/** Data rows */
		rows: z
			.array(tableRowSchema)
			.describe(
				'Tabellenzeilen mit Zellen in Header-Reihenfolge. Optionale rowHeader-Werte werden als <th scope="row"> gerendert.',
			),
		/** Optional footer row */
		footer: z
			.array(tableCellSchema)
			.optional()
			.describe(
				"Optionale Footer-Zeile, z.B. fuer Summen oder Abschlusswerte. Der aktuelle Renderer bildet nur Datenzellen ab, keine speziellen Action-Footer-Muster.",
			),
		/** Table size variant */
		size: z
			.enum(["default", "small"])
			.optional()
			.default("default")
			.describe(
				"Tabellengroesse: default oder small. small rendert kern-table--small fuer kompaktere Tabellen.",
			),
		/** Enable striped row styling */
		striped: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Aktiviert kern-table--striped fuer alternierende Zeilenhintergruende und bessere Lesbarkeit.",
			),
		/** Wrap in responsive container for horizontal scrolling */
		responsive: z
			.boolean()
			.optional()
			.default(true)
			.describe(
				'Wrappt die Tabelle standardmaessig in einen horizontal scrollbaren Responsive-Container. Wenn eine caption vorhanden ist, wird der Wrapper als role="region" mit aria-labelledby zur caption beschriftet.',
			),
	})
	.describe(
		"Parameter fuer KERN UX Table-Komponente. Ausrichtungsregel: numerische und Waehrungs-Spalten als numeric markieren, damit sie rechtsbuendig erscheinen; Textspalten bleiben linksbuendig. " +
			"Diese MCP-Schnittstelle modelliert derzeit klassische Daten-Tabellen; die erweiterten Action-Column-Muster aus den KERN-Beispielen werden noch nicht als eigene Struktur abgebildet.",
	);

export type TableHeaderInput = z.input<typeof tableHeaderSchema>;
export type TableCellInput = z.input<typeof tableCellSchema>;
export type TableRowInput = z.input<typeof tableRowSchema>;
export type TableInput = z.input<typeof tableSchema>;
