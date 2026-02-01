import { z } from "zod";

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

function wrapNamedRootSchema(name: string, schema: JsonSchema): JsonSchema {
	const namedSchema = cloneJsonSchema(schema);
	const contentBlocks = namedSchema.properties as
		| Record<string, unknown>
		| undefined;
	const contentBlocksItems = (
		contentBlocks?.contentBlocks as Record<string, unknown> | undefined
	)?.items as Record<string, unknown> | undefined;

	if (typeof contentBlocksItems?.$ref === "string") {
		const recursiveRef = contentBlocksItems.$ref;
		const resolved = getJsonSchemaPath(namedSchema, recursiveRef);
		if (resolved && typeof resolved === "object") {
			contentBlocksItems.items = undefined;
			for (const key of Object.keys(contentBlocksItems)) {
				delete contentBlocksItems[key];
			}
			Object.assign(contentBlocksItems, cloneJsonSchema(resolved));
			rewriteJsonSchemaRefs(
				namedSchema,
				recursiveRef,
				`#/definitions/${name}/properties/contentBlocks/items`,
			);
		}
	}

	delete namedSchema.definitions;

	return {
		$schema: schema.$schema,
		definitions: {
			[name]: namedSchema,
		},
	};
}

export function toolInputSchemaToJsonSchema(
	schema: z.ZodType,
	options: {
		name: string;
		refStrategy?: JsonSchemaRefStrategy;
	},
) {
	const jsonSchema = cloneJsonSchema(
		z.toJSONSchema(schema, JSON_SCHEMA_OPTIONS) as JsonSchema,
	);

	normalizeAnyOf(jsonSchema);

	if (options.refStrategy === "none") {
		return jsonSchema;
	}

	return wrapNamedRootSchema(options.name, jsonSchema);
}
