import { z } from "zod";
import { pickLocale, t } from "../i18n.js";
import type { ComponentInfo, Locale } from "../types.js";
import { validateHtmlStrict } from "../validate.js";
import { ValidationResultSchema } from "../validate.schema.js";

/**
 * Shared tool-builder primitives used by all strategy modules.
 */

type ToolHandler = {
	bivarianceHack(args: unknown): Promise<unknown>;
}["bivarianceHack"];

export type ToolDef = {
	name: string;
	/** Human-readable display name. createTools() guarantees every tool has one. */
	title?: string;
	description: string;
	inputSchema: z.ZodType;
	outputSchema: z.ZodType;
	handler: ToolHandler;
};

/** MCP tool annotations (hints for clients), kept SDK-free in packages/core/src/ux. */
export type ToolAnnotations = {
	readOnlyHint?: boolean;
	destructiveHint?: boolean;
	idempotentHint?: boolean;
	openWorldHint?: boolean;
};

/**
 * Every KERN tool only generates or checks markup from its arguments and the
 * bundled registry: no side effects, no network, the same answer every time.
 */
export const KERN_TOOL_ANNOTATIONS: Readonly<ToolAnnotations> = Object.freeze({
	readOnlyHint: true,
	idempotentHint: true,
	openWorldHint: false,
});

/**
 * Standard output contract for every HTML-producing tool.
 */
export const ComponentOutputSchema = z.object({
	html: z.string(),
	warnings: z.array(z.string()).default([]),
	validation: ValidationResultSchema.describe(
		"Accessibility and markup checks of the HTML. With strict: true, errors fail the call instead.",
	),
});

export function statusBanner(component: ComponentInfo) {
	if (component.status === "experimental") {
		return "<!-- WARNING: Experimental Component – API may change. -->\n";
	}
	if (component.status === "deprecated") {
		return "<!-- WARNING: Deprecated Component – consider alternatives. See get_component_docs for migration guidance. -->\n";
	}
	return "";
}

export function statusWarnings(component: ComponentInfo): string[] {
	if (component.status === "deprecated") {
		return [
			`Component '${component.id}' is deprecated. Use get_component_docs with { componentId: '${component.id}' } for migration guidance.`,
		];
	}
	if (component.status === "experimental") {
		return [`Component '${component.id}' is experimental – API may change.`];
	}
	return [];
}

export function getComponentToolName(component: ComponentInfo) {
	return `get_${component.id}`;
}

/**
 * Display title of a component tool, from the registry title: "InputEmail" →
 * "KERN Input Email", "dropdown" → "KERN Dropdown".
 */
export function getComponentToolTitle(component: ComponentInfo) {
	const words = component.title.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
	return `KERN ${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

export function assertStrictValidationOrThrow(params: {
	name: string;
	locale: Locale;
	strict: boolean;
	validation: ReturnType<typeof validateHtmlStrict>;
}) {
	const { name, locale, strict, validation } = params;
	if (!strict || validation.ok) {
		return;
	}

	const errorSummary = validation.issues
		.filter((issue) => issue.severity === "error")
		.map((issue) => `- ${t(locale, issue.message)}`)
		.join("\n");

	throw new Error(
		`Strict validation failed for ${name}. Fix errors and retry:\n${errorSummary}`,
	);
}

export function buildParameterizedComponentTool<
	TArgs extends { locale?: Locale; strict?: boolean },
>(
	component: ComponentInfo,
	description: string,
	inputSchema: z.ZodType,
	builder: (
		args: TArgs,
		locale: Locale,
	) => { html: string; warnings: string[] },
): ToolDef {
	const name = getComponentToolName(component);

	return {
		name,
		description,
		inputSchema,
		outputSchema: ComponentOutputSchema,
		handler: async (args: TArgs) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;

			const result = builder(args, locale);
			const html = statusBanner(component) + result.html;
			const validation = validateHtmlStrict(html);
			assertStrictValidationOrThrow({ name, locale, strict, validation });

			const warnings = [...statusWarnings(component), ...result.warnings];
			return { html, warnings, validation };
		},
	};
}
