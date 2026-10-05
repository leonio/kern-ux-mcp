import type { z } from "zod";
import { pickLocale } from "../i18n.js";
import { descriptionListToolSchema } from "../schemas/description-list.js";
import { dividerToolSchema } from "../schemas/divider.js";
import { FieldsetToolSchema } from "../schemas/fieldset.js";
import { GridToolSchema } from "../schemas/grid.js";
import { kopfzeileToolSchema } from "../schemas/kopfzeile.js";
import { buildDescriptionList } from "../templates/description-list.js";
import { buildDivider } from "../templates/divider.js";
import { buildFieldset } from "../templates/fieldset.js";
import { buildGrid } from "../templates/grid.js";
import { buildKopfzeile } from "../templates/kopfzeile.js";
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
 * Foundational layout strategy tooling.
 */

type LayoutToolSpec = {
	inputSchema: z.ZodType;
	description: string;
	build: (args: unknown, locale: Locale) => BuildResult;
};

/** The layout tools, by component ID (see COMPONENT_TOOLS). */
const LAYOUT_TOOLS: Record<string, LayoutToolSpec> = {
	descriptionlist: {
		inputSchema: descriptionListToolSchema,
		description:
			"KERN UX: HTML for a description list (dl): term and value pairs as dt and dd, values as plain text.",
		build: (args) =>
			buildDescriptionList(args as Parameters<typeof buildDescriptionList>[0]),
	},
	divider: {
		inputSchema: dividerToolSchema,
		description:
			'KERN UX: HTML for a divider, <hr class="kern-divider">, decorative by default.',
		build: (args) => buildDivider(args as Parameters<typeof buildDivider>[0]),
	},
	fieldset: {
		inputSchema: FieldsetToolSchema,
		description:
			"KERN UX: HTML for a fieldset: related form fields under a legend, with an optional hint and group error. " +
			"Put the fields in contentBlocks as field blocks, e.g. { legend: 'Ihre Anschrift', legendSize: 'large', contentBlocks: [{ kind: 'field', field: { type: 'text', name: 'strasse', label: 'Straße und Hausnummer' } }] }.",
		build: (args, locale) =>
			buildFieldset(args as Parameters<typeof buildFieldset>[0], locale),
	},
	grid: {
		inputSchema: GridToolSchema,
		description:
			"KERN UX: HTML for 1 to 12 equal-width columns on KERN's CSS Grid utilities (kern-grid kern-grid-cols-{n}-md), one column on small screens. " +
			"For columns of different widths, see get_utility_reference.",
		build: (args, locale) =>
			buildGrid(args as Parameters<typeof buildGrid>[0], locale),
	},
	kopfzeile: {
		inputSchema: kopfzeileToolSchema,
		description:
			"KERN UX: HTML for the Kopfzeile, the thin bar with the German flag that marks an official website of the Federal Republic of Germany. " +
			"Only for official federal websites. render_page can add it to a whole page.",
		build: (args, locale) =>
			buildKopfzeile(args as Parameters<typeof buildKopfzeile>[0], locale),
	},
};

export function buildLayoutTool(component: ComponentInfo): ToolDef {
	const spec = Object.hasOwn(LAYOUT_TOOLS, component.id)
		? LAYOUT_TOOLS[component.id]
		: undefined;
	if (!spec) {
		throw new Error(`No layout tool for component: ${component.id}`);
	}
	const name = getComponentToolName(component);

	return {
		name,
		description: spec.description,
		inputSchema: spec.inputSchema,
		outputSchema: ComponentOutputSchema,
		handler: async (args: { locale?: Locale; strict?: boolean }) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;

			const built = spec.build(args, locale);
			const html = statusBanner(component) + built.html;
			const validation = validateHtmlStrict(html);

			assertStrictValidationOrThrow({ name, locale, strict, validation });

			return { html, warnings: built.warnings, validation };
		},
	};
}
