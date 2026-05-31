import { z } from "zod";
import { pickLocale } from "./i18n.js";
import { toolInputSchemaToJsonSchema } from "./json-schema.js";
import { CardGroupSchema } from "./schemas/card-group.js";
import {
	MAX_RECURSIVE_CONTENT_DEPTH,
	RecursiveContentBlocksSchema,
} from "./schemas/content-union.js";
import { DisclosureSchema } from "./schemas/disclosure.js";
import { SectionSchema } from "./schemas/section.js";
import { UtilityReferenceSchema } from "./schemas/utility-reference.js";
import { buildCard } from "./templates/card.js";
import { buildCardGroup } from "./templates/card-group.js";
import { renderRecursiveContentBlocks } from "./templates/content-union.js";
import { buildDisclosure } from "./templates/disclosure.js";
import { buildGrid } from "./templates/grid.js";
import { buildSection } from "./templates/section.js";
import { buildUtilityReference } from "./templates/utility-reference.js";
import { buildInteractiveTool } from "./tool-builders/interactive.js";
import {
	buildLayoutTool,
	LAYOUT_MANIFEST_IDS,
} from "./tool-builders/layout.js";
import {
	assertStrictValidationOrThrow,
	getComponentToolName,
	statusBanner,
	statusWarnings,
	type ToolDef,
} from "./tool-builders/shared.js";
import {
	buildTypographyTool,
	TYPOGRAPHY_MANIFEST_IDS,
} from "./tool-builders/typography.js";
import type { ComponentInfo, Locale, Registry } from "./types.js";
import { VALID_ICON_NAMES } from "./types.js";
import { validateHtmlStrict } from "./validate.js";

type ToolRegistry = {
	listTools(): Array<{
		name: string;
		description: string;
		inputSchema: ReturnType<typeof toolInputSchemaToJsonSchema>;
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

function getCanonicalHtmlFromManifest(component: ComponentInfo) {
	return component.htmlCanonical;
}

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

	const outputSchema = z.object({
		html: z.string(),
		validation: z
			.object({
				ok: z.boolean(),
				issues: z
					.array(
						z.object({
							ruleId: z.string(),
							severity: z.enum(["error", "warning"]),
							message: z.object({ en: z.string(), de: z.string() }),
							selectorHint: z.string().optional(),
						}),
					)
					.default([]),
			})
			.describe("Validierungsergebnis (strict-mode relevant)."),
	});

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

			const htmlFromStory = getCanonicalHtmlFromManifest(component);

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

function buildValidateHtmlTool(): ToolDef {
	const name = "validate_html";

	const inputSchema = z
		.object({
			html: z
			.string()
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

	const outputSchema = z.object({
		ok: z.boolean(),
		issues: z.array(
			z.object({
				ruleId: z.string(),
				severity: z.enum(["error", "warning"]),
				message: z.object({ en: z.string(), de: z.string() }),
				selectorHint: z.string().optional(),
			}),
		),
	});

	return {
		name,
		description:
			"KERN UX: HTML strikt validieren (A11Y/BITV). Der Parameter 'html' erwartet den vollständigen Markup-String – keinen Dateipfad. Den 'html'-Wert aus einem get_*-Tool direkt übergeben.",
		inputSchema,
		outputSchema,
		handler: async (args: { html: string; locale?: Locale }) => {
			const _locale = pickLocale(args.locale);
			// We always return both languages in the payload; caller can choose.
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

			const mapEvidence = (
				entry: NonNullable<
					typeof component.reviewedGuidance
				>["summary"]["evidence"][number],
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

			const mapStatement = (
				statement: NonNullable<typeof component.reviewedGuidance>["summary"],
			) => ({
				text: locale === "en" ? statement.text.en : statement.text.de,
				confidence: statement.confidence,
				evidence: statement.evidence.map(mapEvidence),
			});

			const reviewedGuidance = component.reviewedGuidance
				? {
						status: component.reviewedGuidance.status,
						summary: mapStatement(component.reviewedGuidance.summary),
						primaryUseCases:
							component.reviewedGuidance.primaryUseCases.map(mapStatement),
						antiUseCases:
							component.reviewedGuidance.antiUseCases.map(mapStatement),
						requiredA11yPractices:
							component.reviewedGuidance.requiredA11yPractices.map(
								mapStatement,
							),
						semanticInvariants:
							component.reviewedGuidance.semanticInvariants.map(mapStatement),
						compositionPatterns:
							component.reviewedGuidance.compositionPatterns.map(mapStatement),
						authoringNotes:
							component.reviewedGuidance.authoringNotes.map(mapStatement),
						migrationNotes:
							component.reviewedGuidance.migrationNotes.map(mapStatement),
					}
				: undefined;

			// Suggest related tools based on component type
			const relatedTools: string[] = [];
			if (component.category === "interactive") {
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
		description: "KERN UX (Utility): Liefert alle verfügbaren Icon-Namen.",
		inputSchema: z.object({}),
		outputSchema: z.object({ icons: z.array(z.string()) }),
		handler: async () => ({ icons: [...VALID_ICON_NAMES] }),
	};
}

function buildGetTokensTool(registry: Registry): ToolDef {
	return {
		name: "get_tokens",
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
			const manifestComponents = registry.components.map((component) => ({
				id: component.id,
				title: component.title,
				category: component.category,
				strategy: component.strategy,
			}));

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
	const outputSchema = z.object({
		html: z.string(),
		warnings: z.array(z.string()).default([]),
		validation: z.object({
			ok: z.boolean(),
			issues: z
				.array(
					z.object({
						ruleId: z.string(),
						severity: z.enum(["error", "warning"]),
						message: z.object({ en: z.string(), de: z.string() }),
						selectorHint: z.string().optional(),
					}),
				)
				.default([]),
		}),
	});

	return {
		name: "get_section",
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
	const outputSchema = z.object({
		html: z.string(),
		warnings: z.array(z.string()).default([]),
		validation: z.object({
			ok: z.boolean(),
			issues: z
				.array(
					z.object({
						ruleId: z.string(),
						severity: z.enum(["error", "warning"]),
						message: z.object({ en: z.string(), de: z.string() }),
						selectorHint: z.string().optional(),
					}),
				)
				.default([]),
		}),
	});

	return {
		name: "get_card_group",
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
	const outputSchema = z.object({
		html: z.string(),
		warnings: z.array(z.string()).default([]),
		validation: z.object({
			ok: z.boolean(),
			issues: z
				.array(
					z.object({
						ruleId: z.string(),
						severity: z.enum(["error", "warning"]),
						message: z.object({ en: z.string(), de: z.string() }),
						selectorHint: z.string().optional(),
					}),
				)
				.default([]),
		}),
	});

	return {
		name: "get_disclosure",
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
	'  card:       { kind: "card", card: { header: { title: "..." }, body: "...", contentBlocks?: [...], footer?: { primaryLabel: "..." } } }',
	'  section:    { kind: "section", section: { headingText: "...", contentBlocks: [...] } }',
	'                 Shorthand: paragraphs: ["text1", "text2"] is also accepted (auto-converted to text blocks).',
	'  disclosure: { kind: "disclosure", disclosure: { triggerLabel: "...", contentBlocks: [...] } }',
	'  grid:       { kind: "grid", grid: { columns: 3, columnsContent: [ [block, block], [block], [block] ] } }',
	"                 columnsContent is an array of arrays — one inner array per column. Each inner array holds content blocks.",
	'  formFlow:   { kind: "formFlow", formFlow: { currentStep: 1, steps: [{ label: "...", contentBlocks: [...] }, ...] } }',
	"",
	"Nested blocks (section.contentBlocks, card.contentBlocks, grid.columnsContent[][], disclosure.contentBlocks) use the same kind-based shapes recursively.",
].join("\n");

function buildRenderCompositionTool(): ToolDef {
	const inputSchema = z
		.object({
			...CommonParams,
			contentBlocks: RecursiveContentBlocksSchema.refine(
				(blocks) => blocks.length > 0,
				{
					message: "Mindestens ein Content-Block ist erforderlich.",
				},
			).describe(
				"Wurzel-Content-Blöcke für rekursive Komposition (mindestens ein Block).",
			),
		})
		.describe(
			"Master-Kompositionstool für rekursive KERN-Layouts. " +
				"Kombiniert Grid, Card, Section und Disclosure in einer einzigen Struktur.",
		);

	const outputSchema = z.object({
		html: z.string(),
		warnings: z.array(z.string()).default([]),
		validation: z.object({
			ok: z.boolean(),
			issues: z
				.array(
					z.object({
						ruleId: z.string(),
						severity: z.enum(["error", "warning"]),
						message: z.object({ en: z.string(), de: z.string() }),
						selectorHint: z.string().optional(),
					}),
				)
				.default([]),
		}),
	});

	return {
		name: "render_composition",
		description:
			"KERN UX (Komposition): Rendert rekursive Content-Blöcke als zusammenhängendes Layout. " +
			"WICHTIG: Jeder Block in contentBlocks MUSS eine 'kind'-Eigenschaft haben. " +
			"Gültige kind-Werte: text, html, button, badge, card, section, disclosure, grid, formFlow.\n\n" +
			COMPOSITION_CHEAT_SHEET +
			"\n\nFormFlow orchestriert mehrstufige Formulare mit Tasklist + Progress + Schritt-Inhalt über einen einzigen currentStep-Parameter.",
		inputSchema,
		outputSchema,
		handler: async (args: z.input<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;

			const renderCardNode = (cardInput: unknown, nextDepth: number) =>
				buildCard(cardInput as Parameters<typeof buildCard>[0], locale, {
					depth: nextDepth,
					maxDepth: MAX_RECURSIVE_CONTENT_DEPTH,
					renderGridNode,
					renderSectionNode,
					renderDisclosureNode,
				});

			const renderGridNode = (gridInput: unknown, nextDepth: number) =>
				buildGrid(gridInput as Parameters<typeof buildGrid>[0], locale, {
					depth: nextDepth,
					maxDepth: MAX_RECURSIVE_CONTENT_DEPTH,
					renderSectionNode,
					renderDisclosureNode,
				});

			const renderSectionNode = (sectionInput: unknown, nextDepth: number) =>
				buildSection(
					sectionInput as Parameters<typeof buildSection>[0],
					locale,
					{
						depth: nextDepth,
						maxDepth: MAX_RECURSIVE_CONTENT_DEPTH,
						renderSectionNode,
						renderDisclosureNode,
					},
				);

			const renderDisclosureNode = (
				disclosureInput: unknown,
				nextDepth: number,
			) =>
				buildDisclosure(
					disclosureInput as Parameters<typeof buildDisclosure>[0],
					locale,
					{
						depth: nextDepth,
						maxDepth: MAX_RECURSIVE_CONTENT_DEPTH,
						renderSectionNode,
						renderDisclosureNode,
					},
				);

			const rendered = renderRecursiveContentBlocks(args.contentBlocks, {
				locale,
				currentDepth: 0,
				maxDepth: MAX_RECURSIVE_CONTENT_DEPTH,
				renderCardNode,
				renderGridNode,
				renderSectionNode,
				renderDisclosureNode,
			});

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
	toolDefs.push(buildGetSectionTool());
	toolDefs.push(buildGetCardGroupTool());
	toolDefs.push(buildGetDisclosureTool());

	// One get_* tool per component, with schema strategy chosen from manifest metadata.
	for (const component of registry.components) {
		const strategy = component.strategy;

		if (strategy === "interactive") {
			toolDefs.push(buildInteractiveTool(component, buildComponentTool));
			continue;
		}

		if (strategy === "layout") {
			toolDefs.push(buildLayoutTool(component));
			continue;
		}

		if (strategy === "typography") {
			toolDefs.push(buildTypographyTool(component));
			continue;
		}

		if (component.category === "interactive") {
			toolDefs.push(buildInteractiveTool(component, buildComponentTool));
			continue;
		}

		if (LAYOUT_MANIFEST_IDS.has(component.id)) {
			toolDefs.push(buildLayoutTool(component));
			continue;
		}

		if (TYPOGRAPHY_MANIFEST_IDS.has(component.id)) {
			toolDefs.push(buildTypographyTool(component));
			continue;
		}

		toolDefs.push(buildComponentTool(component));
	}

	const byName = new Map(toolDefs.map((t) => [t.name, t] as const));

	return {
		listTools: () =>
			toolDefs.map((t) => ({
				name: t.name,
				description: t.description,
				inputSchema: toolInputSchemaToJsonSchema(t.inputSchema, {
					name: t.name,
				}),
			})),
		listToolNames: () => toolDefs.map((tool) => tool.name),
		getTool: (name) => byName.get(name),
	};
}
