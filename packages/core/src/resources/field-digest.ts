/** The parts of a tool's input JSON Schema the digest reads. */
type Schema = {
	type?: string | string[];
	const?: unknown;
	enum?: unknown[];
	anyOf?: Schema[];
	items?: Schema;
	properties?: Record<string, Schema>;
	required?: string[];
	default?: unknown;
	description?: string;
	minimum?: number;
	maximum?: number;
};

/** Every tool takes these; a card names them once instead of in each table. */
export const COMMON_FIELDS: ReadonlySet<string> = new Set(["locale", "strict"]);

/** Fields nest at most this deep in the table (cards[].header.title). */
const MAX_DEPTH = 3;

type Row = {
	field: string;
	type: string;
	required: boolean;
	default?: unknown;
	description?: string;
};

/**
 * A tool's input fields as Markdown tables, from the JSON Schema the listing
 * advertises: one table, or one per variant when the input is a union
 * (get_checkbox's single and list modes).
 */
export function fieldDigest(inputSchema: Record<string, unknown>): string {
	const schema = inputSchema as Schema;
	if (!schema.anyOf) return table(rowsOf(schema));

	return schema.anyOf
		.map((variant) => `${variantLabel(variant)}\n\n${table(rowsOf(variant))}`)
		.join("\n\n");
}

/** "With mode: "list":", from the property every variant fixes to a constant. */
function variantLabel(variant: Schema): string {
	const fixed = Object.entries(variant.properties ?? {}).find(
		([, property]) => property.const !== undefined,
	);
	return fixed
		? `With \`${fixed[0]}: ${JSON.stringify(fixed[1].const)}\`:`
		: "Or:";
}

function rowsOf(schema: Schema, prefix = "", depth = 1): Row[] {
	const required = new Set(schema.required ?? []);
	return Object.entries(schema.properties ?? {}).flatMap(([key, property]) => {
		if (!prefix && COMMON_FIELDS.has(key)) return [];
		const field = `${prefix}${key}`;
		const row: Row = {
			field,
			type: typeOf(property),
			required: required.has(key),
			default: property.default,
			description: property.description,
		};
		if (depth >= MAX_DEPTH) return [row];
		if (property.properties) {
			return [row, ...rowsOf(property, `${field}.`, depth + 1)];
		}
		if (property.items?.properties) {
			return [row, ...rowsOf(property.items, `${field}[].`, depth + 1)];
		}
		return [row];
	});
}

function typeOf(schema: Schema): string {
	if (schema.const !== undefined) return JSON.stringify(schema.const);
	if (schema.enum) {
		return schema.enum.map((value) => JSON.stringify(value)).join(", ");
	}
	if (schema.anyOf) {
		const kinds = schema.anyOf.map(
			(variant) => variant.properties?.kind?.const,
		);
		return kinds.every((kind) => typeof kind === "string")
			? `block: ${kinds.join(", ")}`
			: schema.anyOf.map(typeOf).join(" or ");
	}
	if (schema.type === "array") {
		return schema.items ? `array of ${typeOf(schema.items)}` : "array";
	}
	if (schema.type === "integer" || schema.type === "number") {
		const range =
			schema.minimum !== undefined && schema.maximum !== undefined
				? `, ${schema.minimum} to ${schema.maximum}`
				: "";
		return `${schema.type}${range}`;
	}
	if (Array.isArray(schema.type)) return schema.type.join(" or ");
	return schema.type ?? "any";
}

function table(rows: readonly Row[]): string {
	if (rows.length === 0) return "No fields of its own.";
	return [
		"| Field | Type | Required | Default | Description |",
		"|---|---|---|---|---|",
		...rows.map((row) => {
			const cells = [
				`\`${row.field}\``,
				cell(row.type),
				row.required ? "yes" : "",
				row.default === undefined ? "" : cell(JSON.stringify(row.default)),
				cell(row.description ?? ""),
			];
			return `| ${cells.join(" | ")} |`;
		}),
	].join("\n");
}

/** Table cells can't hold a pipe or a line break. */
function cell(text: string): string {
	return text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}
