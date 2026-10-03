/**
 * The code-owned map between the knowledge bundle and this repo's tools
 * (docs/plan-v2/knowledge-bundle.md, decision 7). The bundle uses KERN's IDs
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
