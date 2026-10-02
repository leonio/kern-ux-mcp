import { z } from "zod";
import { pickLocale } from "./i18n.js";
import {
	getToolInputJsonSchema,
	getToolOutputJsonSchema,
} from "./json-schema.js";
import { CardGroupSchema } from "./schemas/card-group.js";
import { RecursiveContentBlocksSchema } from "./schemas/content-union.js";
import { DisclosureSchema } from "./schemas/disclosure.js";
import { PageSchema } from "./schemas/page.js";
import { SectionSchema } from "./schemas/section.js";
import { UtilityReferenceSchema } from "./schemas/utility-reference.js";
import { buildCardGroup } from "./templates/card-group.js";
import { createCompositionRenderer } from "./templates/composition-renderer.js";
import { buildDisclosure } from "./templates/disclosure.js";
import { buildPage } from "./templates/page.js";
import { buildSection } from "./templates/section.js";
import { buildUtilityReference } from "./templates/utility-reference.js";
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
import { getToolNotes } from "./tool-notes.js";
import type {
	ComponentInfo,
	Locale,
	Registry,
	ReviewedGuidanceStatement,
} from "./types.js";
import { VALID_ICON_NAMES } from "./types.js";
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

const CommonParams = {
	locale: z
		.enum(["de", "en"])
		.optional()
		.describe("Sprache für Tool-Strings (Standard: de)."),
	strict: z
		.boolean()
		.optional()
		.describe(
			"Wenn true: bei Validierungsfehlern wird kein HTML geliefert (BITV-strikt).",
		),
};

function buildComponentTool(component: ComponentInfo): ToolDef {
	const name = getComponentToolName(component);

	const inputSchema = z
		.object({
			...CommonParams,
			// Visible text is caller-controlled; we intentionally keep this minimal at first.
			// Component-specific params can be added later via generator.
		})
		.describe(
			`Gibt korrektes HTML für die KERN UX Komponente '${component.title}' zurück.`,
		);

	const outputSchema = ComponentOutputSchema;

	const descriptionOverrides: Record<string, string> = {
		pattern:
			"KERN UX: Liefert kanonisches HTML für ein Layout-Pattern (aktuell nur Header-Pattern mit Flex/Grid-Variante). " +
			"KEINE Footer-Patterns vorhanden. Für Footer: verwende render_composition mit Section (aria-label) + Grid (4 columns) + verschachtelte Blöcke.",
	};

	return {
		name,
		description:
			descriptionOverrides[component.id] ??
			`KERN UX: HTML für ${component.title} erzeugen (mit optionaler strikter Validierung).`,
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

	const inputSchema = z
		.object({
			html: z
				.string()
				.max(VALIDATE_HTML_MAX_LENGTH)
				.describe(
					"Der vollständige HTML-Markup-String, der validiert werden soll. Den 'html'-Wert aus einem get_*-Tool-Ergebnis direkt übergeben (kein Dateipfad, kein Dateiname – nur der Markup-String).",
				),
			locale: z
				.enum(["de", "en"])
				.optional()
				.describe("Sprache für Fehlermeldungen (Standard: de)."),
		})
		.describe(
			"Validiert HTML strikt gegen KERN UX A11Y-Regeln (BITV-orientiert).",
		);

	const outputSchema = ValidationResultSchema;

	return {
		name,
		title: "Validate KERN HTML",
		description:
			"KERN UX: HTML strikt validieren (A11Y/BITV). Der Parameter 'html' erwartet den vollständigen Markup-String – keinen Dateipfad. Den 'html'-Wert aus einem get_*-Tool direkt übergeben.",
		inputSchema,
		outputSchema,
		// Messages are returned in both languages, so the locale input doesn't change the result.
		handler: async (args: { html: string }) => {
			return validateHtmlStrict(args.html);
		},
	};
}

function buildDocsTool(registry: Registry): ToolDef {
	const name = "get_component_docs";

	const reviewedGuidanceEvidenceSchema = z.object({
		kind: z.enum([
			"docs-snapshot",
			"story",
			"scss",
			"schema",
			"template",
			"test",
			"manual-review",
			"other",
		]),
		source: z.string(),
		locator: z.string().optional(),
		note: z.string().optional(),
	});

	const reviewedGuidanceStatementSchema = z.object({
		text: z.string(),
		confidence: z.enum(["high", "medium", "low"]),
		evidence: z.array(reviewedGuidanceEvidenceSchema),
	});

	const inputSchema = z
		.object({
			componentId: z
				.string()
				.describe(
					"Komponenten-ID aus list_components_by_category, z.B. 'button', 'inputtext', 'select', 'checkbox'. IDs sind kleingeschrieben ohne Bindestriche – 'inputtext' nicht 'input-text', 'form-input' existiert nicht. Unbekannte ID: zuerst list_components_by_category aufrufen.",
				),
			locale: z
				.enum(["de", "en"])
				.optional()
				.describe("Sprache für Zusammenfassung (Standard: de)."),
		})
		.describe(
			"Liest vereinfachte, paketierte Komponentendokumentation aus dem Runtime-Manifest.",
		);

	const outputSchema = z.object({
		componentId: z.string(),
		status: z.enum(["stable", "experimental", "deprecated"]),
		files: z.array(z.string()),
		excerpt: z.string(),
		canonicalHtml: z.string().optional(),
		sections: z
			.array(
				z.object({
					source: z.string(),
					heading: z.string(),
					content: z.string(),
				}),
			)
			.optional(),
		reviewedGuidance: z
			.object({
				status: z.enum(["draft", "reviewed", "approved"]),
				summary: reviewedGuidanceStatementSchema,
				primaryUseCases: z.array(reviewedGuidanceStatementSchema),
				antiUseCases: z.array(reviewedGuidanceStatementSchema),
				requiredA11yPractices: z.array(reviewedGuidanceStatementSchema),
				semanticInvariants: z.array(reviewedGuidanceStatementSchema),
				compositionPatterns: z.array(reviewedGuidanceStatementSchema),
				authoringNotes: z.array(reviewedGuidanceStatementSchema),
				migrationNotes: z.array(reviewedGuidanceStatementSchema),
			})
			.optional(),
		relatedTools: z.array(z.string()).optional(),
	});

	return {
		name,
		title: "KERN Component Docs",
		description:
			"KERN UX: Dokumentation zu einer Komponente lesen. Gültige IDs liefert list_components_by_category – bei unbekannter ID dieses Tool zuerst aufrufen.",
		inputSchema,
		outputSchema,
		handler: async (args: { componentId: string; locale?: Locale }) => {
			const component = registry.byId.get(args.componentId);
			if (!component) {
				throw new Error(`Unknown componentId: ${args.componentId}`);
			}

			const locale = pickLocale(args.locale);

			const excerpt =
				component.docs?.excerpt ??
				`No packaged component documentation available for '${component.id}'.`;

			// Build file list from manifest sources
			const files: string[] = ["registry.json"];
			if (component.sources?.scss) {
				files.push(...component.sources.scss);
			}
			if (component.sources?.stories) {
				files.push(...component.sources.stories);
			}

			// Build sections from structured guidance
			const sections = (component.docs?.sections ?? []).map((s) => ({
				source: s.source,
				heading: s.heading,
				content: s.content,
			}));

			// Reviewed notes about our tool come from code (tool-notes.ts), not the registry.
			const notes = getToolNotes(component.id);

			const mapEvidence = (
				entry: ReviewedGuidanceStatement["evidence"][number],
			) => ({
				kind: entry.kind,
				source: entry.source,
				locator: entry.locator,
				note: entry.note
					? locale === "en"
						? entry.note.en
						: entry.note.de
					: undefined,
			});

			const mapStatement = (statement: ReviewedGuidanceStatement) => ({
				text: locale === "en" ? statement.text.en : statement.text.de,
				confidence: statement.confidence,
				evidence: statement.evidence.map(mapEvidence),
			});

			const reviewedGuidance = notes
				? {
						status: notes.status,
						summary: mapStatement(notes.summary),
						primaryUseCases: notes.primaryUseCases.map(mapStatement),
						antiUseCases: notes.antiUseCases.map(mapStatement),
						requiredA11yPractices:
							notes.requiredA11yPractices.map(mapStatement),
						semanticInvariants: notes.semanticInvariants.map(mapStatement),
						compositionPatterns: notes.compositionPatterns.map(mapStatement),
						authoringNotes: notes.authoringNotes.map(mapStatement),
						migrationNotes: notes.migrationNotes.map(mapStatement),
					}
				: undefined;

			// Suggest related tools based on component type
			const relatedTools: string[] = [];
			const strategy = getComponentToolStrategy(component.id);
			if (strategy && getComponentToolCategory(strategy) === "interactive") {
				relatedTools.push("get_grid", "validate_html");
			}
			if (component.id === "button") {
				relatedTools.push("get_icon", "list_icons");
			}
			if (component.id === "dialog") {
				relatedTools.push("get_button");
			}
			if (component.id === "card") {
				relatedTools.push("get_button", "get_card_group");
			}

			return {
				componentId: component.id,
				status: component.status,
				files,
				excerpt,
				canonicalHtml: component.htmlCanonical,
				sections: sections.length > 0 ? sections : undefined,
				reviewedGuidance,
				relatedTools: relatedTools.length > 0 ? relatedTools : undefined,
			};
		},
	};
}

function buildListIconsTool(): ToolDef {
	return {
		name: "list_icons",
		title: "KERN Icon Names",
		description: "KERN UX (Utility): Liefert alle verfügbaren Icon-Namen.",
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
			"KERN UX (Utility): Liefert Token-Snapshot aus dem Build-Manifest (Farben, Spacing, Variablen).",
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
			"KERN UX (Utility): Referenz für CSS-Hilfsklassen (Flex, CSS Grid, Gap, Spacing, Surface/Background, Stack, Alignment). " +
			"Verwende dieses Tool, wenn du Layouts mit Flex- oder Grid-Utilities, Abständen, Ausrichtung oder Hintergrundfarben brauchst. " +
			"WICHTIG: KERN hat KEINE kern-bg-* Utility-Klassen. Hintergrundfarben nur über CSS Custom Properties (z.B. --kern-color-background-subtle). Kategorie 'surface' liefert alle verfügbaren Variablen.",
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
			"KERN UX (Discovery): Alle Komponenten-IDs auflisten. Vor get_component_docs oder get_<id>-Tools aufrufen, wenn die Komponenten-ID unbekannt ist. Liefert id, title, category und strategy für jede Komponente.",
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
			"KERN UX (Komposition): Erzeugt eine <section> mit Heading, Body-Absätzen und optionalem Divider. " +
			"Verwende dieses Tool anstelle von get_heading + get_body einzeln. " +
			"Known-good payload: { headingText: 'Überblick', headingLevel: 2, paragraphs: ['Erster Absatz', 'Zweiter Absatz'], paragraphSize: 'default', paragraphBold: false, divider: false }.",
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
			"KERN UX (Komposition): Erzeugt mehrere Cards in einem responsive 12-Spalten-Grid " +
			"(kern-container/kern-row/kern-col-md-{n} kern-col-sm-12). " +
			"Spaltenbreite wird automatisch berechnet (12 / columns). " +
			"Verwende dieses Tool anstelle von get_card + get_grid einzeln. " +
			"Known-good payload: { columns: 3, cards: [{ header: { title: 'Service A' }, body: 'Kurzbeschreibung', footer: { primaryLabel: 'More Info' } }] }.",
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
			"KERN UX (Komposition): Erzeugt ein Expand/Collapse-Element (<details>/<summary>) mit KERN Accordion-Styling (kern-accordion__item / kern-accordion__body). " +
			"Pflichtfelder: triggerLabel UND (contentBlocks oder content). " +
			"Beispiel: { triggerLabel: 'Details anzeigen', content: 'Erklärungstext' }. " +
			"Für mehrteilige Akkordeons (mehrere Items) siehe get_accordion.",
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
	'  card:     { kind: "card", card: { header: { title: "..." }, body: "...", contentBlocks?: [...], footer?: { primaryLabel: "..." } } }',
	'  section:    { kind: "section", section: { headingText: "...", contentBlocks: [...] } }',
	'                 Shorthand: paragraphs: ["text1", "text2"] is also accepted (auto-converted to text blocks).',
	'  disclosure: { kind: "disclosure", disclosure: { triggerLabel: "...", contentBlocks: [...] } }',
	'  grid:       { kind: "grid", grid: { columns: 3, columnsContent: [ [block, block], [block], [block] ] } }',
	"                 columnsContent is an array of arrays — one inner array per column. Each inner array holds content blocks.",
	'  formFlow:   { kind: "formFlow", formFlow: { currentStep: 1, heading?: "...", steps: [{ label: "...", contentBlocks: [...] }, ...], navigation?: { backLabel, nextLabel, submitLabel } } }',
	"                 The steps render inside a form; renderAllSteps: true renders every step, the inactive ones hidden.",
	"",
	"Nested blocks (section.contentBlocks, card.contentBlocks, grid.columnsContent[][], disclosure.contentBlocks, fieldset.contentBlocks, form.contentBlocks) use the same kind-based shapes recursively.",
	"Rules: forms don't nest (no form or formFlow inside a form or formFlow); no card directly inside a card; a section needs contentBlocks or paragraphs, a disclosure needs contentBlocks.",
].join("\n");

function buildRenderCompositionTool(): ToolDef {
	const inputSchema = z
		.object({
			...CommonParams,
			contentBlocks: RecursiveContentBlocksSchema.refine(
				(blocks) => blocks.length > 0,
				{
					error: "Mindestens ein Content-Block ist erforderlich.",
				},
			).describe(
				"Wurzel-Content-Blöcke für rekursive Komposition (mindestens ein Block).",
			),
		})
		.describe(
			"Master-Kompositionstool für rekursive KERN-Layouts. " +
				"Kombiniert Grid, Card, Section und Disclosure in einer einzigen Struktur.",
		);

	const outputSchema = ComponentOutputSchema;

	return {
		name: "render_composition",
		title: "Render KERN Composition",
		description:
			"KERN UX (Komposition): Rendert rekursive Content-Blöcke als zusammenhängendes Layout. " +
			"WICHTIG: Jeder Block in contentBlocks MUSS eine 'kind'-Eigenschaft haben. " +
			`Gültige kind-Werte: ${COMPOSITION_VALID_KINDS.join(", ")}.\n\n` +
			COMPOSITION_CHEAT_SHEET +
			"\n\nFormFlow orchestriert mehrstufige Formulare mit Tasklist + Progress + Schritt-Inhalt über einen einzigen currentStep-Parameter.",
		inputSchema,
		outputSchema,
		handler: async (args: z.input<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;

			const rendered = createCompositionRenderer(locale).renderBlocks(
				args.contentBlocks,
				1,
			);

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
			"KERN UX (Komposition): Renders a whole page: an optional Kopfzeile, a header with brand and navigation, " +
			"<main> with an h1 and content blocks (the same kinds as render_composition), and a footer with up to four link columns. " +
			"document: true returns a complete HTML document that loads the KERN stylesheets. " +
			"Example: { heading: 'Wohngeld beantragen', header: { title: 'Stadt Musterstadt', navigation: [{ label: 'Start', href: '/' }] }, " +
			"contentBlocks: [{ kind: 'section', section: { headingText: 'Voraussetzungen', paragraphs: ['...'] } }], " +
			"footer: { columns: [{ heading: 'Service', links: [{ label: 'Kontakt', href: '/kontakt' }] }] } }.",
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
	toolDefs.push(buildDocsTool(registry));
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
