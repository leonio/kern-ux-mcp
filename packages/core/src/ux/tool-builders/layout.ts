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
	description: (component: ComponentInfo) => string;
	build: (args: unknown, locale: Locale) => BuildResult;
};

const describeLayout = (component: ComponentInfo) =>
	`KERN UX (Foundational/Layout): HTML für ${component.title} erzeugen (Container/Grid/Section).`;

/** The layout tools, by component ID (see COMPONENT_TOOLS). */
const LAYOUT_TOOLS: Record<string, LayoutToolSpec> = {
	descriptionlist: {
		inputSchema: descriptionListToolSchema,
		description: describeLayout,
		build: (args) =>
			buildDescriptionList(args as Parameters<typeof buildDescriptionList>[0]),
	},
	divider: {
		inputSchema: dividerToolSchema,
		description: describeLayout,
		build: (args) => buildDivider(args as Parameters<typeof buildDivider>[0]),
	},
	fieldset: {
		inputSchema: FieldsetToolSchema,
		description: () =>
			"KERN UX (Foundational/Layout): Groups related form fields under a legend, with an optional hint and group error. " +
			"Put the fields in contentBlocks as field blocks, e.g. { legend: 'Ihre Anschrift', legendSize: 'large', contentBlocks: [{ kind: 'field', field: { type: 'text', name: 'strasse', label: 'Straße und Hausnummer' } }] }.",
		build: (args, locale) =>
			buildFieldset(args as Parameters<typeof buildFieldset>[0], locale),
	},
	grid: {
		inputSchema: GridToolSchema,
		description: () =>
			"KERN UX (Foundational/Layout): HTML für 12-Spalten-Grid erzeugen (kern-container/kern-row/kern-col-{breakpoint}-{span}). " +
			"Verwendet responsive Breakpoints (kern-col-md-{n}, kern-col-sm-12). " +
			"Spalten müssen Teiler von 12 sein: 1, 2, 3, 4, 6, 12. Für 5 oder 7 gleich breite Spalten verwende dieses Tool NICHT; nutze stattdessen CSS-Grid-Utilities über get_utility_reference (z.B. kern-grid kern-grid-cols-5).",
		build: (args, locale) =>
			buildGrid(args as Parameters<typeof buildGrid>[0], locale),
	},
	kopfzeile: {
		inputSchema: kopfzeileToolSchema,
		description: () =>
			"KERN UX (Foundational/Layout): The Kopfzeile, the thin bar with the German flag that marks an official website of the Federal Republic of Germany. " +
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
		description: spec.description(component),
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
