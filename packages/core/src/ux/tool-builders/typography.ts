import type { z } from "zod";
import { pickLocale } from "../i18n.js";
import { bodyToolSchema } from "../schemas/body.js";
import { headingToolSchema } from "../schemas/heading.js";
import { labelToolSchema } from "../schemas/label.js";
import { linkToolSchema } from "../schemas/link.js";
import { listsToolSchema } from "../schemas/lists.js";
import { prelineToolSchema } from "../schemas/preline.js";
import { sublineToolSchema } from "../schemas/subline.js";
import { titleToolSchema } from "../schemas/title.js";
import { buildBody } from "../templates/body.js";
import { buildHeading } from "../templates/heading.js";
import { buildLabel } from "../templates/label.js";
import { buildLink } from "../templates/link.js";
import { buildLists } from "../templates/lists.js";
import { buildPreline } from "../templates/preline.js";
import { buildSubline } from "../templates/subline.js";
import { buildTitle } from "../templates/title.js";
import type { BuildResult, ComponentInfo, Locale } from "../types.js";
import { validateHtmlStrict } from "../validate.js";
import {
	assertStrictValidationOrThrow,
	ComponentOutputSchema,
	getComponentToolName,
	statusBanner,
	type ToolDef,
} from "./shared.js";

/**
 * Foundational typography strategy tooling.
 */

type TypographyToolSpec = {
	inputSchema: z.ZodType;
	description?: string;
	build: (args: unknown) => BuildResult;
};

/** The typography tools, by component ID (see COMPONENT_TOOLS). */
const TYPOGRAPHY_TOOLS: Record<string, TypographyToolSpec> = {
	body: {
		inputSchema: bodyToolSchema,
		build: (args) => buildBody(args as Parameters<typeof buildBody>[0]),
	},
	heading: {
		inputSchema: headingToolSchema,
		description:
			"KERN UX (Foundational/Typography): HTML für Heading erzeugen. " +
			"Nutze level 1-6 für Hierarchie (h1..h6). Beispiel: { text: 'Services', level: 2 }.",
		build: (args) => buildHeading(args as Parameters<typeof buildHeading>[0]),
	},
	label: {
		inputSchema: labelToolSchema,
		build: (args) => buildLabel(args as Parameters<typeof buildLabel>[0]),
	},
	link: {
		inputSchema: linkToolSchema,
		build: (args) => buildLink(args as Parameters<typeof buildLink>[0]),
	},
	lists: {
		inputSchema: listsToolSchema,
		build: (args) => buildLists(args as Parameters<typeof buildLists>[0]),
	},
	preline: {
		inputSchema: prelineToolSchema,
		build: (args) => buildPreline(args as Parameters<typeof buildPreline>[0]),
	},
	subline: {
		inputSchema: sublineToolSchema,
		build: (args) => buildSubline(args as Parameters<typeof buildSubline>[0]),
	},
	title: {
		inputSchema: titleToolSchema,
		build: (args) => buildTitle(args as Parameters<typeof buildTitle>[0]),
	},
};

export function buildTypographyTool(component: ComponentInfo): ToolDef {
	const spec = Object.hasOwn(TYPOGRAPHY_TOOLS, component.id)
		? TYPOGRAPHY_TOOLS[component.id]
		: undefined;
	if (!spec) {
		throw new Error(`No typography tool for component: ${component.id}`);
	}
	const name = getComponentToolName(component);

	return {
		name,
		description:
			spec.description ??
			`KERN UX (Foundational/Typography): HTML für ${component.title} erzeugen.`,
		inputSchema: spec.inputSchema,
		outputSchema: ComponentOutputSchema,
		handler: async (args: { locale?: Locale; strict?: boolean }) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;

			const built = spec.build(args);
			const html = statusBanner(component) + built.html;
			const validation = validateHtmlStrict(html);

			assertStrictValidationOrThrow({ name, locale, strict, validation });

			return { html, warnings: built.warnings, validation };
		},
	};
}
