/**
 * The code-owned map between the knowledge bundle and this repo's tools
 * (docs/v2-migration/knowledge-bundle.md, decision 7). The bundle uses KERN's IDs
 * and never names our tools; this map is the only place the two meet.
 */

/** KERN IDs that don't become ours by dropping the hyphens. */
const RENAMED_KERN_IDS: Readonly<Record<string, string>> = {
	checkboxes: "checkbox",
	radios: "radio",
	list: "lists",
};

/**
 * Our component ID for a KERN ID: the KERN ID without hyphens (input-text is
 * inputtext), apart from a few renames. Tool names are get_<our id>.
 */
export function componentIdFromKernId(kernId: string): string {
	return Object.hasOwn(RENAMED_KERN_IDS, kernId)
		? RENAMED_KERN_IDS[kernId]
		: kernId.replaceAll("-", "");
}

/** One example in the bundle: the file it's in and its ID there. */
export type BundleExampleRef = {
	/** Relative to the bundle root, e.g. components/details.json. */
	document: string;
	example: string;
};

/**
 * Component tools without a component in the bundle, with the title their
 * registry entry gets. Their markup is a picked example (FALLBACK_EXAMPLES).
 */
export const TOOLS_WITHOUT_BUNDLE_COMPONENT: Readonly<Record<string, string>> =
	{
		layers: "Layers",
		pattern: "Pattern",
	};

/** A run of sections in a bundle document's docs, from one ID to another. */
export type BundleSectionRange = {
	/** Relative to the bundle root, e.g. foundations/utilities.json. */
	document: string;
	from: string;
	/** The last section of the run, included. */
	to: string;
};

/**
 * Component tools whose registry entry is a run of sections in a foundations
 * document, not the KERN component with the same ID, which leaves the registry.
 * get_grid renders the CSS Grid utilities (kern-grid), which replace KERN's
 * deprecated container grid (kern-row, kern-col-*), so its entry is the
 * utilities page's CSS Grid sections.
 */
export const TOOLS_FROM_SECTIONS = {
	grid: {
		title: "CSS Grid",
		document: "foundations/utilities.json",
		from: "css-grid",
		to: "dos-and-donts",
	},
} as const satisfies Record<string, BundleSectionRange & { title: string }>;

/**
 * The foundations pages the guides quote (kern://guides/{name}), by KERN's
 * ID. The registry carries their text; the guides pick sections by ID.
 */
export const GUIDE_FOUNDATIONS = [
	"accessibility",
	"form-inputs-overview",
	"layout",
	"layout-overview",
	"sizes-and-spacing",
	"utilities",
] as const;

/**
 * The example each fallback tool returns as its HTML, picked by hand: a rule
 * can't choose (it picks deprecated variants and the search field without a
 * label). layers and pattern aren't components in the bundle; their markup is
 * the Layers story in the utilities and the header pattern.
 */
export const FALLBACK_EXAMPLES = {
	details: { document: "components/details.json", example: "details" },
	layers: { document: "foundations/utilities.json", example: "stack" },
	pattern: { document: "patterns/header.json", example: "flex-header" },
	search: { document: "components/search.json", example: "search-with-label" },
} as const satisfies Record<string, BundleExampleRef>;
