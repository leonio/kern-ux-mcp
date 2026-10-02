/**
 * The context budget of tools/list (roadmap R5, finding 19). What reaches the
 * model is each tool's name, description and inputSchema; outputSchema is
 * measured separately and not counted, since most clients don't pass it on.
 * Sizes are characters of compact JSON.
 */
export const LISTING_BUDGET = {
	/**
	 * Ceiling for the model-facing total. It's a ratchet: the budget test also
	 * fails when the total falls more than `slack` below it, so each saving lowers
	 * the ceiling, down to `target`. There it stops: the room below is kept for
	 * registry summaries and later changes.
	 */
	modelFacing: 120_000,
	/** Where R5 ends for the full toolset. About 7K of it is kept for registry summaries. */
	target: 120_000,
	slack: 2_000,
} as const;

type ListedTool = {
	name: string;
	description: string;
	inputSchema: unknown;
	outputSchema?: unknown;
};

export type ToolListingSize = {
	name: string;
	/** name + description + inputSchema, as compact JSON */
	modelFacing: number;
	description: number;
	inputSchema: number;
	outputSchema: number;
};

export type ListingMeasurement = {
	/** Largest first */
	tools: ToolListingSize[];
	modelFacing: number;
	outputSchema: number;
};

export function measureListing(
	tools: ReadonlyArray<ListedTool>,
): ListingMeasurement {
	const sizes = tools
		.map((tool) => ({
			name: tool.name,
			modelFacing: JSON.stringify({
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
			}).length,
			description: tool.description.length,
			inputSchema: JSON.stringify(tool.inputSchema).length,
			outputSchema: tool.outputSchema
				? JSON.stringify(tool.outputSchema).length
				: 0,
		}))
		.sort(
			(a, b) => b.modelFacing - a.modelFacing || a.name.localeCompare(b.name),
		);

	return {
		tools: sizes,
		modelFacing: sizes.reduce((sum, tool) => sum + tool.modelFacing, 0),
		outputSchema: sizes.reduce((sum, tool) => sum + tool.outputSchema, 0),
	};
}

/** A plain-text table of the largest tools, with the totals and the budget. */
export function formatListingSizes(
	measurement: ListingMeasurement,
	limit = measurement.tools.length,
): string {
	const n = (value: number) => value.toLocaleString("en-US");
	const rows = measurement.tools
		.slice(0, limit)
		.map(
			(tool) =>
				`  ${tool.name.padEnd(28)}${n(tool.modelFacing).padStart(8)}${n(tool.description).padStart(13)}${n(tool.inputSchema).padStart(13)}`,
		);
	return [
		`tools/list, model-facing (name, description, inputSchema; compact JSON): ${n(measurement.modelFacing)} characters in ${measurement.tools.length} tools`,
		`  budget ${n(LISTING_BUDGET.modelFacing)}, R5 target ${n(LISTING_BUDGET.target)}; outputSchema, not counted: ${n(measurement.outputSchema)}`,
		`  ${"tool".padEnd(28)}${"total".padStart(8)}${"description".padStart(13)}${"inputSchema".padStart(13)}`,
		...rows,
	].join("\n");
}
