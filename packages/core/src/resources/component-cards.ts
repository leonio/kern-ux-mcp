import { parse } from "node-html-parser";

import { invokeTool } from "../invoke.js";
import { withStableIds } from "../ux/id.js";
import { getToolInputJsonSchema } from "../ux/json-schema.js";
import {
	COMPONENT_CARD_URI_TEMPLATE,
	noteFor,
	toolFor,
} from "../ux/tool-builders/component-docs.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";
import { TOOL_EXAMPLES } from "../ux/tool-examples.js";
import {
	getToolNotes,
	type ReviewedComponentGuidance,
	type ReviewedGuidanceStatement,
} from "../ux/tool-notes.js";
import type { ComponentInfo, Registry } from "../ux/types.js";
import { VALIDATION_RULES } from "../ux/validation-rules.js";
import {
	byteLength,
	type KernResourceDefinition,
	resourceUri,
} from "./definition.js";
import { fieldDigest } from "./field-digest.js";

/** One example of a tool, rendered. */
type RenderedExample = { input: Record<string, unknown>; html: string };

/**
 * kern://components/{id}: a Markdown card per registry component. KERN's
 * guidance comes from the bundle by way of the registry; the tool, its
 * fields, examples, validation rules and notes come from code. Sections a
 * component has nothing for are left out. Each card is built on first use.
 */
export function componentCards(
	registry: Registry,
	tools: readonly ToolDef[],
): KernResourceDefinition {
	const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));
	const cards = new Map<string, Promise<string>>();

	const read = (id: string): Promise<string | undefined> => {
		const component = registry.byId.get(id);
		if (!component) return Promise.resolve(undefined);
		let card = cards.get(id);
		if (!card) {
			card = buildCard(registry, component, toolsByName);
			cards.set(id, card);
		}
		return card;
	};

	const definition: KernResourceDefinition = {
		name: "component-cards",
		uriTemplate: COMPONENT_CARD_URI_TEMPLATE,
		variable: "id",
		title: "KERN component cards",
		description:
			"One card per KERN component: KERN's guidance, our tool with its fields and a rendered example, and the validation rules that apply.",
		mimeType: "text/markdown",
		read,
		entries: async () => {
			const components = [...registry.components].sort((a, b) =>
				a.id.localeCompare(b.id),
			);
			return Promise.all(
				components.map(async (component) => ({
					uri: resourceUri(definition, component.id),
					value: component.id,
					title: `KERN ${component.title}`,
					description:
						component.summary ??
						`KERN's guidance for ${component.title}, and our tool.`,
					size: byteLength((await read(component.id)) ?? ""),
				})),
			);
		},
	};
	return definition;
}

async function buildCard(
	registry: Registry,
	component: ComponentInfo,
	toolsByName: ReadonlyMap<string, ToolDef>,
): Promise<string> {
	const toolName = toolFor(component.id);
	const tool = toolName ? toolsByName.get(toolName) : undefined;
	const examples = tool ? await renderExamples(tool) : [];

	return [
		identity(registry, component, toolName),
		guidance(registry, component),
		tool ? toolSection(tool, examples) : undefined,
		toolNotes(getToolNotes(component.id)),
	]
		.filter((part): part is string => Boolean(part))
		.join("\n\n")
		.concat("\n");
}

async function renderExamples(tool: ToolDef): Promise<RenderedExample[]> {
	return Promise.all(
		(TOOL_EXAMPLES[tool.name] ?? []).map(async ({ input }) => {
			// Stable IDs, so every server process serves the same card.
			const output = (await withStableIds(() => invokeTool(tool, input))) as {
				html: string;
			};
			return { input: { ...input }, html: output.html };
		}),
	);
}

function identity(
	registry: Registry,
	component: ComponentInfo,
	toolName: string | undefined,
): string {
	const facts = [
		`\`kern://components/${component.id}\``,
		`status: ${component.status}`,
		component.kernId ? `KERN ID: \`${component.kernId}\`` : undefined,
		toolName ? `tool: \`${toolName}\`` : undefined,
	].filter(Boolean);
	const synonyms = component.synonyms?.length
		? `Also called: ${component.synonyms.join(", ")}.`
		: undefined;
	const summary = component.summary ?? component.docs?.summary;
	const note = noteFor(registry, component, toolName);

	return [
		`# KERN ${component.title}`,
		facts.join(" · "),
		synonyms,
		summary,
		note ? `> ${note}` : undefined,
	]
		.filter(Boolean)
		.join("\n\n");
}

function guidance(registry: Registry, component: ComponentInfo): string {
	const knowledge = component.knowledge ?? {};
	const nameOf = (id: string) => registry.byId.get(id)?.title ?? id;
	const withTool = (id: string | undefined) => {
		const tool = id ? toolFor(id) : undefined;
		return tool ? ` (\`${tool}\`)` : "";
	};

	return [
		list("When to use", knowledge.whenToUse),
		list(
			"When not to use",
			knowledge.whenNotToUse?.map((entry) =>
				entry.useInstead
					? `${entry.text} Use ${nameOf(entry.useInstead)} instead${withTool(entry.useInstead)}.`
					: entry.text,
			),
		),
		list("Do", knowledge.dos),
		list("Don't", knowledge.donts),
		list("Content guidelines", knowledge.contentGuidelines),
		list(
			"Similar components",
			knowledge.similar?.map((entry) => {
				const name = entry.id ? nameOf(entry.id) : (entry.name ?? "");
				const difference = entry.difference ? `: ${entry.difference}` : "";
				return `${name}${withTool(entry.id)}${difference}`;
			}),
		),
		list(
			"Accessibility",
			component.accessibility
				?.filter((criterion) => criterion.status !== "passed")
				.map(
					(criterion) =>
						`${[criterion.criterion, criterion.slug].filter(Boolean).join(" ")}${criterion.level ? ` (${criterion.level})` : ""}: ${criterion.status}`,
				),
			"The WCAG criteria KERN's docs leave to the implementation:",
		),
		list(
			"Links",
			[
				component.links?.docs && `Documentation: ${component.links.docs}`,
				component.links?.source && `Source: ${component.links.source}`,
				component.links?.figma && `Figma: ${component.links.figma}`,
			].filter((link): link is string => Boolean(link)),
		),
	]
		.filter(Boolean)
		.join("\n\n");
}

function toolSection(
	tool: ToolDef,
	examples: readonly RenderedExample[],
): string {
	const rules = VALIDATION_RULES.filter(
		(rule) =>
			"appliesTo" in rule &&
			examples.some(
				(example) => parse(example.html).querySelector(rule.appliesTo) !== null,
			),
	);

	return [
		`## The tool: \`${tool.name}\``,
		tool.description,
		"### Fields",
		fieldDigest(getToolInputJsonSchema(tool.inputSchema)),
		"Every tool also takes `locale` (`de` or `en`; `de` by default) and `strict` (fail on validation errors).",
		...examples.flatMap((example, index) => [
			examples.length > 1 ? `### Example ${index + 1}` : "### Example",
			`\`\`\`json\n${JSON.stringify(example.input, null, 2)}\n\`\`\``,
			`\`\`\`html\n${example.html}\n\`\`\``,
		]),
		list(
			"Validation rules",
			rules.map(
				(rule) => `\`${rule.id}\` (${rule.severity}): ${rule.requirement}`,
			),
			"`validate_html` checks this markup for:",
			3,
		),
	]
		.filter(Boolean)
		.join("\n\n");
}

/** Our reviewed notes about the tool, in English, grouped by kind. */
function toolNotes(notes: ReviewedComponentGuidance | undefined): string {
	if (!notes) return "";
	const groups: Array<[string, readonly ReviewedGuidanceStatement[]]> = [
		["Use it for", notes.primaryUseCases],
		["Not for", notes.antiUseCases],
		["Accessibility", notes.requiredA11yPractices],
		["Always", notes.semanticInvariants],
		["Composition", notes.compositionPatterns],
		["Authoring", notes.authoringNotes],
		["Migration", notes.migrationNotes],
	];
	const lines = groups.flatMap(([label, statements]) =>
		statements.map((statement) => `**${label}:** ${statement.text.en}`),
	);
	return list("Notes on our tool", lines, notes.summary.text.en) ?? "";
}

/** A heading and a bullet list, or nothing for an empty list. */
function list(
	heading: string,
	items: readonly string[] | undefined,
	intro?: string,
	level = 2,
): string | undefined {
	if (!items || items.length === 0) return undefined;
	return [
		`${"#".repeat(level)} ${heading}`,
		...(intro ? [intro] : []),
		items.map((item) => `- ${item}`).join("\n"),
	].join("\n\n");
}
