import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";

import { formatInputValidationHint, parseToolInput } from "../invoke.js";
import { toolInputSchemaToJsonSchema } from "../ux/json-schema.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";

type JsonSchema = Record<string, unknown>;

const schemas = new WeakMap<ToolDef, StandardSchemaWithJSON>();

/**
 * Standard Schema adapter between a ToolDef and SDK v2's registerTool.
 *
 * - `jsonSchema.input()` returns our own JSON Schema (json-schema.ts), converted
 *   once and memoised. The SDK asks for draft 2020-12 but our draft-07 document
 *   works with every client tested (plan-v2 finding 17), and the SDK calls this
 *   on every tools/list.
 * - `validate()` runs normalize → Zod parse, and on failure returns one issue
 *   without a path whose message is our hint. The SDK wraps it as
 *   "Input validation error: Invalid arguments for tool <name>: <hint>" and
 *   returns it to the model as an isError result.
 *
 * Memoised per ToolDef, so per-request server instances share the conversion.
 */
export function kernInputSchema(tool: ToolDef): StandardSchemaWithJSON {
	const cached = schemas.get(tool);
	if (cached) {
		return cached;
	}

	let json: JsonSchema | undefined;
	const toJsonSchema = () => {
		json ??= toolInputSchemaToJsonSchema(tool.inputSchema);
		return json;
	};

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

	schemas.set(tool, schema);
	return schema;
}
