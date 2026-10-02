import { type GridRenderInput, GridRenderSchema } from "../schemas/grid.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	renderChildBlocks,
	standaloneContext,
} from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";

export function buildGrid(
	input: GridRenderInput,
	locale: Locale = "de",
	context: BlockContext = standaloneContext(locale),
): BuildResult {
	const params = GridRenderSchema.parse(input);
	const warnings: string[] = [];
	// A divisor of 12: the schema rejects other counts with a hint that points at
	// the CSS Grid utilities (kern-grid-cols-{n}).
	const columns = params.columns;
	// Inside a container (render_page's main, another grid) a row needs no container
	// of its own; a nested one would add its padding twice.
	const containerClass = context.inContainer
		? undefined
		: params.containerFluid
			? "kern-container-fluid"
			: "kern-container";
	if (context.inContainer && params.containerFluid) {
		warnings.push(
			"containerFluid is ignored: this grid already sits inside a container.",
		);
	}
	const rowAlignmentClass = params.rowAlignment
		? ` kern-align-items-${params.rowAlignment}`
		: "";
	const heading =
		params.includeHeading === true
			? `<h${params.headingLevel} class="kern-heading-medium">${escapeHtml(params.headingText ?? "Abschnitt")}</h${params.headingLevel}>\n`
			: "";

	// 12-column system: kern-col-md-{span} for desktop, kern-col-sm-12 for mobile stacking.
	const colClass = `kern-col-md-${12 / columns} kern-col-sm-12`;

	if (
		Array.isArray(params.columnsContent) &&
		params.columnsContent.length > 0 &&
		params.columnsContent.length !== columns
	) {
		warnings.push(
			"columnsContent length does not match columns. Extra entries are ignored and missing entries render empty placeholders.",
		);
	}

	const cols = Array.from({ length: columns }, (_, index) => {
		const columnBlocks = params.columnsContent?.[index];
		let contentHtml = `<p class="kern-body">Spalte ${index + 1}</p>`;

		if (columnBlocks && columnBlocks.length > 0) {
			const nested = renderChildBlocks(context, columnBlocks, {
				inContainer: true,
			});

			if (nested.html) {
				contentHtml = nested.html;
			}
			warnings.push(...nested.warnings);
		}

		return `    <div class="${colClass}">\n      ${contentHtml.replace(/\n/g, "\n      ")}\n    </div>`;
	}).join("\n");

	return {
		html: `<div${containerClass ? ` class="${containerClass}"` : ""}>\n  ${heading}<div class="kern-row${rowAlignmentClass}">\n${cols}\n  </div>\n</div>`,
		warnings,
	};
}
