import { expect } from "vitest";

/**
 * Test-only view over the JSON Schema documents emitted by toolInputSchemaToJsonSchema().
 *
 * `properties` and `items` are deliberately non-optional so assertions can read
 * `schema.properties.label.description` directly: a missing key still fails the test
 * at runtime, exactly as it would with `any`, but typos in keyword names are caught.
 */
export type JsonSchemaNode = {
	type?: string | string[];
	description?: string;
	properties: Record<string, JsonSchemaNode>;
	required?: string[];
	items: JsonSchemaNode;
	anyOf?: JsonSchemaNode[];
	oneOf?: JsonSchemaNode[];
	enum?: unknown[];
	const?: unknown;
	default?: unknown;
	$ref?: string;
	definitions?: Record<string, JsonSchemaNode>;
};

/** Returns the `anyOf`/`oneOf` branches of a union schema, failing if there are none. */
export function schemaVariants(schema: JsonSchemaNode): JsonSchemaNode[] {
	const variants = schema.anyOf ?? schema.oneOf;
	expect(Array.isArray(variants)).toBe(true);
	if (!variants) {
		throw new Error("Expected schema to have anyOf/oneOf variants");
	}

	return variants;
}

/** Finds the branch matching `predicate`, failing if none does. */
export function findVariant(
	variants: JsonSchemaNode[],
	predicate: (variant: JsonSchemaNode) => boolean,
): JsonSchemaNode {
	const variant = variants.find(predicate);
	expect(variant).toBeDefined();
	if (!variant) {
		throw new Error("Expected a matching schema variant");
	}

	return variant;
}
