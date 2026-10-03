import manifest from "./registry.json" with { type: "json" };

/**
 * The kern-* classes KERN knows, from the knowledge bundle by way of
 * registry.json: the ones kern-ux-plain's SCSS defines and the ones KERN's own
 * examples use. A JSON import, like the registry's.
 */
const EXACT: ReadonlySet<string> = new Set(manifest.classes.exact);

/** Bases whose -sm, -md, -lg, -xl and -xxl variants are all known. */
const RESPONSIVE: ReadonlySet<string> = new Set(manifest.classes.responsive);

const BREAKPOINT_SUFFIX = /^(.*)-(?:sm|md|lg|xl|xxl)$/;

/** Whether KERN knows a kern-* class, e.g. kern-btn--primary or kern-flex-row-md. */
export function isKnownKernClass(name: string): boolean {
	if (EXACT.has(name)) return true;
	const base = BREAKPOINT_SUFFIX.exec(name)?.[1];
	return base !== undefined && RESPONSIVE.has(base);
}
