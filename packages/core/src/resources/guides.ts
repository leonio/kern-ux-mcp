import { invokeTool } from "../invoke.js";
import { withStableIds } from "../ux/id.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";
import type { FoundationInfo, Registry } from "../ux/types.js";
import {
	byteLength,
	type KernResourceDefinition,
	resourceUri,
} from "./definition.js";

/** Sections of a foundations page a guide quotes, by ID, in this order. */
export type GuideQuote = {
	page: string;
	sections: readonly string[];
	/** Also quote the page's do's and don'ts. */
	dosAndDonts?: boolean;
};

/** One guide: what our tools do (code), then KERN's text (the bundle). */
type Guide = {
	name: string;
	title: string;
	description: string;
	/** How our tools do it: Markdown bullets written from the code. */
	ours: readonly string[];
	/** A tool call that shows it. */
	example: { tool: string; input: Record<string, unknown> };
	/** KERN's guidance, quoted section by section under these headings. */
	kern: ReadonlyArray<{ heading: string; quotes: readonly GuideQuote[] }>;
};

export const GUIDES: readonly Guide[] = [
	{
		name: "forms",
		title: "KERN guide: forms",
		description:
			"How our tools build labels, hints, errors and the error summary, and KERN's rules for every input field.",
		ours: [
			"**Tools:** `field` blocks (text, email, tel, url, number, date, password, textarea, select, radio, checkbox) in `fieldset` and `form` blocks, in `render_composition` and `render_page`. `get_inputtext`, `get_select`, `get_checkbox` and the other input tools render one field each.",
			'**Label:** every field has a `<label class="kern-label" for>` naming the input\'s generated `id`.',
			'**Hint:** `hint` adds `<div class="kern-hint" id>` between label and input, and the input lists it in `aria-describedby`.',
			'**Error:** `error` adds `kern-form-input--error` to the field and a `<p class="kern-error" id role="alert">` with a danger icon after the input. `aria-describedby` lists the hint, then the error.',
			'**Optional:** `optional: true` adds `<span class="kern-label__optional">` to the label. Our tools don\'t mark required fields: add `aria-required="true"`, as KERN asks below.',
			"**Groups:** a `fieldset` block puts fields under a `<legend>`. Its `error` marks the fieldset (`kern-fieldset--error`, `aria-describedby`) and follows its fields.",
			"**Error summary:** a `form` block with `errorSummary` collects the errors inside it into a danger alert at the top, one link to each field. A group's error comes before its fields' errors and links to the group's first input.",
			"**Checks:** `validate_html` reports labels without a field (`form.label_for`) and error messages without an `id` or an `aria-describedby` that names them (`form.error_id`, `form.error_describedby`).",
		],
		example: {
			tool: "render_composition",
			input: {
				contentBlocks: [
					{
						kind: "form",
						form: {
							errorSummary: {},
							contentBlocks: [
								{
									kind: "field",
									field: {
										type: "text",
										name: "nachname",
										label: "Nachname",
										hint: "Wie im Personalausweis",
										error: "Bitte geben Sie Ihren Nachnamen ein.",
									},
								},
								{
									kind: "field",
									field: {
										type: "email",
										name: "email",
										label: "E-Mail",
										optional: true,
									},
								},
							],
							actions: { submitLabel: "Absenden" },
						},
					},
				],
			},
		},
		kern: [
			{
				heading: "KERN's rules for every input field",
				quotes: [
					{
						page: "form-inputs-overview",
						sections: [
							"states",
							"label-und-legende",
							"required-auszeichnung",
							"optional-label",
							"hint",
							"fehlermeldungen",
							"breite-und-höhe-der-eingabefelder",
							"eingabefelder-außerhalb-von-formularen",
							"weitere-hinweise",
							"disabled-attribut",
						],
						dosAndDonts: true,
					},
				],
			},
		],
	},
	{
		name: "layout",
		title: "KERN guide: layout",
		description:
			"How our tools lay out pages and columns on KERN's CSS Grid utilities, and KERN's guidance on containers, breakpoints and spacing.",
		ours: [
			'**Page:** `render_page` puts the `h1` and the blocks in `<main class="kern-container kern-flex kern-flex-col kern-gap-lg">`: centred, padded at the sides, stacked with KERN\'s large gap. The header and footer have containers of their own.',
			"**Columns:** `get_grid`, grid blocks, `get_card_group` and the page footer use `kern-grid kern-grid-cols-1 kern-grid-cols-{n}-md kern-gap-lg`: one column on small screens, `n` equal columns (1 to 12) from the md breakpoint (768 px) up, 24 px apart.",
			"**A div of its own:** the grid always sits in a plain `div`. KERN removes a `kern-container`'s padding when a `kern-grid` is its direct child, which puts the content against the screen edge. An `html` block with a `kern-grid` at its top level gets the same `div`.",
			"**Columns of different widths:** put `kern-col-{n}-md` on the items of a `kern-grid kern-grid-cols-1 kern-grid-cols-12-md`, e.g. 8 and 4.",
			"**Not:** the container grid (`kern-row`, `kern-col-md-*`), which KERN deprecates; don't mix it with `kern-grid`. A plain `kern-grid` has 12 columns and no gap.",
			"**Checks:** `validate_html` warns about a grid right inside a container (`layout.grid_in_container`) and one whose column counts all start at a breakpoint (`layout.grid_columns_small`).",
		],
		example: {
			tool: "get_grid",
			input: {
				includeHeading: true,
				headingText: "Unsere Leistungen",
				columnsContent: [
					[{ kind: "text", text: "Wohngeld" }],
					[{ kind: "text", text: "Elterngeld" }],
					[{ kind: "text", text: "Kindergeld" }],
				],
			},
		},
		kern: [
			{
				heading: "What to use when",
				quotes: [
					{
						page: "layout-overview",
						sections: [
							"was-verwende-ich-wann",
							"css-grid-hilfsklassen-2d",
							"css-flex-hilfsklassen-1d",
						],
					},
				],
			},
			{
				heading: "Containers and breakpoints",
				quotes: [
					{
						page: "utilities",
						sections: [
							"kern-container",
							"kern-container-fluid",
							"verfügbare-breakpoints",
						],
					},
					{ page: "layout", sections: ["einspaltige-layouts"] },
				],
			},
			{
				heading: "Spacing",
				quotes: [
					{
						page: "sizes-and-spacing",
						sections: [
							"space-token-padding-gap-margin",
							"umgang-mit-weißraum",
							"stacking",
							"space-kombination-beim-stacking",
						],
						dosAndDonts: true,
					},
					{ page: "utilities", sections: ["gap-abstände", "stack"] },
				],
			},
		],
	},
];

/**
 * kern://guides/{name}: Markdown guides that put what our tools do next to
 * KERN's guidance on the same topic. KERN's text comes from the foundations
 * pages in the registry, quoted section by section; each guide is built on
 * first use.
 */
export function guides(
	registry: Registry,
	tools: readonly ToolDef[],
): KernResourceDefinition {
	const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));
	const built = new Map<string, Promise<string>>();

	const read = (name: string): Promise<string | undefined> => {
		const guide = GUIDES.find((candidate) => candidate.name === name);
		if (!guide) return Promise.resolve(undefined);
		let text = built.get(name);
		if (!text) {
			text = buildGuide(registry, guide, toolsByName);
			built.set(name, text);
		}
		return text;
	};

	const definition: KernResourceDefinition = {
		name: "guides",
		uriTemplate: "kern://guides/{name}",
		variable: "name",
		title: "KERN guides",
		description:
			"Guides that put what our tools do next to KERN's guidance: forms and layout.",
		mimeType: "text/markdown",
		read,
		entries: () =>
			Promise.all(
				GUIDES.map(async (guide) => ({
					uri: resourceUri(definition, guide.name),
					value: guide.name,
					title: guide.title,
					description: guide.description,
					size: byteLength((await read(guide.name)) ?? ""),
				})),
			),
	};
	return definition;
}

async function buildGuide(
	registry: Registry,
	guide: Guide,
	toolsByName: ReadonlyMap<string, ToolDef>,
): Promise<string> {
	const tool = toolsByName.get(guide.example.tool);
	if (!tool)
		throw new Error(
			`The ${guide.name} guide's tool ${guide.example.tool} doesn't exist.`,
		);
	// Stable IDs, so every server process serves the same guide.
	const { html } = (await withStableIds(() =>
		invokeTool(tool, guide.example.input),
	)) as { html: string };

	return [
		`# ${guide.title}`,
		guide.description,
		"## How our tools do it",
		guide.ours.map((line) => `- ${line}`).join("\n"),
		`### Example: \`${guide.example.tool}\``,
		`\`\`\`json\n${JSON.stringify(guide.example.input, null, 2)}\n\`\`\``,
		`\`\`\`html\n${html}\n\`\`\``,
		...guide.kern.map(({ heading, quotes }) =>
			[
				`## ${heading}`,
				...quotes.map((quote) => quoteText(registry, quote)),
			].join("\n\n"),
		),
	]
		.join("\n\n")
		.concat("\n");
}

/** The quoted sections as bullets, with the page's do's and don'ts and a link. */
function quoteText(registry: Registry, quote: GuideQuote): string {
	const page = foundation(registry, quote.page);
	const sections = quote.sections.map((id) => {
		const section = page.sections.find((candidate) => candidate.id === id);
		if (!section) {
			throw new Error(
				`${page.id} has no section ${id}; update the guide's quotes.`,
			);
		}
		return `- **${section.heading}:** ${section.summary ?? ""}`.trimEnd();
	});
	const knowledge = quote.dosAndDonts ? page.knowledge : undefined;
	return [
		sections.join("\n"),
		...(knowledge?.dos?.length
			? [`Do:\n\n${knowledge.dos.map((item) => `- ${item}`).join("\n")}`]
			: []),
		...(knowledge?.donts?.length
			? [`Don't:\n\n${knowledge.donts.map((item) => `- ${item}`).join("\n")}`]
			: []),
		`Source: [${page.title}](${page.url}) on kern-ux.de`,
	].join("\n\n");
}

function foundation(registry: Registry, id: string): FoundationInfo {
	const page = registry.foundations.get(id);
	if (!page) {
		throw new Error(
			`The registry has no foundations page ${id}; add it to GUIDE_FOUNDATIONS.`,
		);
	}
	return page;
}
