import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

import { FieldsetRenderSchema } from "../schemas/fieldset.js";
import { validateHtmlStrict } from "../validate.js";
import { buildFieldset } from "./fieldset.js";

const NAME_FIELDS = [
	{
		kind: "field" as const,
		field: { type: "text" as const, name: "vorname", label: "Vorname" },
	},
	{
		kind: "field" as const,
		field: { type: "text" as const, name: "nachname", label: "Nachname" },
	},
];

describe("buildFieldset", () => {
	it("wraps its content blocks under the legend", () => {
		const result = buildFieldset(
			{ legend: "Ansprechpartner", contentBlocks: NAME_FIELDS },
			"de",
		);
		const fieldset = parse(result.html).querySelector("fieldset.kern-fieldset");

		expect(fieldset?.querySelector("legend.kern-label")?.text.trim()).toBe(
			"Ansprechpartner",
		);
		expect(
			fieldset
				?.querySelectorAll(".kern-fieldset__body input")
				.map((input) => input.getAttribute("name")),
		).toEqual(["vorname", "nachname"]);
		expect(fieldset?.hasAttribute("aria-describedby")).toBe(false);
		expect(result.warnings).toEqual([]);
	});

	it("gives two fieldsets on one page distinct field ids", () => {
		const first = buildFieldset(
			{ legend: "Antragsteller", contentBlocks: NAME_FIELDS },
			"de",
		).html;
		const second = buildFieldset(
			{ legend: "Ehepartner", contentBlocks: NAME_FIELDS },
			"de",
		).html;
		const ids = parse(first + second)
			.querySelectorAll("input")
			.map((input) => input.getAttribute("id"));

		expect(new Set(ids).size).toBe(4);
	});

	it("renders the large legend, optional marker, hint, error and horizontal body", () => {
		const html = buildFieldset(
			{
				legend: "Anschrift",
				legendSize: "large",
				optional: true,
				hint: "Wie im Ausweis",
				error: "Bitte die Anschrift prüfen.",
				horizontal: true,
				contentBlocks: NAME_FIELDS,
			},
			"en",
		).html;
		const fieldset = parse(html).querySelector("fieldset");
		const hintId = fieldset?.querySelector(".kern-hint")?.getAttribute("id");
		const errorId = fieldset?.querySelector(".kern-error")?.getAttribute("id");

		expect(fieldset?.classList.contains("kern-fieldset--error")).toBe(true);
		expect(
			fieldset
				?.querySelector("legend")
				?.classList.contains("kern-label--large"),
		).toBe(true);
		expect(fieldset?.querySelector(".kern-label__optional")?.text).toBe(
			"- Optional",
		);
		expect(fieldset?.getAttribute("aria-describedby")).toBe(
			`${hintId} ${errorId}`,
		);
		expect(
			fieldset?.querySelector(".kern-fieldset__body--horizontal"),
		).not.toBeNull();
		expect(validateHtmlStrict(html).issues).toEqual([]);
	});

	it("escapes the legend, hint and error", () => {
		const text = `<b>"A" & 'B'</b>`;
		const html = buildFieldset(
			{ legend: text, hint: text, error: text, contentBlocks: NAME_FIELDS },
			"de",
		).html;

		expect(html).not.toContain("<b>");
	});

	it("requires a legend and at least one content block", () => {
		expect(
			FieldsetRenderSchema.safeParse({ legend: "Gruppe", contentBlocks: [] })
				.success,
		).toBe(false);
		expect(
			FieldsetRenderSchema.safeParse({ contentBlocks: NAME_FIELDS }).success,
		).toBe(false);
	});
});
