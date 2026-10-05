import { z } from "zod";
import { pickLocale } from "./i18n.js";
import { VALID_ICON_NAMES } from "./icons.js";
import {
	getToolInputJsonSchema,
	getToolOutputJsonSchema,
} from "./json-schema.js";
import { CardGroupSchema } from "./schemas/card-group.js";
import {
	MAX_RECURSIVE_CONTENT_DEPTH,
	MAX_RECURSIVE_CONTENT_NODES,
	RecursiveContentBlocksSchema,
} from "./schemas/content-union.js";
import { DisclosureSchema } from "./schemas/disclosure.js";
import { McpCommonSchema } from "./schemas/foundations.js";
import { PageSchema } from "./schemas/page.js";
import { SectionSchema } from "./schemas/section.js";
import { UtilityReferenceSchema } from "./schemas/utility-reference.js";
import { buildCardGroup } from "./templates/card-group.js";
import { createCompositionRenderer } from "./templates/composition-renderer.js";
import { buildDisclosure } from "./templates/disclosure.js";
import { STACK_CLASSES } from "./templates/form.js";
import { buildPage } from "./templates/page.js";
import { buildSection } from "./templates/section.js";
import { buildUtilityReference } from "./templates/utility-reference.js";
import { buildComponentDocsTool } from "./tool-builders/component-docs.js";
import {
	type ComponentToolStrategy,
	getComponentToolCategory,
	getComponentToolStrategy,
} from "./tool-builders/component-tools.js";
import { buildInteractiveTool } from "./tool-builders/interactive.js";
import { buildLayoutTool } from "./tool-builders/layout.js";
import {
	assertStrictValidationOrThrow,
	ComponentOutputSchema,
	getComponentToolName,
	getComponentToolTitle,
	KERN_TOOL_ANNOTATIONS,
	statusBanner,
	statusWarnings,
	type ToolAnnotations,
	type ToolDef,
} from "./tool-builders/shared.js";
import { buildTypographyTool } from "./tool-builders/typography.js";
import { withToolHint } from "./tool-hints.js";
import type { ComponentInfo, Locale, Registry } from "./types.js";
import { validateHtmlStrict } from "./validate.js";
import { ValidationResultSchema } from "./validate.schema.js";

type ToolRegistry = {
	/** Everything clients see in tools/list, as the domain defines it. */
	listTools(): Array<{
		name: string;
		title: string;
		description: string;
		inputSchema: Record<string, unknown>;
		outputSchema: Record<string, unknown>;
		annotations: Readonly<ToolAnnotations>;
	}>;
	listToolNames(): string[];
	getTool(name: string): ToolDef | undefined;
};

function buildComponentTool(component: ComponentInfo): ToolDef {
	const name = getComponentToolName(component);

	const inputSchema = z.object({ ...McpCommonSchema.shape });

	const outputSchema = ComponentOutputSchema;

	const descriptionOverrides: Record<string, string> = {
		pattern:
			"KERN UX: KERN's header pattern as fixed HTML (flex and grid variants). There is no footer pattern: " +
			"render_page renders a page with header and footer, and render_composition can build one from a section and a 4-column grid.",
	};

	return {
		name,
		description:
			descriptionOverrides[component.id] ??
			`KERN UX: KERN's example HTML for ${component.title}, as is. No parameters besides locale and strict.`,
		inputSchema,
		outputSchema,
		handler: async (args: { locale?: Locale; strict?: boolean }) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;

			const htmlFromStory = component.htmlCanonical;

			// Fallback placeholder: still validates and will fail strict mode for components with required a11y.
			const html =
				statusBanner(component) +
				(htmlFromStory ??
					`<!-- TODO: No story template found for ${component.id}. -->\n<div class="kern-${component.id}"></div>`);

			const validation = validateHtmlStrict(html);

			assertStrictValidationOrThrow({ name, locale, strict, validation });

			return {
				html,
				warnings: statusWarnings(component),
				validation,
			};
		},
	};
}

/**
 * Upper bound for validate_html input. Far above any generated page, and well
 * below the 4 MiB request-body cap of the SDK's HTTP transport (worst case
 * ~2 MB of UTF-8), so oversized input fails with a clear hint.
 */
export const VALIDATE_HTML_MAX_LENGTH = 500_000;

function buildValidateHtmlTool(): ToolDef {
	const name = "validate_html";

	const inputSchema = z.object({
		html: z
			.string()
			.max(VALIDATE_HTML_MAX_LENGTH)
			.describe(
				"The complete HTML markup string to check. Pass the html value of a get_* result as is, not a file path or file name.",
			),
		locale: z
			.enum(["de", "en"])
			.optional()
			.describe("Ignored: the messages come in German and English."),
	});

	const outputSchema = ValidationResultSchema;

	return {
		name,
		title: "Validate KERN HTML",
		description:
			"KERN UX: Checks HTML against KERN's accessibility rules (BITV) and returns the issues. " +
			"html takes the full markup string, not a file path: pass the html value of a get_* result.",
		inputSchema,
		outputSchema,
		// Messages are returned in both languages, so the locale input doesn't change the result.
		handler: async (args: { html: string }) => {
			return validateHtmlStrict(args.html);
		},
	};
}

function buildListIconsTool(): ToolDef {
	return {
		name: "list_icons",
		title: "KERN Icon Names",
		description: "KERN UX: Lists every KERN icon name.",
		inputSchema: z.object({}),
		outputSchema: z.object({ icons: z.array(z.string()) }),
		handler: async () => ({ icons: [...VALID_ICON_NAMES] }),
	};
}

function buildGetTokensTool(registry: Registry): ToolDef {
	return {
		name: "get_tokens",
		title: "KERN Design Tokens",
		description:
			"KERN UX: Lists the names of KERN's CSS custom properties: colours, spacing and all variables.",
		inputSchema: z.object({}),
		outputSchema: z.object({
			colors: z.array(z.string()),
			spacing: z.array(z.string()),
			rawVariables: z.array(z.string()),
		}),
		handler: async () => registry.tokens,
	};
}

function buildGetUtilityReferenceTool(): ToolDef {
	const inputSchema = UtilityReferenceSchema;

	return {
		name: "get_utility_reference",
		title: "KERN Utility Classes",
		description:
			"KERN UX: Reference for KERN's CSS utility classes: flex, CSS grid, gap, spacing, stack, alignment, and Surface (background colours). " +
			"KERN has no kern-bg-* classes: backgrounds use CSS custom properties such as --kern-color-background-subtle, listed under category 'surface'.",
		inputSchema,
		outputSchema: z.object({
			sections: z.array(
				z.object({
					id: z.string(),
					titleDe: z.string(),
					titleEn: z.string(),
					descriptionDe: z.string(),
					descriptionEn: z.string(),
					entries: z.array(
						z.object({
							className: z.string(),
							de: z.string(),
							en: z.string(),
							example: z.string().optional(),
						}),
					),
				}),
			),
		}),
		handler: async (args: z.input<typeof inputSchema>) =>
			buildUtilityReference(args),
	};
}

function buildListComponentsByCategoryTool(registry: Registry): ToolDef {
	const inputSchema = z.object({
		category: z.enum(["foundational", "interactive", "composition"]).optional(),
	});

	const compositionComponents = [
		{ id: "section", title: "Section" },
		{ id: "card_group", title: "CardGroup" },
		{ id: "disclosure", title: "Disclosure" },
	] as const;

	return {
		name: "list_components_by_category",
		title: "KERN Components by Category",
		description:
			"KERN UX: Lists every component ID with its title, category and strategy. " +
			"Call it before get_component_docs or a get_<id> tool when you don't know the ID.",
		inputSchema,
		outputSchema: z.object({
			components: z.array(
				z.object({
					id: z.string(),
					title: z.string(),
					category: z.enum(["foundational", "interactive", "composition"]),
					strategy: z.enum([
						"interactive",
						"layout",
						"typography",
						"fallback",
						"composition",
					]),
				}),
			),
		}),
		handler: async (args: z.infer<typeof inputSchema>) => {
			// Components with a tool; the others are documented only.
			const manifestComponents = registry.components.flatMap((component) => {
				const strategy = getComponentToolStrategy(component.id);
				return strategy
					? [
							{
								id: component.id,
								title: component.title,
								category: getComponentToolCategory(strategy),
								strategy,
							},
						]
					: [];
			});

			const composed = compositionComponents.map((component) => ({
				...component,
				category: "composition" as const,
				strategy: "composition" as const,
			}));

			const allComponents = [...manifestComponents, ...composed];

			return {
				components: allComponents.filter(
					(component) => !args.category || component.category === args.category,
				),
			};
		},
	};
}

function buildGetSectionTool(): ToolDef {
	const inputSchema = SectionSchema;
	const outputSchema = ComponentOutputSchema;

	return {
		name: "get_section",
		title: "KERN Section",
		description:
			"KERN UX: HTML for a <section> with a heading, content blocks (text, html, badge or field) and an optional divider. " +
			"A composition helper of this repo, not a KERN component. For containers inside, use render_composition.",
		inputSchema,
		outputSchema,
		handler: async (args: z.input<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;
			const result = buildSection(args, locale);
			const validation = validateHtmlStrict(result.html);
			assertStrictValidationOrThrow({
				name: "get_section",
				locale,
				strict,
				validation,
			});
			return { html: result.html, warnings: result.warnings, validation };
		},
	};
}

function buildGetCardGroupTool(): ToolDef {
	const inputSchema = CardGroupSchema;
	const outputSchema = ComponentOutputSchema;

	return {
		name: "get_card_group",
		title: "KERN Card Group",
		description:
			"KERN UX: HTML for 1 to 6 cards side by side on KERN's CSS Grid utilities (kern-grid kern-grid-cols-{n}-md), one per row on small screens. " +
			"Each card: an optional image, header, body text or simple blocks, and footer buttons.",
		inputSchema,
		outputSchema,
		handler: async (args: z.input<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;
			const result = buildCardGroup(args, locale);
			const validation = validateHtmlStrict(result.html);
			assertStrictValidationOrThrow({
				name: "get_card_group",
				locale,
				strict,
				validation,
			});
			return { html: result.html, warnings: result.warnings, validation };
		},
	};
}

function buildGetDisclosureTool(): ToolDef {
	const inputSchema = DisclosureSchema;
	const outputSchema = ComponentOutputSchema;

	return {
		name: "get_disclosure",
		title: "KERN Disclosure",
		description:
			"KERN UX: HTML for one expandable area: <details>/<summary> with the kern-accordion classes. " +
			"Required: triggerLabel, and contentBlocks or content. For several items, use get_accordion with mode 'group'.",
		inputSchema,
		outputSchema,
		handler: async (args: z.input<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;
			const result = buildDisclosure(args, locale);
			const validation = validateHtmlStrict(result.html);
			assertStrictValidationOrThrow({
				name: "get_disclosure",
				locale,
				strict,
				validation,
			});
			return { html: result.html, warnings: result.warnings, validation };
		},
	};
}

/* ------------------------------------------------------------------ */
/*  Cheat sheet for render_composition content blocks                  */
/* ------------------------------------------------------------------ */

export const COMPOSITION_VALID_KINDS = [
	"text",
	"html",
	"button",
	"badge",
	"field",
	"fieldset",
	"form",
	"card",
	"section",
	"disclosure",
	"grid",
	"formFlow",
] as const;

export const COMPOSITION_CHEAT_SHEET = [
	"Every block must have a 'kind' discriminator. Valid kinds and their shapes:",
	"",
	'  text:       { kind: "text", text: "..." }',
	'  html:       { kind: "html", html: "<p>...</p>" }',
	'  button:     { kind: "button", button: { label: "OK", variant: "primary" } }',
	'  badge:      { kind: "badge", badge: { type: "info", text: "Neu" } }',
	'  field:      { kind: "field", field: { type: "email", name: "email", label: "E-Mail", hint?: "...", error?: "..." } }',
	"                 type: text|email|tel|url|number|date|password|textarea|select|radio|checkbox; select/radio need options: [{ value, label }].",
	'  fieldset:   { kind: "fieldset", fieldset: { legend: "...", legendSize?: "large", hint?: "...", contentBlocks: [field, ...] } }',
	'  form:       { kind: "form", form: { action?: "/senden", errorSummary?: {}, contentBlocks: [fieldset, field, ...], actions?: { submitLabel: "Absenden" } } }',
	"                 errorSummary lists every field inside the form that has an error, linked to the field.",
	'  card:       { kind: "card", card: { header: { title: "..." }, body: "...", contentBlocks?: [...], footer?: { primaryLabel: "..." } } }',
	'  section:    { kind: "section", section: { headingText: "...", contentBlocks: [...] } }',
	'                 Shorthand: paragraphs: ["text1", "text2"] is also accepted (auto-converted to text blocks).',
	'  disclosure: { kind: "disclosure", disclosure: { triggerLabel: "...", contentBlocks: [...] } }; content: "..." also works',
	'  grid:       { kind: "grid", grid: { columnsContent: [ [block, block], [block], [block] ] } }',
	"                 One inner array of blocks per column, up to 12; columns defaults to their number.",
	'  formFlow:   { kind: "formFlow", formFlow: { currentStep: 1, heading?: "...", steps: [{ label: "...", contentBlocks: [...] }, ...], navigation?: { backLabel, nextLabel, submitLabel } } }',
	"                 The steps render inside a form; renderAllSteps: true renders every step, the inactive ones hidden.",
	"",
	"Nested blocks (section.contentBlocks, card.contentBlocks, grid.columnsContent[][], disclosure.contentBlocks, fieldset.contentBlocks, form.contentBlocks) use the same kind-based shapes recursively.",
	"Rules: forms don't nest (no form or formFlow inside a form or formFlow); no card directly inside a card; a section needs contentBlocks or paragraphs, a disclosure contentBlocks or content.",
	`Limits: blocks nest at most ${MAX_RECURSIVE_CONTENT_DEPTH} levels deep, ${MAX_RECURSIVE_CONTENT_NODES} blocks in all.`,
].join("\n");

function buildRenderCompositionTool(): ToolDef {
	const inputSchema = z.object({
		...McpCommonSchema.shape,
		contentBlocks: RecursiveContentBlocksSchema.refine(
			(blocks) => blocks.length > 0,
			{ error: "Add at least one block." },
		).describe("The top-level blocks, at least one."),
	});

	const outputSchema = ComponentOutputSchema;

	return {
		name: "render_composition",
		title: "Render KERN Composition",
		description:
			"KERN UX: Renders nested content blocks as one layout: sections, grids, cards, disclosures, forms and multi-step forms (formFlow).\n\n" +
			COMPOSITION_CHEAT_SHEET,
		inputSchema,
		outputSchema,
		handler: async (args: z.input<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;

			// Several blocks stack with KERN spacing, like a form's content.
			const stacked = args.contentBlocks.length > 1;
			const blocks = createCompositionRenderer(locale).renderBlocks(
				args.contentBlocks,
				1,
				{ stacked },
			);
			const rendered = stacked
				? {
						...blocks,
						html: `<div class="${STACK_CLASSES}">
  ${blocks.html}
</div>`,
					}
				: blocks;

			const validation = validateHtmlStrict(rendered.html);
			assertStrictValidationOrThrow({
				name: "render_composition",
				locale,
				strict,
				validation,
			});

			return { html: rendered.html, warnings: rendered.warnings, validation };
		},
	};
}

function buildRenderPageTool(registry: Registry): ToolDef {
	const inputSchema = PageSchema;
	const outputSchema = ComponentOutputSchema;

	return {
		name: "render_page",
		title: "Render KERN Page",
		description:
			"KERN UX: Renders a whole page: an optional Kopfzeile, a header with brand and navigation, " +
			"<main> with an h1 and content blocks (the same kinds as render_composition), and a footer with up to four link columns. " +
			"document: true returns a complete HTML document that loads the KERN stylesheets.",
		inputSchema,
		outputSchema,
		handler: async (args: z.input<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;
			const result = buildPage(args, locale, {
				kernVersion: registry.upstream?.version,
			});
			const validation = validateHtmlStrict(result.html);
			assertStrictValidationOrThrow({
				name: "render_page",
				locale,
				strict,
				validation,
			});
			return { html: result.html, warnings: result.warnings, validation };
		},
	};
}

/** The tool builder for each strategy in COMPONENT_TOOLS. */
const COMPONENT_TOOL_BUILDERS: Record<
	ComponentToolStrategy,
	(component: ComponentInfo) => ToolDef
> = {
	interactive: buildInteractiveTool,
	layout: buildLayoutTool,
	typography: buildTypographyTool,
	fallback: buildComponentTool,
};

export function createTools(registry: Registry): ToolRegistry {
	const toolDefs: ToolDef[] = [];

	toolDefs.push(buildValidateHtmlTool());
	toolDefs.push(buildComponentDocsTool(registry));
	toolDefs.push(buildGetTokensTool(registry));
	toolDefs.push(buildListIconsTool());
	toolDefs.push(buildListComponentsByCategoryTool(registry));
	toolDefs.push(buildGetUtilityReferenceTool());

	// Composition tools
	toolDefs.push(buildRenderCompositionTool());
	toolDefs.push(buildRenderPageTool(registry));
	toolDefs.push(buildGetSectionTool());
	toolDefs.push(buildGetCardGroupTool());
	toolDefs.push(buildGetDisclosureTool());

	// One get_* tool per component in COMPONENT_TOOLS, in registry order and titled
	// from the registry. Registry components without an entry get no tool.
	for (const component of registry.components) {
		const strategy = getComponentToolStrategy(component.id);
		if (!strategy) continue;
		toolDefs.push({
			...COMPONENT_TOOL_BUILDERS[strategy](component),
			title: getComponentToolTitle(component),
		});
	}

	// KERN guidance in one line, where it changes a choice (tool-hints.ts).
	for (const tool of toolDefs) {
		tool.description = withToolHint(tool.name, tool.description);
	}

	const untitled = toolDefs.filter((tool) => !tool.title?.trim());
	if (untitled.length > 0) {
		throw new Error(
			`Tools without a title: ${untitled.map((tool) => tool.name).join(", ")}.`,
		);
	}

	const byName = new Map(toolDefs.map((t) => [t.name, t] as const));

	// Tool definitions are fixed once created. The JSON Schemas are memoised per Zod
	// schema (shared with the MCP adapter), so callers must not mutate the result.
	let listing: ReturnType<ToolRegistry["listTools"]> | undefined;

	return {
		listTools: () => {
			listing ??= toolDefs.map((t) => ({
				name: t.name,
				title: t.title ?? t.name,
				description: t.description,
				inputSchema: getToolInputJsonSchema(t.inputSchema),
				outputSchema: getToolOutputJsonSchema(t.outputSchema),
				annotations: KERN_TOOL_ANNOTATIONS,
			}));
			return listing;
		},
		listToolNames: () => toolDefs.map((tool) => tool.name),
		getTool: (name) => byName.get(name),
	};
}
