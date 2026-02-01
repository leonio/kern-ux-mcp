import { z } from "zod";
import { pickLocale, t } from "../i18n.js";
import type { ComponentInfo, Locale } from "../types.js";
import { validateHtmlStrict } from "../validate.js";

/**
 * Shared tool-builder primitives used by all strategy modules.
 */

type ToolHandler = {
	bivarianceHack(args: unknown): Promise<unknown>;
}["bivarianceHack"];

export type ToolDef = {
	name: string;
	description: string;
	inputSchema: z.ZodType;
	outputSchema: z.ZodType;
	handler: ToolHandler;
};

/**
 * Standard output contract for component generation tools.
 */
export const ComponentOutputSchema = z.object({
	html: z.string(),
	warnings: z.array(z.string()).default([]),
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

export function experimentalBanner(component: ComponentInfo) {
	return statusBanner(component);
}

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
