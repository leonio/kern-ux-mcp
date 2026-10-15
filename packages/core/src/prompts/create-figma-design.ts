import { completable } from "@modelcontextprotocol/server";
import { z } from "zod";

import { FIGMA_KIT } from "../ux/figma/kit.js";
import { FIGMA_TOOLS } from "../ux/figma/tool.js";
import type { Locale } from "../ux/types.js";
import {
	filledIn,
	type KernPromptDefinition,
	LOCALE_NAMES,
	localeArgument,
	numbered,
} from "./definition.js";

const DEVICES = ["desktop", "mobile"] as const;

/** The device, completed like the locale; a blank value counts as none. */
const deviceArgument = completable(
	z
		.union([z.enum(DEVICES), z.literal("").transform(() => undefined)], {
			error: "device is desktop or mobile.",
		})
		.describe("The frame's width: desktop (the default) or mobile."),
	(value) => DEVICES.filter((device) => device.startsWith(value ?? "")),
).optional();

const argsSchema = z.object({
	screen: z
		.string()
		.optional()
		.describe(
			'The screen to build, e.g. "the page we just made" or "Sperrmüll anmelden, step 2". Leave it empty for the last page or composition in the conversation.',
		),
	figmaFile: z
		.string()
		.optional()
		.describe(
			"The URL of the Figma file to build in. It must use the KERN 2 Design-Kit as a library.",
		),
	device: deviceArgument,
	locale: localeArgument,
});

type Args = z.output<typeof argsSchema>;

/**
 * create_figma_design: a screen designed in HTML with our tools, built in
 * Figma from the KERN 2 Design-Kit's components by Figma's MCP server. Our
 * server doesn't call Figma: plan_figma_design returns the script, and the
 * assistant runs it with Figma's tools (docs/figma-and-theming.md, section 5).
 */
export function createFigmaDesign(): KernPromptDefinition<typeof argsSchema> {
	return {
		name: "create_figma_design",
		title: "Build the screen in Figma",
		description: `Builds a screen designed with the KERN tools in Figma, from the ${FIGMA_KIT.name}'s components: plan_figma_design plans it, and Figma's MCP server draws it.`,
		argsSchema,
		content: async (args) => [{ type: "text", text: workflow(args) }],
	};
}

function workflow(args: Args): string {
	const locale: Locale = args.locale ?? "de";
	const screen = filledIn(args.screen);
	const file = filledIn(args.figmaFile);
	const { search, run, screenshot, skill } = FIGMA_TOOLS;

	const items = [
		`**HTML:** the screen's KERN HTML is the html of the last \`render_page\` or \`render_composition\` result for it. If there is none, build the screen first: \`render_page\` for a page, \`render_composition\` for a part of one, with \`locale: "${locale}"\` and \`strict: true\`.`,
		`**Plan:** call \`plan_figma_design\` with that html${args.device === "mobile" ? ', and `device: "mobile"`' : ""}. It returns \`components\`, \`scripts\`, \`steps\`, \`unmapped\` and \`warnings\`. A big page comes in several scripts.`,
		`**Keys:** one \`${search}\` call on the Figma file, with one component query per name in \`components\`. For each name, take the ${FIGMA_KIT.name} result with exactly that name and put its key into \`KEYS\` at the top of each script. Don't guess a key: a name left empty is drawn as a red placeholder.`,
		`**Build:** load Figma's \`${skill}\` skill, then run each script with \`${run}\` on the file, in order, changed only in \`KEYS\`. The first builds the screen on the current page and replaces a frame of the same name, so they can run again.`,
		`**Check:** a script returns \`screenId\`, \`slotsId\`, \`missing\`, \`warnings\` and \`errors\`. After the last, take \`${screenshot}\` of \`screenId\` and compare it with the HTML. Fix what differs with small \`${run}\` edits. The content of cards, fieldsets, accordions and grid columns is in the slot components on the slots frame, \`slotsId\`.`,
	];

	return [
		`Build this screen in Figma from the ${FIGMA_KIT.name}'s components: ${screen ?? "the last page or composition in this conversation"}.`,
		file
			? `The Figma file: ${file}`
			: "Ask the designer for the Figma file's URL first. The file must use the KERN 2 Design-Kit as a library, and the KERN 2 Foundations for spacing and levels.",
		"Our kern tools plan the screen; Figma's MCP server draws it. Work in this order:",
		numbered(items),
		`Answer in ${LOCALE_NAMES[locale]} with the frame's name and a link to it, then what needs the designer: components without a key, \`unmapped\` markup drawn as placeholders, and the warnings.`,
	].join("\n\n");
}
