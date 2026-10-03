import { z } from "zod";
import { pickLocale } from "../i18n.js";
import { getToolNotes } from "../tool-notes.js";
import type {
	ComponentInfo,
	Locale,
	Registry,
	ReviewedGuidanceStatement,
} from "../types.js";
import { getComponentToolStrategy } from "./component-tools.js";
import type { ToolDef } from "./shared.js";

/**
 * Tools that go with a component's own tool, beyond what KERN's similar
 * components suggest: how our tools compose. Facts about this server, so code.
 */
const RELATED_TOOLS: Readonly<Record<string, readonly string[]>> = {
	button: ["get_icon", "list_icons"],
	card: ["get_button", "get_card_group"],
	dialog: ["get_button"],
	header: ["render_page", "get_pattern"],
	nav: ["render_page"],
};

/** The tool that renders a component, if the server has one. */
function toolFor(componentId: string): string | undefined {
	return getComponentToolStrategy(componentId)
		? `get_${componentId}`
		: undefined;
}

/**
 * A component by our ID (inputtext), KERN's (input-text), or either written
 * another way (InputText, input_text).
 */
export function findDocumentedComponent(
	registry: Registry,
	componentId: string,
): ComponentInfo | undefined {
	const exact =
		registry.byId.get(componentId) ??
		registry.components.find((component) => component.kernId === componentId);
	if (exact) return exact;

	const squashed = componentId.toLowerCase().replace(/[^a-z0-9]/g, "");
	return (
		registry.byId.get(squashed) ??
		registry.components.find(
			(component) => component.kernId?.replaceAll("-", "") === squashed,
		)
	);
}

const reviewedGuidanceStatementSchema = z.object({
	text: z.string(),
	confidence: z.enum(["high", "medium", "low"]),
	evidence: z.array(
		z.object({
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
		}),
	),
});

const inputSchema = z.object({
	componentId: z
		.string()
		.describe(
			"Component ID from list_components_by_category, e.g. 'button', 'inputtext', 'select', 'checkbox'. KERN's own IDs work too: 'input-text', 'checkboxes'.",
		),
	locale: z
		.enum(["de", "en"])
		.optional()
		.describe("Language of the notes about our tool (default: de)."),
});

const outputSchema = z.object({
	componentId: z.string(),
	kernId: z.string().optional(),
	title: z.string(),
	status: z.enum(["stable", "experimental", "deprecated", "docs-only"]),
	tool: z.string().optional().describe("The tool that renders the component."),
	note: z.string().optional(),
	summary: z.string().optional(),
	whenToUse: z.array(z.string()).optional(),
	whenNotToUse: z
		.array(
			z.object({
				text: z.string(),
				useInstead: z.string().optional(),
				tool: z.string().optional(),
			}),
		)
		.optional(),
	dos: z.array(z.string()).optional(),
	donts: z.array(z.string()).optional(),
	contentGuidelines: z.array(z.string()).optional(),
	similar: z
		.array(
			z.object({
				componentId: z.string().optional(),
				name: z
					.string()
					.optional()
					.describe("A component KERN doesn't have, e.g. Tooltip."),
				tool: z.string().optional(),
				difference: z.string().optional(),
			}),
		)
		.optional(),
	accessibility: z
		.array(
			z.object({
				criterion: z.string().optional(),
				slug: z.string(),
				level: z.enum(["A", "AA", "AAA"]).optional(),
				status: z.enum(["implementation-dependent", "failed", "unknown"]),
			}),
		)
		.optional()
		.describe(
			"The WCAG criteria KERN's docs leave to the implementation: what the author has to take care of.",
		),
	docs: z
		.object({
			url: z.string(),
			summary: z.string().optional(),
			sections: z.array(
				z.object({
					heading: z.string(),
					url: z.string(),
					summary: z.string().optional(),
				}),
			),
		})
		.optional()
		.describe("The component's page on kern-ux.de, section by section."),
	canonicalHtml: z.string().optional(),
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
		.optional()
		.describe("Where our tool deliberately differs from KERN."),
	relatedTools: z.array(z.string()).optional(),
});

type ComponentDocsResult = z.infer<typeof outputSchema>;

/**
 * get_component_docs: KERN's guidance for one component, from the knowledge
 * bundle by way of the registry, plus the notes about our tool from code.
 */
export function buildComponentDocsTool(registry: Registry): ToolDef {
	return {
		name: "get_component_docs",
		title: "KERN Component Docs",
		description:
			"KERN UX: KERN's guidance for one component, from kern-ux.de: summary, when to use it and when not, do's and don'ts, similar components, " +
			"the WCAG criteria left to the implementation, and the docs page by section; plus notes where our tool differs from KERN. " +
			"Also covers what KERN documents but doesn't implement (tabs, nav, header, notificationbanner). " +
			"Valid IDs come from list_components_by_category.",
		inputSchema,
		outputSchema,
		handler: async (args: { componentId: string; locale?: Locale }) => {
			const component = findDocumentedComponent(registry, args.componentId);
			if (!component) {
				throw new Error(
					`Unknown componentId: ${args.componentId}. Use an ID from list_components_by_category, such as inputtext, or KERN's, such as input-text.`,
				);
			}
			return describeComponent(registry, component, pickLocale(args.locale));
		},
	};
}

function describeComponent(
	registry: Registry,
	component: ComponentInfo,
	locale: Locale,
): ComponentDocsResult {
	const tool = toolFor(component.id);
	const knowledge = component.knowledge ?? {};

	const similar = knowledge.similar?.map((entry) => ({
		componentId: entry.id,
		name: entry.name,
		tool: entry.id ? toolFor(entry.id) : undefined,
		difference: entry.difference,
	}));
	const whenNotToUse = knowledge.whenNotToUse?.map((entry) => ({
		text: entry.text,
		useInstead: entry.useInstead,
		tool: entry.useInstead ? toolFor(entry.useInstead) : undefined,
	}));
	const accessibility = component.accessibility?.flatMap((criterion) =>
		criterion.status === "passed"
			? []
			: [{ ...criterion, status: criterion.status }],
	);
	const relatedTools = [
		...new Set([
			...(RELATED_TOOLS[component.id] ?? []),
			...(similar ?? []).flatMap((entry) => (entry.tool ? [entry.tool] : [])),
			...(whenNotToUse ?? []).flatMap((entry) =>
				entry.tool ? [entry.tool] : [],
			),
		]),
	].filter((name) => name !== tool);

	return {
		componentId: component.id,
		kernId: component.kernId,
		title: component.title,
		status: component.status,
		tool,
		note: noteFor(registry, component, tool),
		summary: component.summary,
		whenToUse: knowledge.whenToUse,
		whenNotToUse,
		dos: knowledge.dos,
		donts: knowledge.donts,
		contentGuidelines: knowledge.contentGuidelines,
		similar,
		accessibility:
			accessibility && accessibility.length > 0 ? accessibility : undefined,
		docs: component.docs,
		canonicalHtml: component.htmlCanonical,
		reviewedGuidance: notesFor(component.id, locale),
		relatedTools: relatedTools.length > 0 ? relatedTools : undefined,
	};
}

function noteFor(
	registry: Registry,
	component: ComponentInfo,
	tool: string | undefined,
): string | undefined {
	if (component.status === "docs-only") {
		const release = registry.upstream?.version
			? `KERN ${registry.upstream.version}`
			: "KERN";
		return `${release} documents ${component.title} but doesn't implement it: there's no tool and no kern-* markup for it.`;
	}
	return tool ? undefined : "This server has no tool for this component.";
}

/** The notes about our tool (tool-notes.ts), in the requested language. */
function notesFor(
	componentId: string,
	locale: Locale,
): ComponentDocsResult["reviewedGuidance"] {
	const notes = getToolNotes(componentId);
	if (!notes) return undefined;

	const localized = (text: { de: string; en: string }) =>
		locale === "en" ? text.en : text.de;
	const mapStatement = (statement: ReviewedGuidanceStatement) => ({
		text: localized(statement.text),
		confidence: statement.confidence,
		evidence: statement.evidence.map((entry) => ({
			kind: entry.kind,
			source: entry.source,
			locator: entry.locator,
			note: entry.note ? localized(entry.note) : undefined,
		})),
	});

	return {
		status: notes.status,
		summary: mapStatement(notes.summary),
		primaryUseCases: notes.primaryUseCases.map(mapStatement),
		antiUseCases: notes.antiUseCases.map(mapStatement),
		requiredA11yPractices: notes.requiredA11yPractices.map(mapStatement),
		semanticInvariants: notes.semanticInvariants.map(mapStatement),
		compositionPatterns: notes.compositionPatterns.map(mapStatement),
		authoringNotes: notes.authoringNotes.map(mapStatement),
		migrationNotes: notes.migrationNotes.map(mapStatement),
	};
}
