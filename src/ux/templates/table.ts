import {
	type TableCellInput,
	type TableHeaderInput,
	type TableInput,
	type TableRowInput,
	tableSchema,
} from "../schemas/table.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Build a table header cell
 */
function buildHeaderCell(header: TableHeaderInput, isRowScope = false): string {
	const scope = isRowScope ? 'scope="row"' : 'scope="col"';
	const numericClass = header.numeric ? " kern-table__header--numeric" : "";
	return `<th ${scope} class="kern-table__header${numericClass}">${escapeHtml(header.text)}</th>`;
}

/**
 * Build a table data cell
 */
function buildDataCell(
	cell: TableCellInput,
	numericOverride?: boolean,
): string {
	const isNumeric = numericOverride === true || cell.numeric === true;
	const numericClass = isNumeric ? " kern-table__cell--numeric" : "";
	const content = cell.isHtml ? cell.content : escapeHtml(cell.content);
	return `<td class="kern-table__cell${numericClass}">${content}</td>`;
}

/**
 * Build HTML for a KERN UX Table component
 */
export function buildTable(input: TableInput, _locale: Locale): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = tableSchema.parse(input);

	const { caption, headers, rows, footer, size, striped, responsive } = params;

	// Build table classes
	const tableClasses = ["kern-table"];
	if (size === "small") {
		tableClasses.push("kern-table--small");
	}
	if (striped) {
		tableClasses.push("kern-table--striped");
	}

	// Build caption
	const captionId = caption && responsive ? "kern-table-caption" : undefined;
	const captionHtml = caption
		? `\n  <caption class="kern-title"${captionId ? ` id="${captionId}"` : ""}>${escapeHtml(caption)}</caption>`
		: "";

	// Build header row
	const headerCells = headers.map((h) => buildHeaderCell(h)).join("\n        ");
	const theadHtml = `
  <thead class="kern-table__head">
    <tr class="kern-table__row">
        ${headerCells}
    </tr>
  </thead>`;

	// Build body rows
	const bodyRows = rows
		.map((row: TableRowInput) => {
			const cells: string[] = [];
			const rowHasHeaderOffset =
				row.rowHeader !== undefined && headers.length === row.cells.length + 1;

			// Add row header if present
			if (row.rowHeader !== undefined) {
				cells.push(
					`<th scope="row" class="kern-table__header">${escapeHtml(row.rowHeader)}</th>`,
				);
			}

			// Add data cells
			row.cells.forEach((cell: TableCellInput, index) => {
				const headerIndex = rowHasHeaderOffset ? index + 1 : index;
				const headerNumeric = headers[headerIndex]?.numeric === true;
				cells.push(buildDataCell(cell, headerNumeric));
			});

			return `    <tr class="kern-table__row">
        ${cells.join("\n        ")}
    </tr>`;
		})
		.join("\n");

	const tbodyHtml = `
  <tbody class="kern-table__body">
${bodyRows}
  </tbody>`;

	// Build footer if present
	let tfootHtml = "";
	if (footer && footer.length > 0) {
		const footerCells = footer
			.map((cell: TableCellInput, index) => {
				const headerNumeric = headers[index]?.numeric === true;
				return buildDataCell(cell, headerNumeric);
			})
			.join("\n        ");
		tfootHtml = `
  <tfoot class="kern-table__footer">
    <tr class="kern-table__row">
        ${footerCells}
    </tr>
  </tfoot>`;
	}

	// Assemble table
	const tableHtml = `<table class="${tableClasses.join(" ")}">${captionHtml}${theadHtml}${tbodyHtml}${tfootHtml}
</table>`;

	// Wrap in responsive container if requested
	const html = responsive
		? `<div class="kern-table-responsive" tabindex="0"${captionId ? ` role="region" aria-labelledby="${captionId}"` : ""}>\n  ${tableHtml.replace(/\n/g, "\n  ")}\n</div>`
		: tableHtml;

	return { html, warnings };
}
