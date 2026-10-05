import { type GridRenderInput, GridRenderSchema } from "../schemas/grid.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	renderChildBlocks,
	standaloneContext,
} from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";
import { STACK_CLASSES } from "./form.js";

/** Indents every line after the first by `indent`. */
const indentLines = (html: string, indent: string) =>
	html.replace(/\n/g, `\n${indent}`);

/**
 * The classes for `columns` equal columns from md up and one below. kern-grid
 * alone has 12 columns and no gap, so both are set.
 */
export function equalColumnsGridClasses(columns: number): string {
	return [
		"kern-grid",
		"kern-grid-cols-1",
		...(columns > 1 ? [`kern-grid-cols-${columns}-md`] : []),
		"kern-gap-lg",
	].join(" ");
}

/**
 * Equal-width columns on KERN's CSS Grid utilities: one column on small
 * screens, `columns` from md up.
 */
export function buildGrid(
	input: GridRenderInput,
	locale: Locale = "de",
	context: BlockContext = standaloneContext(locale),
): BuildResult {
	const params = GridRenderSchema.parse(input);
	const warnings: string[] = [];
	// Without a count, one column per content list.
	const columns = params.columns ?? (params.columnsContent?.length || 2);
	// Inside a container (render_page's main, another grid) the grid needs no
	// container of its own; a nested one would add its padding twice.
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

	if (
		Array.isArray(params.columnsContent) &&
		params.columnsContent.length > 0 &&
		params.columnsContent.length !== columns
	) {
		warnings.push(
			"columnsContent length does not match columns. Extra entries are ignored and missing entries render empty placeholders.",
		);
	}

	const gridClasses =
		equalColumnsGridClasses(columns) +
		(params.rowAlignment ? ` kern-align-items-${params.rowAlignment}` : "");

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

		return `    <div>\n      ${indentLines(contentHtml, "      ")}\n    </div>`;
	}).join("\n");

	const heading =
		params.includeHeading === true
			? `  <h${params.headingLevel} class="kern-heading-medium">${escapeHtml(params.headingText ?? "Abschnitt")}</h${params.headingLevel}>\n`
			: "";
	// KERN drops a container's padding when a kern-grid is its direct child
	// (.kern-container:has(> .kern-grid)), so the grid sits in a div of its own
	// and the content keeps the inset of the container around it. With a
	// heading, that div stacks the two with KERN's spacing.
	const wrapper = heading ? `<div class="${STACK_CLASSES}">` : "<div>";
	const block = `${wrapper}\n${heading}  <div class="${gridClasses}">\n${cols}\n  </div>\n</div>`;

	return {
		html: containerClass
			? `<div class="${containerClass}">\n  ${indentLines(block, "  ")}\n</div>`
			: block,
		warnings,
	};
}
