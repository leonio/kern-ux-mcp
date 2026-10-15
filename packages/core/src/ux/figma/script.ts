import { FIGMA_KIT } from "./kit.js";
import type { FigmaPlan, PlanNode } from "./plan.js";
import { FIGMA_RUNTIME } from "./runtime.js";

/** What stands in KEYS until the assistant fills in a component's key. */
export const KEY_PLACEHOLDER = "";

/** The most code use_figma takes in one call. */
export const USE_FIGMA_MAX_LENGTH = 50_000;

/** The runtime as the script carries it: without comments and indentation. */
const RUNTIME = FIGMA_RUNTIME.split("\n")
	.map((line) => line.trim())
	.filter((line) => line !== "" && !line.startsWith("//"))
	.join("\n");

/**
 * The code for Figma's use_figma: KEYS to fill in (each kit component's key,
 * from search_design_system), the plan, and the runtime that builds it. A
 * plan too big for one call is split into parts that run in order: the first
 * builds the screen and the frames too big to send whole, without their
 * content; the later ones fill those frames in.
 */
export function figmaScripts(
	plan: FigmaPlan,
	components: readonly string[],
	maxLength = USE_FIGMA_MAX_LENGTH,
): string[] {
	const whole = script(plan, components);
	if (whole.length <= maxLength) return [whole];

	const budget =
		maxLength - script({ ...plan, children: [] }, components).length - 200;
	const parts = split(plan, budget);
	return parts.map((part, index) =>
		script(
			{
				...plan,
				children: part.nodes,
				part: {
					index,
					of: parts.length,
					path: part.path,
					container: part.container,
				},
			},
			components,
		),
	);
}

function script(plan: FigmaPlan, components: readonly string[]): string {
	const keys = components.map(
		(name) => `  ${JSON.stringify(name)}: ${JSON.stringify(KEY_PLACEHOLDER)},`,
	);
	const part = plan.part
		? ` Part ${plan.part.index + 1} of ${plan.part.of}: run the parts in order.`
		: "";
	return [
		`// Builds "${plan.name.replaceAll("\n", " ")}" from the ${FIGMA_KIT.name} (${FIGMA_KIT.version}), made by kern-ux's plan_figma_design.${part}`,
		"// KEYS: each component's key from search_design_system. A component left empty is drawn as a placeholder.",
		"const KEYS = {",
		...keys,
		"};",
		`const PLAN = ${JSON.stringify(plan)};`,
		RUNTIME,
		"return await buildKernScreen(PLAN, KEYS);",
	].join("\n");
}

/**
 * Blocks for one script: they go into the frame at path (child indexes from
 * the screen down), whose name is container; the script checks the name.
 */
type Part = { path: number[]; container: string; nodes: PlanNode[] };

/**
 * Greedy, in document order: blocks go into the current part while they fit.
 * A frame that doesn't fit goes in without its children, which follow in
 * parts that add to it; any other block that doesn't fit starts a new part.
 */
function split(plan: FigmaPlan, budget: number): Part[] {
	const parts: Part[] = [];
	let current: Part = { path: [], container: plan.name, nodes: [] };
	let size = 0;

	const start = (path: number[], container: string) => {
		if (current.nodes.length > 0 || parts.length === 0) parts.push(current);
		current = { path, container, nodes: [] };
		size = 0;
	};

	const visit = (
		nodes: readonly PlanNode[],
		path: number[],
		container: string,
	) => {
		if (current.path.join() !== path.join()) start(path, container);
		nodes.forEach((node, index) => {
			const length = JSON.stringify(node).length + 1;
			if (size + length <= budget) {
				current.nodes.push(node);
				size += length;
				return;
			}
			if (node.type === "frame" && node.children.length > 0) {
				const skeleton: PlanNode = { ...node, children: [] };
				const skeletonLength = JSON.stringify(skeleton).length + 1;
				if (size + skeletonLength > budget) start(path, container);
				current.nodes.push(skeleton);
				size += skeletonLength;
				visit(node.children, [...path, index], node.name);
				start(path, container);
				return;
			}
			start(path, container);
			current.nodes.push(node);
			size += length;
		});
	};

	visit(plan.children, [], plan.name);
	if (current.nodes.length > 0) parts.push(current);
	return parts.filter((part, index) => index === 0 || part.nodes.length > 0);
}
