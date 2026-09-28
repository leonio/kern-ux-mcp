import { MAX_RECURSIVE_CONTENT_DEPTH } from "../schemas/content-union.js";
import { type GridRenderInput, GridRenderSchema } from "../schemas/grid.js";
import type { BuildResult, Locale } from "../types.js";
import { buildCard } from "./card.js";
import type {
	DisclosureNodeRenderer,
	SectionNodeRenderer,
} from "./content-union.js";
import { renderRecursiveContentBlocks } from "./content-union.js";

type GridRenderContext = {
	depth: number;
	maxDepth: number;
	renderSectionNode?: SectionNodeRenderer;
	renderDisclosureNode?: DisclosureNodeRenderer;
};

const DEFAULT_GRID_RENDER_CONTEXT: GridRenderContext = {
	depth: 1,
	maxDepth: MAX_RECURSIVE_CONTENT_DEPTH,
};

export function buildGrid(
	input: GridRenderInput,
	locale: Locale = "de",
	context: GridRenderContext = DEFAULT_GRID_RENDER_CONTEXT,
): BuildResult {
	const params = GridRenderSchema.parse(input);
	const warnings: string[] = [];
	const inferredColumnsFromContent =
		Array.isArray(params.columnsContent) && params.columnsContent.length > 0
			? params.columnsContent.length
			: undefined;
	const columns = params.columns ?? inferredColumnsFromContent ?? 2;
	const containerClass = params.containerFluid
		? "kern-container-fluid"
		: "kern-container";
	const rowAlignmentClass = params.rowAlignment
		? ` kern-align-items-${params.rowAlignment}`
		: "";
	const heading =
		params.includeHeading === true
			? `<h${params.headingLevel} class="kern-heading-medium">${params.headingText ?? "Abschnitt"}</h${params.headingLevel}>\n`
			: "";

	// 12-column system: kern-col-md-{span} for desktop, kern-col-sm-12 for mobile stacking.
	// Formula: 12 / columns → column span.
	const colSpan = Math.floor(12 / columns);
	const colClass = `kern-col-md-${colSpan} kern-col-sm-12`;

	if (12 % columns !== 0) {
		warnings.push(
			`Requested ${columns} equal columns cannot be represented evenly in the 12-column system. This output uses kern-col-md-${colSpan} as an approximation. For true equal-width ${columns}-column layouts (for example logo rows), use CSS Grid utilities: kern-grid kern-grid-cols-${columns}. See get_utility_reference.`,
		);
	}

	if (
		Array.isArray(params.columnsContent) &&
		params.columnsContent.length > 0 &&
		params.columns !== undefined &&
		params.columnsContent.length !== params.columns
	) {
		warnings.push(
			"columnsContent length does not match columns. Extra entries are ignored and missing entries render empty placeholders.",
		);
	}

	const cols = Array.from({ length: columns }, (_, index) => {
		const columnBlocks = params.columnsContent?.[index];
		let contentHtml = `<p class="kern-body">Spalte ${index + 1}</p>`;

		if (columnBlocks && columnBlocks.length > 0) {
			const nested = renderRecursiveContentBlocks(columnBlocks, {
				locale,
				currentDepth: context.depth,
				maxDepth: context.maxDepth,
				renderCardNode: (cardInput, nextDepth) =>
					buildCard(cardInput as Parameters<typeof buildCard>[0], locale, {
						depth: nextDepth,
						maxDepth: context.maxDepth,
						renderSectionNode: context.renderSectionNode,
						renderDisclosureNode: context.renderDisclosureNode,
					}),
				renderGridNode: (gridInput, nextDepth) =>
					buildGrid(gridInput as GridRenderInput, locale, {
						depth: nextDepth,
						maxDepth: context.maxDepth,
					}),
				renderSectionNode: context.renderSectionNode,
				renderDisclosureNode: context.renderDisclosureNode,
			});

			if (nested.html) {
				contentHtml = nested.html;
			}
			warnings.push(...nested.warnings);
		}

		return `    <div class="${colClass}">\n      ${contentHtml.replace(/\n/g, "\n      ")}\n    </div>`;
	}).join("\n");

	warnings.push(
		"KERN UX has two layout systems: (1) 12-column grid (kern-col-{breakpoint}-{span}, e.g. kern-col-md-4 kern-col-sm-12) for page layouts and card grids, and (2) CSS Grid utilities (kern-grid-cols-{n}) for simpler equal-width layouts. This tool uses the 12-column system.",
	);

	return {
		html: `<div class="${containerClass}">\n  ${heading}<div class="kern-row${rowAlignmentClass}">\n${cols}\n  </div>\n</div>`,
		warnings,
	};
}
