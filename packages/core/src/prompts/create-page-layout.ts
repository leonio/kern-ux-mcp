import { z } from "zod";

import type { KernResourceDefinition } from "../resources/definition.js";
import type { Locale, Registry } from "../ux/types.js";
import {
	cardLinks,
	embeddedResource,
	filledIn,
	type KernPromptDefinition,
	LOCALE_NAMES,
	localeArgument,
	numbered,
	strictRender,
	VERBATIM_ANSWER,
} from "./definition.js";

/** The cards of a page's parts, linked whatever the sections. */
const PAGE_CARDS = ["kopfzeile", "heading", "grid", "card", "link"] as const;

const argsSchema = z.object({
	purpose: z
		.string()
		.min(1)
		.describe(
			'The page and its site, e.g. "Sperrmüll anmelden, Website der Stadt Musterstadt" or "Startseite des Bürgerservice Musterstadt". Name the navigation and footer links if you know them.',
		),
	sections: z
		.string()
		.optional()
		.describe(
			'The page\'s sections, separated by semicolons, e.g. "Einleitung; Leistungen als drei Karten; Häufige Fragen; Kontakt". Leave it empty to choose them from the purpose.',
		),
	locale: localeArgument,
});

type Args = z.output<typeof argsSchema>;

/**
 * create_page_layout: a whole page with render_page: header, h1, sections with
 * grids and cards, and footer, rendered strictly. The layout guide is embedded
 * and the cards of the page's parts are linked; the workflow comes last.
 */
export function createPageLayout(
	registry: Registry,
	guides: KernResourceDefinition,
): KernPromptDefinition<typeof argsSchema> {
	const links = cardLinks(registry, PAGE_CARDS);

	return {
		name: "create_page_layout",
		title: "Create a KERN page",
		description:
			"Builds a whole page with the KERN tools: header with navigation, the main heading, sections with grids and cards, and the footer, laid out on KERN's grid and checked with strict validation.",
		argsSchema,
		content: async (args) => [
			await embeddedResource(guides, "layout"),
			...links,
			{ type: "text", text: workflow(args) },
		],
	};
}

function workflow(args: Args): string {
	const locale: Locale = args.locale ?? "de";
	const sections = filledIn(args.sections);

	const items = [
		"**Frame:** one `render_page` call. `header` with the site's `title` and its `navigation` (up to 8 links, `current: true` on this page's link), the page's `heading` (its only `h1`), and a `footer` with up to four link `columns` and a `note`. `kopfzeile: true` only for an official federal website. `document: true` returns a complete HTML document; leave it out for a fragment.",
		`**Sections:** in \`contentBlocks\`, a short intro as \`{ kind: "text", text }\`, then one section block per section${sections ? ", in the order given" : ""}: \`{ kind: "section", section: { headingText, contentBlocks } }\`. Its \`headingText\` becomes an \`h2\`.`,
		'**Columns:** things side by side, such as services or contacts, go in `{ kind: "grid", grid: { columnsContent: [[…], […]] } }`, one inner list per column. Give each a card, `{ kind: "card", card: { header: { title, titleLevel: 3 }, body, footer } }`: its title one level below its section, its actions in `footer`. No card directly in a card.',
		`**Content:** the block kind for what each part shows: \`field\` blocks in a \`form\` block (with \`actions: { submitLabel }\`) for a form, \`disclosure\` blocks for questions that expand. A component without a block kind, such as a table (\`get_table\`) or a notice (\`get_alert\`), comes from its tool, added as an \`html\` block. All text in ${LOCALE_NAMES[locale]}.`,
		strictRender("render_page", locale),
	];

	return [
		`Build a page with the kern tools: ${args.purpose.trim()}`,
		...(sections ? [`Sections: ${sections}`] : []),
		"The layout guide above explains how our tools lay out a page and its columns, and the cards linked above describe its parts. Work in this order:",
		numbered(items),
		VERBATIM_ANSWER,
	].join("\n\n");
}
