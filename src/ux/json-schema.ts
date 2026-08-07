import { z } from "zod";

/**
 * `root` (default) inlines the recursive definition into the root schema so the
 * emitted document is self-contained; `none` keeps whatever `definitions` the
 * serializer produced.
 */
export type JsonSchemaRefStrategy = "root" | "none";

type JsonSchema = Record<string, unknown>;

const JSON_SCHEMA_OPTIONS = {
	target: "draft-07",
	io: "input",
	cycles: "ref",
	reused: "inline",
	unrepresentable: "any",
} as const;

function cloneJsonSchema<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeAnyOf(schema: unknown): void {
	if (!schema || typeof schema !== "object") {
		return;
	}

	if (Array.isArray(schema)) {
		for (const item of schema) {
			normalizeAnyOf(item);
		}
		return;
	}

	const record = schema as Record<string, unknown>;
	if (Array.isArray(record.oneOf) && !Array.isArray(record.anyOf)) {
		record.anyOf = record.oneOf;
		delete record.oneOf;
	}

	for (const value of Object.values(record)) {
		normalizeAnyOf(value);
	}
}

function getJsonSchemaPath(root: JsonSchema, path: string): unknown {
	const segments = path.replace(/^#\//, "").split("/");
	let current: unknown = root;

	for (const segment of segments) {
		if (!current || typeof current !== "object") {
			return undefined;
		}

		current = (current as Record<string, unknown>)[segment];
	}

	return current;
}

function rewriteJsonSchemaRefs(
	schema: unknown,
	fromRef: string,
	toRef: string,
): void {
	if (!schema || typeof schema !== "object") {
		return;
	}

	if (Array.isArray(schema)) {
		for (const item of schema) {
			rewriteJsonSchemaRefs(item, fromRef, toRef);
		}
		return;
	}

	const record = schema as Record<string, unknown>;
	if (record.$ref === fromRef) {
		record.$ref = toRef;
	}

	for (const value of Object.values(record)) {
		rewriteJsonSchemaRefs(value, fromRef, toRef);
	}
}

function isObjectBranch(branch: unknown): boolean {
	if (!branch || typeof branch !== "object" || Array.isArray(branch)) {
		return false;
	}

	const record = branch as Record<string, unknown>;
	if (record.type === "object") {
		return true;
	}

	return Array.isArray(record.anyOf) && record.anyOf.every(isObjectBranch);
}

/**
 * MCP requires every `Tool.inputSchema` to be a JSON Schema object, so the root
 * must declare `type: "object"`. Discriminated unions serialize to a bare
 * `anyOf` without a root type; adding the type is safe there because every
 * branch is itself an object schema.
 */
function ensureObjectRoot(schema: JsonSchema): void {
	if (schema.type === "object") {
		if (!schema.properties) {
			schema.properties = {};
		}
		return;
	}

	const branches = schema.anyOf;
	if (
		schema.type === undefined &&
		Array.isArray(branches) &&
		branches.length > 0 &&
		branches.every(isObjectBranch)
	) {
		schema.type = "object";
		return;
	}

	throw new Error(
		`Tool input schema must serialize to a JSON Schema object, received type "${String(schema.type)}"`,
	);
}

/**
 * Inlines the recursive `contentBlocks` node into the root schema so the emitted
 * document carries no `definitions` bag, and retargets the self-references at the
 * inlined copy.
 */
function inlineRecursiveContentBlocks(schema: JsonSchema): JsonSchema {
	const rootSchema = cloneJsonSchema(schema);
	const contentBlocks = rootSchema.properties as
		| Record<string, unknown>
		| undefined;
	const contentBlocksItems = (
		contentBlocks?.contentBlocks as Record<string, unknown> | undefined
	)?.items as Record<string, unknown> | undefined;

	if (typeof contentBlocksItems?.$ref === "string") {
		const recursiveRef = contentBlocksItems.$ref;
		const resolved = getJsonSchemaPath(rootSchema, recursiveRef);
		if (resolved && typeof resolved === "object") {
			const inlined = cloneJsonSchema(resolved);
			for (const key of Object.keys(contentBlocksItems)) {
				delete contentBlocksItems[key];
			}
			Object.assign(contentBlocksItems, inlined);
			rewriteJsonSchemaRefs(
				rootSchema,
				recursiveRef,
				"#/properties/contentBlocks/items",
			);
		}
	}

	delete rootSchema.definitions;

	return rootSchema;
}

export function toolInputSchemaToJsonSchema(
	schema: z.ZodType,
	options: {
		refStrategy?: JsonSchemaRefStrategy;
	} = {},
) {
	const jsonSchema = cloneJsonSchema(
		z.toJSONSchema(schema, JSON_SCHEMA_OPTIONS) as JsonSchema,
	);

	normalizeAnyOf(jsonSchema);
	ensureObjectRoot(jsonSchema);

	if (options.refStrategy === "none") {
		return jsonSchema;
	}

	return inlineRecursiveContentBlocks(jsonSchema);
}
