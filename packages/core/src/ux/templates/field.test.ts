import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

import { FIELD_TYPES, type FieldInput, FieldSchema } from "../schemas/field.js";
import { validateHtmlStrict } from "../validate.js";
import { buildField } from "./field.js";

const OPTIONS = [
	{ value: "a", label: "Erste" },
	{ value: "b", label: "Zweite", selected: true },
];

/** A valid field of every type, with options where the type takes them. */
function fieldOf(
	type: FieldInput["type"],
	extra: Partial<FieldInput> = {},
): FieldInput {
	const needsOptions = type === "select" || type === "radio";
	return {
		type,
		name: "feld",
		label: "Feld",
		...(needsOptions ? { options: OPTIONS } : {}),
		...extra,
	};
}

function root(html: string) {
	return parse(html);
}

describe("buildField", () => {
	it.each([
		{ type: "text", selector: 'input[type="text"]' },
		{ type: "email", selector: 'input[type="email"]' },
		{ type: "tel", selector: 'input[type="tel"]' },
		{ type: "url", selector: 'input[type="url"]' },
		{ type: "number", selector: 'input[inputmode="numeric"]' },
		{ type: "date", selector: 'input[type="date"]' },
		{ type: "password", selector: 'input[type="password"]' },
		{ type: "textarea", selector: "textarea" },
		{ type: "select", selector: "select" },
		{ type: "radio", selector: 'input[type="radio"]' },
		{ type: "checkbox", selector: 'input[type="checkbox"]' },
	] as const)("renders a $type field as $selector", ({ type, selector }) => {
		const result = buildField(fieldOf(type), "de");
		const control = root(result.html).querySelector(selector);

		expect(control?.getAttribute("name")).toBe("feld");
		expect(result.html).toContain("Feld");
		expect(result.warnings).toEqual([]);
	});

	it.each(FIELD_TYPES)(
		"renders a %s field with an error that passes validation",
		(type) => {
			const html = buildField(
				fieldOf(type, { error: "Pflichtfeld" }),
				"de",
			).html;
			const validation = validateHtmlStrict(html);

			expect(html).toContain('class="kern-error"');
			expect(validation.ok).toBe(true);
			expect(validation.issues).toEqual([]);
		},
	);

	describe("id", () => {
		it.each(["text", "textarea", "select"] as const)(
			"puts the id on the %s control and its label",
			(type) => {
				const html = buildField(fieldOf(type, { id: "mein-feld" }), "de").html;

				expect(root(html).querySelector("#mein-feld")).not.toBeNull();
				expect(html).toContain('for="mein-feld"');
			},
		);

		it.each([
			{ type: "radio", options: OPTIONS },
			{ type: "checkbox", options: OPTIONS },
			{ type: "checkbox", options: undefined },
		] as const)(
			"puts the id on the first $type input (options: $options)",
			({ type, options }) => {
				const html = buildField(
					fieldOf(type, { id: "mein-feld", options }),
					"de",
				).html;
				const inputs = root(html).querySelectorAll("input");

				expect(inputs[0]?.getAttribute("id")).toBe("mein-feld");
				expect(html.match(/id="mein-feld"/g)).toHaveLength(1);
			},
		);
	});

	it("adds no format hint the model didn't ask for", () => {
		const html = buildField(fieldOf("text"), "de").html;

		expect(html).not.toContain("kern-hint");
		expect(html).not.toContain("aria-describedby");
	});

	it("maps options onto select, radio and checkbox", () => {
		const select = root(buildField(fieldOf("select"), "de").html);
		expect(
			select.querySelector('option[value="b"]')?.hasAttribute("selected"),
		).toBe(true);
		expect(select.querySelector('option[value="a"]')?.text).toBe("Erste");

		const radio = root(buildField(fieldOf("radio"), "de").html);
		expect(
			radio.querySelector('input[value="b"]')?.hasAttribute("checked"),
		).toBe(true);
		expect(radio.querySelector("legend")?.text).toContain("Feld");

		const checkbox = root(
			buildField(fieldOf("checkbox", { options: OPTIONS }), "de").html,
		);
		const boxes = checkbox.querySelectorAll('input[type="checkbox"]');
		expect(boxes.map((box) => box.getAttribute("value"))).toEqual(["a", "b"]);
		expect(boxes[1]?.hasAttribute("checked")).toBe(true);
		expect(checkbox.querySelector("legend")?.text).toContain("Feld");
	});

	it("renders a checkbox without options as a single checkbox", () => {
		const html = buildField(fieldOf("checkbox"), "de").html;

		expect(html).not.toContain("<fieldset");
		expect(root(html).querySelector("label")?.text).toBe("Feld");
	});

	it.each(["select", "radio"] as const)(
		"rejects a %s field without options",
		(type) => {
			const parsed = FieldSchema.safeParse({
				type,
				name: "feld",
				label: "Feld",
			});

			expect(parsed.success).toBe(false);
			expect(parsed.error?.issues[0]?.message).toBe(
				`A ${type} field needs options.`,
			);
			expect(parsed.error?.issues[0]?.path).toEqual(["options"]);
		},
	);

	it("warns about properties the type ignores", () => {
		const result = buildField(
			{
				type: "radio",
				name: "farbe",
				label: "Farbe",
				options: OPTIONS,
				value: "a",
				rows: 3,
			},
			"de",
		);

		expect(result.warnings).toEqual([
			'Field "farbe": value is ignored for a radio field.',
			'Field "farbe": rows is ignored for a radio field.',
		]);
	});

	it("warns that a single checkbox has no hint", () => {
		const result = buildField(fieldOf("checkbox", { hint: "Hinweis" }), "de");

		expect(result.warnings).toEqual([
			'Field "feld": hint is ignored for a single checkbox.',
		]);
	});

	it.each(
		FIELD_TYPES.filter((type) => type !== "radio" && type !== "checkbox"),
	)("marks a required %s field with aria-required only", (type) => {
		const result = buildField(fieldOf(type, { required: true }), "de");
		const control = root(result.html).querySelector('[name="feld"]');

		expect(control?.getAttribute("aria-required")).toBe("true");
		expect(control?.hasAttribute("required")).toBe(false);
		expect(result.html).not.toContain("kern-label__optional");
		expect(result.warnings).toEqual([]);
		expect(validateHtmlStrict(result.html).ok).toBe(true);
	});

	it.each([
		{ type: "radio", options: OPTIONS, kind: "radio field" },
		{ type: "checkbox", options: OPTIONS, kind: "checkbox group" },
		{ type: "checkbox", options: undefined, kind: "single checkbox" },
	] as const)(
		"warns that a $kind ignores required",
		({ type, options, kind }) => {
			const result = buildField(
				fieldOf(type, { required: true, options }),
				"de",
			);

			expect(result.html).not.toContain("aria-required");
			expect(result.warnings).toEqual([
				`Field "feld": required is ignored for a ${kind}.`,
			]);
		},
	);

	it.each(FIELD_TYPES)("escapes the model's text in a %s field", (type) => {
		const text = `<b>"A" & 'B'</b>`;
		const html = buildField(
			{
				type,
				name: "feld",
				label: text,
				hint: type === "checkbox" ? undefined : text,
				error: text,
				value: ["select", "radio", "checkbox"].includes(type)
					? undefined
					: text,
				options: ["select", "radio", "checkbox"].includes(type)
					? [{ value: text, label: text }]
					: undefined,
			},
			"de",
		).html;

		expect(html).not.toContain("<b>");
		expect(html).toContain(
			"&lt;b&gt;&quot;A&quot; &amp; &#039;B&#039;&lt;/b&gt;",
		);
	});
});
