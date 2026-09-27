// R0 spike (throwaway): Standard Schema adapter so SDK v2 lists OUR memoised
// JSON Schema and validates through OUR normalize → Zod → hint pipeline.
import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import {
	formatInputValidationError,
	normalizeToolArgs,
} from "../../src/invoke.js";
import { toolInputSchemaToJsonSchema } from "../../src/ux/json-schema.js";
import type { ToolDef } from "../../src/ux/tool-builders/shared.js";

/** "header" keeps our "Invalid arguments for X:" line; "strip" drops it (roadmap proposal). */
export type HeaderMode = "header" | "strip";

export const conversionCalls = { count: 0, targets: new Set<string>() };

export function kernInputSchema(
	tool: ToolDef,
	headerMode: HeaderMode = "strip",
): StandardSchemaWithJSON<unknown, unknown> {
	let json: Record<string, unknown> | undefined;
	const input = (opts?: { target?: string }) => {
		conversionCalls.count++;
		if (opts?.target) conversionCalls.targets.add(opts.target);
		json ??= toolInputSchemaToJsonSchema(tool.inputSchema);
		return json;
	};

	return {
		"~standard": {
			version: 1,
			vendor: "kern-ux",
			validate(value: unknown) {
				const normalized = normalizeToolArgs(tool.name, value ?? {});
				const parsed = tool.inputSchema.safeParse(normalized);
				if (parsed.success) return { value: parsed.data };
				let message = formatInputValidationError(tool.name, parsed.error);
				if (headerMode === "strip") {
					message = message.replace(/^Invalid arguments for [^\n]*\n/, "");
				}
				return { issues: [{ message }] };
			},
			jsonSchema: { input, output: input },
		},
	} as unknown as StandardSchemaWithJSON<unknown, unknown>;
}
