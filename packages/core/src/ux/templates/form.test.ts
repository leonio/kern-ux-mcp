import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

import type {
	FormBlockInput,
	RecursiveContentNodeInput,
} from "../schemas/content-union.js";
import { validateHtmlStrict } from "../validate.js";
import { buildForm } from "./form.js";

function field(
	name: string,
	extra: Partial<
		Extract<RecursiveContentNodeInput, { kind: "field" }>["field"]
	> = {},
): RecursiveContentNodeInput {
	return {
		kind: "field",
		field: { type: "text", name, label: name.toUpperCase(), ...extra },
	};
}

/** A form with errors at several depths, in a known document order. */
const FORM_WITH_ERRORS: FormBlockInput = {
	action: "/antrag?schritt=2&x=1",
	errorSummary: {},
	contentBlocks: [
		field("vorname", { error: "Bitte angeben." }),
		{
			kind: "fieldset",
			fieldset: {
				legend: "Anschrift",
				contentBlocks: [
					field("strasse"),
					field("plz", { id: "eigene-id", error: "Fünf Ziffern." }),
				],
			},
		},
		{
			kind: "grid",
			grid: {
				columns: 2,
				columnsContent: [
					[
						field("anrede", {
							type: "radio",
							error: "Bitte auswählen.",
							options: [
								{ value: "frau", label: "Frau" },
								{ value: "herr", label: "Herr" },
							],
						}),
					],
					[field("leer", { error: "" })],
				],
			},
		},
	],
	actions: { submitLabel: "Weiter", secondaryLabel: "Zurück" },
};

describe("buildForm", () => {
	it("renders a post form with novalidate and an escaped action", () => {
		const html = buildForm({ contentBlocks: [field("vorname")] }, "de").html;
		const form = parse(html).querySelector("form");

		expect(form?.getAttribute("method")).toBe("post");
		expect(form?.hasAttribute("novalidate")).toBe(true);
		expect(form?.hasAttribute("action")).toBe(false);
		expect(buildForm(FORM_WITH_ERRORS, "de").html).toContain(
			'action="/antrag?schritt=2&amp;x=1"',
		);
		expect(
			parse(
				buildForm({ method: "get", contentBlocks: [field("q")] }, "de").html,
			)
				.querySelector("form")
				?.getAttribute("method"),
		).toBe("get");
	});

	it("lists every field with an error message, in document order, linked to the field", () => {
		const result = buildForm(FORM_WITH_ERRORS, "de");
		const root = parse(result.html);
		const links = root.querySelectorAll(".kern-alert--danger a.kern-link");

		expect(links.map((link) => link.text)).toEqual([
			"VORNAME: Bitte angeben.",
			"PLZ: Fünf Ziffern.",
			"ANREDE: Bitte auswählen.",
		]);
		for (const link of links) {
			const target = link.getAttribute("href")?.slice(1) ?? "";
			expect(root.querySelector(`[id="${target}"]`)?.tagName).toBe("INPUT");
		}
		expect(links[1]?.getAttribute("href")).toBe("#eigene-id");
		expect(root.querySelector("#eigene-id")?.getAttribute("name")).toBe("plz");
		expect(root.querySelector(".kern-alert .kern-title")?.text).toBe(
			"Bitte korrigieren Sie die folgenden Angaben",
		);
		expect(result.warnings.join("\n")).not.toContain("errorSummary");
	});

	it("puts the summary first, then the fields, then the actions", () => {
		const html = buildForm(FORM_WITH_ERRORS, "en").html;
		const summary = html.indexOf("kern-alert--danger");
		const firstField = html.indexOf('name="vorname"');
		const submit = html.indexOf('type="submit"');

		expect(summary).toBeGreaterThan(0);
		expect(summary).toBeLessThan(firstField);
		expect(firstField).toBeLessThan(submit);
		expect(html).toContain("Please correct the following");
	});

	it("uses the given summary title", () => {
		const html = buildForm(
			{ ...FORM_WITH_ERRORS, errorSummary: { title: "Es gibt ein Problem" } },
			"de",
		).html;

		expect(parse(html).querySelector(".kern-alert .kern-title")?.text).toBe(
			"Es gibt ein Problem",
		);
	});

	it("renders no summary without errors", () => {
		const result = buildForm(
			{ errorSummary: {}, contentBlocks: [field("vorname")] },
			"de",
		);

		expect(result.html).not.toContain("kern-alert");
		expect(result.warnings).toEqual([]);
	});

	it("warns when fields have errors but the form has no errorSummary", () => {
		const result = buildForm(
			{ ...FORM_WITH_ERRORS, errorSummary: undefined },
			"de",
		);

		expect(result.html).not.toContain("kern-alert");
		expect(result.warnings).toContain(
			"3 field(s) in the form have an error, but the form has no errorSummary. Set errorSummary: {} to list them above the form.",
		);
	});

	it("renders the actions row: secondary as type=button, then submit", () => {
		const buttons = parse(
			buildForm(FORM_WITH_ERRORS, "de").html,
		).querySelectorAll("button");

		expect(
			buttons.map((button) => [
				button.getAttribute("type"),
				button.getAttribute("class"),
				button.text.trim(),
			]),
		).toEqual([
			["button", "kern-btn kern-btn--secondary", "Zurück"],
			["submit", "kern-btn kern-btn--primary", "Weiter"],
		]);
	});

	it("produces markup that passes validation", () => {
		const validation = validateHtmlStrict(
			buildForm(FORM_WITH_ERRORS, "de").html,
		);

		expect(validation.issues).toEqual([]);
		expect(validation.ok).toBe(true);
	});
});
