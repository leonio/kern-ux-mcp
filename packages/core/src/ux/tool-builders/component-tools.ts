import type { Registry } from "../types.js";

/**
 * How a component's get_<id> tool is built:
 * - interactive: its own schema and template (interactive.ts)
 * - layout, typography: the foundational builders (layout.ts, typography.ts)
 * - fallback: the registry's canonical HTML, with only locale and strict as input
 */
export type ComponentToolStrategy =
	| "interactive"
	| "layout"
	| "typography"
	| "fallback";

/**
 * The components that get a get_<id> tool, and how each is built. Code owns this
 * list, not the registry: a regenerated registry.json can't add or remove tools.
 * A registry component missing here has no tool; get_component_docs still
 * documents it. The tools read their title, status and canonical HTML from the
 * registry, so every entry must be there (assertComponentToolsInRegistry).
 */
const COMPONENT_TOOLS = {
	accordion: "interactive",
	alert: "interactive",
	badge: "interactive",
	body: "typography",
	button: "interactive",
	card: "interactive",
	checkbox: "interactive",
	descriptionlist: "layout",
	details: "fallback",
	dialog: "interactive",
	divider: "layout",
	dropdown: "interactive",
	fieldset: "layout",
	grid: "layout",
	heading: "typography",
	icon: "interactive",
	inputdate: "interactive",
	inputemail: "interactive",
	inputfile: "interactive",
	inputgroup: "interactive",
	inputnumber: "interactive",
	inputpassword: "interactive",
	inputtel: "interactive",
	inputtext: "interactive",
	inputurl: "interactive",
	kopfzeile: "layout",
	label: "typography",
	layers: "fallback",
	link: "typography",
	lists: "typography",
	loader: "interactive",
	pattern: "fallback",
	preline: "typography",
	progress: "interactive",
	radio: "interactive",
	search: "fallback",
	select: "interactive",
	subline: "typography",
	summary: "interactive",
	table: "interactive",
	tasklist: "interactive",
	textarea: "interactive",
	title: "typography",
} as const satisfies Record<string, ComponentToolStrategy>;

/** The IDs of every component with a tool. */
export const COMPONENT_TOOL_IDS: readonly string[] = Object.freeze(
	Object.keys(COMPONENT_TOOLS),
);

/** How the component's tool is built, or undefined when it has no tool. */
export function getComponentToolStrategy(
	componentId: string,
): ComponentToolStrategy | undefined {
	return Object.hasOwn(COMPONENT_TOOLS, componentId)
		? COMPONENT_TOOLS[componentId as keyof typeof COMPONENT_TOOLS]
		: undefined;
}

/** The category list_components_by_category reports for a tool's component. */
export function getComponentToolCategory(
	strategy: ComponentToolStrategy,
): "foundational" | "interactive" {
	return strategy === "layout" || strategy === "typography"
		? "foundational"
		: "interactive";
}

/** Fails when the registry lacks a component that has a tool. */
export function assertComponentToolsInRegistry(registry: Registry) {
	const missing = COMPONENT_TOOL_IDS.filter((id) => !registry.byId.has(id));
	if (missing.length > 0) {
		throw new Error(
			`registry.json has no entry for ${missing.join(", ")}. Each get_<id> tool reads its title, status and canonical HTML from the registry.`,
		);
	}
}
