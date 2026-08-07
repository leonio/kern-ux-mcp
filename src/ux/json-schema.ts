import { z } from "zod";

/**
 * `root` (default) inlines `definitions` entries into the root schema so the
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

function escapeJsonPointerSegment(segment: string): string {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

/**
 * Breadth-first search for the shallowest node that `$ref`s `ref`, skipping the
 * `definitions` bag itself. Returns the node plus its JSON pointer so the
 * referenced schema can be inlined there and the remaining references retargeted.
 */
function findFirstRefSite(
	root: JsonSchema,
	ref: string,
): { node: Record<string, unknown>; pointer: string } | undefined {
	const queue: Array<{ value: unknown; pointer: string }> = [];

	for (const [key, value] of Object.entries(root)) {
		if (key === "definitions") {
			continue;
		}

		queue.push({ value, pointer: `#/${escapeJsonPointerSegment(key)}` });
	}

	while (queue.length > 0) {
		const entry = queue.shift();
		if (!entry) {
			break;
		}

		const { value, pointer } = entry;
		if (!value || typeof value !== "object") {
			continue;
		}

		if (Array.isArray(value)) {
			value.forEach((item, index) => {
				queue.push({ value: item, pointer: `${pointer}/${index}` });
			});
			continue;
		}

		const record = value as Record<string, unknown>;
		if (record.$ref === ref) {
			return { node: record, pointer };
		}

		for (const [key, child] of Object.entries(record)) {
			queue.push({
				value: child,
				pointer: `${pointer}/${escapeJsonPointerSegment(key)}`,
			});
		}
	}

	return undefined;
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
 * Inlines every reused/recursive `definitions` entry at its shallowest reference
 * site and retargets the remaining `$ref`s at that location, so the emitted
 * document is a self-contained root schema with no `definitions` bag. The
 * `definitions` bag is only kept when an entry cannot be inlined, because
 * dropping it there would leave dangling references.
 */
function inlineDefinitions(schema: JsonSchema): JsonSchema {
	const rootSchema = cloneJsonSchema(schema);
	const definitions = rootSchema.definitions as
		| Record<string, unknown>
		| undefined;

	if (!definitions) {
		return rootSchema;
	}

	let hasUninlinedDefinition = false;

	for (const [name, definition] of Object.entries(definitions)) {
		const ref = `#/definitions/${escapeJsonPointerSegment(name)}`;
		const site = findFirstRefSite(rootSchema, ref);

		if (!site || !definition || typeof definition !== "object") {
			hasUninlinedDefinition = true;
			continue;
		}

		const inlined = cloneJsonSchema(definition) as Record<string, unknown>;
		for (const key of Object.keys(site.node)) {
			delete site.node[key];
		}
		Object.assign(site.node, inlined);
		rewriteJsonSchemaRefs(rootSchema, ref, site.pointer);
	}

	if (!hasUninlinedDefinition) {
		delete rootSchema.definitions;
	}

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

	return inlineDefinitions(jsonSchema);
}
