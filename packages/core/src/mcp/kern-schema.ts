import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";

import { formatInputValidationHint, parseToolInput } from "../invoke.js";
import {
	getToolInputJsonSchema,
	getToolOutputJsonSchema,
} from "../ux/json-schema.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";

const inputSchemas = new WeakMap<ToolDef, StandardSchemaWithJSON>();
const outputSchemas = new WeakMap<ToolDef, StandardSchemaWithJSON>();

/**
 * Standard Schema adapter between a ToolDef's input and SDK v2's registerTool.
 *
 * - `jsonSchema.input()` returns our own JSON Schema (json-schema.ts), memoised
 *   per Zod schema and shared with the domain listing. The SDK asks for draft
 *   2020-12 but our draft-07 document works with every client tested (plan-v2
 *   history, R0), and the SDK calls this on every tools/list.
 * - `validate()` runs normalize → Zod parse, and on failure returns one issue
 *   without a path whose message is our hint. The SDK wraps it as
 *   "Input validation error: Invalid arguments for tool <name>: <hint>" and
 *   returns it to the model as an isError result.
 *
 * Memoised per ToolDef, so per-request server instances share the adapter.
 */
export function kernInputSchema(tool: ToolDef): StandardSchemaWithJSON {
	const cached = inputSchemas.get(tool);
	if (cached) {
		return cached;
	}

	const toJsonSchema = () => getToolInputJsonSchema(tool.inputSchema);
	const schema: StandardSchemaWithJSON = {
		"~standard": {
			version: 1,
			vendor: "kern-ux",
			validate(value) {
				const parsed = parseToolInput(tool, value);
				if (parsed.success) {
					return { value: parsed.data };
				}
				// Leading newline so the "- path: message" lines start below the SDK's prefix.
				const hint = formatInputValidationHint(tool.name, parsed.error);
				return { issues: [{ message: `\n${hint}` }] };
			},
			jsonSchema: { input: toJsonSchema, output: toJsonSchema },
		},
	};

	inputSchemas.set(tool, schema);
	return schema;
}

/**
 * The same adapter for a ToolDef's output: the advertised outputSchema, and the
 * validation the SDK applies to structuredContent. runTool() has already parsed
 * the output with the same Zod schema, so this re-check never fails in practice.
 */
export function kernOutputSchema(tool: ToolDef): StandardSchemaWithJSON {
	const cached = outputSchemas.get(tool);
	if (cached) {
		return cached;
	}

	const toJsonSchema = () => getToolOutputJsonSchema(tool.outputSchema);
	const schema: StandardSchemaWithJSON = {
		"~standard": {
			version: 1,
			vendor: "kern-ux",
			validate(value) {
				const parsed = tool.outputSchema.safeParse(value);
				if (parsed.success) {
					return { value: parsed.data };
				}
				return {
					issues: parsed.error.issues.map((issue) => ({
						message: issue.message,
						path: issue.path.filter(
							(segment): segment is string | number =>
								typeof segment !== "symbol",
						),
					})),
				};
			},
			jsonSchema: { input: toJsonSchema, output: toJsonSchema },
		},
	};

	outputSchemas.set(tool, schema);
	return schema;
}
