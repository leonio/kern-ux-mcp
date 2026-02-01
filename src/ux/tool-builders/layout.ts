import type { z } from "zod";
import { pickLocale } from "../i18n.js";
import { descriptionListToolSchema } from "../schemas/description-list.js";
import { dividerToolSchema } from "../schemas/divider.js";
import { FieldsetToolSchema } from "../schemas/fieldset.js";
import { GridToolSchema } from "../schemas/grid.js";
import { kopfzeileToolSchema } from "../schemas/kopfzeile.js";
import { LayoutToolSchema } from "../schemas/layout.js";
import { buildDescriptionList } from "../templates/description-list.js";
import { buildDivider } from "../templates/divider.js";
import { buildFieldset } from "../templates/fieldset.js";
import { buildGrid } from "../templates/grid.js";
import { buildKopfzeile } from "../templates/kopfzeile.js";
import { buildLayout } from "../templates/layout.js";
import type { ComponentInfo } from "../types.js";
import { validateHtmlStrict } from "../validate.js";
import {
	assertStrictValidationOrThrow,
	ComponentOutputSchema,
	experimentalBanner,
	getComponentToolName,
	type ToolDef,
} from "./shared.js";

/**
 * Foundational layout strategy tooling.
 */

export const LAYOUT_MANIFEST_IDS = new Set([
	"grid",
	"fieldset",
	"divider",
	"kopfzeile",
	"descriptionlist",
]);

export function buildLayoutTool(component: ComponentInfo): ToolDef {
	const name = getComponentToolName(component);
	const inputSchema =
		component.id === "grid"
			? GridToolSchema
			: component.id === "fieldset"
				? FieldsetToolSchema
				: component.id === "descriptionlist"
					? descriptionListToolSchema
					: component.id === "divider"
						? dividerToolSchema
						: component.id === "kopfzeile"
							? kopfzeileToolSchema
							: LayoutToolSchema;

	return {
		name,
		description:
			component.id === "grid"
				? "KERN UX (Foundational/Layout): HTML für 12-Spalten-Grid erzeugen (kern-container/kern-row/kern-col-{breakpoint}-{span}). " +
					"Verwendet responsive Breakpoints (kern-col-md-{n}, kern-col-sm-12). " +
					"Spalten müssen Teiler von 12 sein: 1, 2, 3, 4, 6, 12. Für 5 oder 7 gleich breite Spalten verwende dieses Tool NICHT; nutze stattdessen CSS-Grid-Utilities über get_utility_reference (z.B. kern-grid kern-grid-cols-5)."
				: `KERN UX (Foundational/Layout): HTML für ${component.title} erzeugen (Container/Grid/Section).`,
		inputSchema,
		outputSchema: ComponentOutputSchema,
		handler: async (args: z.infer<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;

			let renderedHtml: string;
			let templateWarnings: string[] = [];

			if (component.id === "grid") {
				const built = buildGrid(args as Parameters<typeof buildGrid>[0]);
				renderedHtml = built.html;
				templateWarnings = built.warnings;
			} else if (component.id === "fieldset") {
				const built = buildFieldset(
					args as Parameters<typeof buildFieldset>[0],
				);
				renderedHtml = built.html;
				templateWarnings = built.warnings;
			} else if (component.id === "descriptionlist") {
				const built = buildDescriptionList(
					args as Parameters<typeof buildDescriptionList>[0],
				);
				renderedHtml = built.html;
				templateWarnings = built.warnings;
			} else if (component.id === "divider") {
				const built = buildDivider(args as Parameters<typeof buildDivider>[0]);
				renderedHtml = built.html;
				templateWarnings = built.warnings;
			} else if (component.id === "kopfzeile") {
				const built = buildKopfzeile(
					args as Parameters<typeof buildKopfzeile>[0],
				);
				renderedHtml = built.html;
				templateWarnings = built.warnings;
			} else if (component.htmlCanonical) {
				renderedHtml = component.htmlCanonical;
			} else {
				const built = buildLayout(args as Parameters<typeof buildLayout>[0]);
				renderedHtml = built.html;
				templateWarnings = built.warnings;
			}

			const html = experimentalBanner(component) + renderedHtml;
			const validation = validateHtmlStrict(html);

			assertStrictValidationOrThrow({ name, locale, strict, validation });

			return {
				html,
				warnings: [...(component.warnings ?? []), ...templateWarnings],
				validation,
			};
		},
	};
}
