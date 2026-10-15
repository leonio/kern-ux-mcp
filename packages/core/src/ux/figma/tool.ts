import { z } from "zod";

import type { ToolDef } from "../tool-builders/shared.js";
import { FIGMA_KIT } from "./kit.js";
import { planFigmaDesign } from "./plan.js";
import { figmaScripts } from "./script.js";

/** The same bound as validate_html's: far above any page our tools render. */
const HTML_MAX_LENGTH = 500_000;

/** The tools and skill of Figma's MCP server that our steps and prompt name. */
export const FIGMA_TOOLS = {
	search: "search_design_system",
	run: "use_figma",
	screenshot: "get_screenshot",
	skill: "figma-use",
} as const;

const inputSchema = z.object({
	html: z
		.string()
		.min(1)
		.max(HTML_MAX_LENGTH)
		.describe(
			"KERN HTML as render_page, render_composition or a get_* tool returns it.",
		),
	name: z
		.string()
		.max(120)
		.optional()
		.describe("The Figma frame's name. Default: the page's h1."),
	device: z
		.enum(["desktop", "mobile"])
		.optional()
		.describe("desktop (1440 px wide, the default) or mobile (360 px)."),
});

const outputSchema = z.object({
	name: z.string().describe("The frame the script builds."),
	kit: z.object({ name: z.string(), version: z.string() }),
	components: z
		.array(z.string())
		.describe("The kit components to look up with search_design_system."),
	scripts: z
		.array(z.string())
		.describe(
			"Code for use_figma, once KEYS is filled in: usually one script, several for a big page, run in order.",
		),
	steps: z.array(z.string()).describe("What to do with the result, in order."),
	unmapped: z
		.array(z.string())
		.describe("Markup with no kit component, drawn as a labelled placeholder."),
	warnings: z.array(z.string()),
});

type Output = z.infer<typeof outputSchema>;

/**
 * plan_figma_design: KERN HTML as a design in Figma, built from the KERN 2
 * Design-Kit's components by Figma's MCP server. Our server doesn't call
 * Figma: it returns the components to look up and the script that builds
 * the screen from them (docs/figma-and-theming.md, section 5).
 */
export function buildPlanFigmaDesignTool(): ToolDef {
	return {
		name: "plan_figma_design",
		title: "Plan a Figma Design",
		description:
			"KERN UX: Turns KERN HTML into a design in Figma made of the KERN 2 Design-Kit's components, for Figma's MCP server: " +
			"the kit components to look up with search_design_system, and the script that builds the screen with use_figma.",
		inputSchema,
		outputSchema,
		handler: async (args: z.input<typeof inputSchema>): Promise<Output> => {
			const { plan, components, unmapped, warnings } = planFigmaDesign(
				args.html,
				{ name: args.name, device: args.device },
			);
			const scripts = figmaScripts(plan, components);
			return {
				name: plan.name,
				kit: { ...FIGMA_KIT },
				components,
				scripts,
				steps: figmaSteps(components, unmapped, scripts.length),
				unmapped,
				warnings,
			};
		},
	};
}

/** The steps that take the result to a screen in Figma, with Figma's tools. */
export function figmaSteps(
	components: readonly string[],
	unmapped: readonly string[],
	scripts = 1,
): string[] {
	const { search, run, screenshot, skill } = FIGMA_TOOLS;
	const each = scripts > 1 ? `each of the ${scripts} scripts` : "the script";
	return [
		`Call Figma's ${search} once, with one component query per name in components (${components.length}). For each name, take the result from the ${FIGMA_KIT.name} whose name is exactly that name, and its key.`,
		`Fill KEYS at the top of ${each}: each name's key. A name left empty is drawn as a red placeholder, so look up again rather than guess a key.`,
		`Load Figma's ${skill} skill, then run ${scripts > 1 ? "the scripts, in order," : "the script"} with ${run} in the designer's file. It builds the screen on the current page and replaces a frame of the same name.`,
		`A script returns screenId, slotsId, missing, warnings and errors. Check the screen with ${screenshot} on screenId against the HTML, and fix what differs with ${run}. Content inside cards, fieldsets, accordions and grid columns lives in the components on the slots frame, slotsId.`,
		...(unmapped.length > 0
			? [
					`These have no kit component and are placeholders: ${unmapped.join(", ")}. Tell the designer.`,
				]
			: []),
	];
}
