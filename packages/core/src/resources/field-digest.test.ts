import { describe, expect, it } from "vitest";

import { fieldDigest } from "./field-digest.js";

describe("fieldDigest", () => {
	it("lists the fields with type, required, default and description, without locale and strict", () => {
		expect(
			fieldDigest({
				type: "object",
				properties: {
					locale: { type: "string", enum: ["de", "en"] },
					strict: { type: "boolean" },
					label: { type: "string", description: "Button text." },
					variant: {
						type: "string",
						enum: ["primary", "secondary"],
						default: "primary",
					},
					columns: { type: "integer", minimum: 1, maximum: 12 },
				},
				required: ["label"],
			}),
		).toBe(
			[
				"| Field | Type | Required | Default | Description |",
				"|---|---|---|---|---|",
				"| `label` | string | yes |  | Button text. |",
				'| `variant` | "primary", "secondary" |  | "primary" |  |',
				"| `columns` | integer, 1 to 12 |  |  |  |",
			].join("\n"),
		);
	});

	it("follows objects and arrays of objects, three levels deep", () => {
		const digest = fieldDigest({
			type: "object",
			properties: {
				cards: {
					type: "array",
					items: {
						type: "object",
						properties: {
							header: {
								type: "object",
								properties: {
									title: { type: "string" },
									meta: {
										type: "object",
										properties: { x: { type: "string" } },
									},
								},
								required: ["title"],
							},
						},
					},
				},
			},
		});

		expect(digest).toContain("| `cards` | array of object |");
		expect(digest).toContain("| `cards[].header` | object |");
		expect(digest).toContain("| `cards[].header.title` | string | yes |");
		expect(digest).toContain("| `cards[].header.meta` | object |");
		expect(digest).not.toContain("meta.x");
	});

	it("names the kinds of a block union", () => {
		expect(
			fieldDigest({
				type: "object",
				properties: {
					contentBlocks: {
						type: "array",
						items: {
							anyOf: ["text", "html"].map((kind) => ({
								type: "object",
								properties: { kind: { const: kind } },
							})),
						},
					},
				},
			}),
		).toContain("| `contentBlocks` | array of block: text, html |");
	});

	it("gives each variant of a union input its own table", () => {
		const digest = fieldDigest({
			anyOf: [
				{
					type: "object",
					properties: { mode: { const: "single" }, label: { type: "string" } },
				},
				{
					type: "object",
					properties: { mode: { const: "list" }, legend: { type: "string" } },
				},
			],
		});

		expect(digest).toMatch(/^With `mode: "single"`:\n\n\| Field/);
		expect(digest).toContain('\n\nWith `mode: "list"`:\n\n| Field');
		expect(digest).toContain("| `legend` | string |");
	});

	it("keeps pipes and line breaks out of the cells", () => {
		expect(
			fieldDigest({
				type: "object",
				properties: {
					a: { type: "string", description: "x | y\n  z" },
				},
			}),
		).toContain("| `a` | string |  |  | x \\| y z |");
	});

	it("says so when a tool has no fields of its own", () => {
		expect(
			fieldDigest({
				type: "object",
				properties: { locale: { type: "string" } },
			}),
		).toBe("No fields of its own.");
	});
});
