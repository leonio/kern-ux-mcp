import { describe, expect, it } from "vitest";
import { buildRadio } from "./radio.js";

describe("buildRadio", () => {
	describe("single mode", () => {
		it("builds a basic radio", () => {
			const result = buildRadio(
				{ mode: "single", name: "choice", value: "a", label: "Option A" },
				"de",
			);

			expect(result.html).toContain('class="kern-form-check"');
			expect(result.html).toContain('class="kern-form-check__radio"');
			expect(result.html).toContain('type="radio"');
			expect(result.html).toContain('name="choice"');
			expect(result.html).toContain('value="a"');
			expect(result.html).toContain("Option A");
			expect(result.warnings).toHaveLength(0);
		});

		it("builds a checked radio", () => {
			const result = buildRadio(
				{
					mode: "single",
					name: "choice",
					value: "b",
					label: "Option B",
					checked: true,
				},
				"de",
			);

			expect(result.html).toContain("checked");
		});

		it("builds a disabled radio", () => {
			const result = buildRadio(
				{
					mode: "single",
					name: "choice",
					value: "c",
					label: "Option C",
					disabled: true,
				},
				"de",
			);

			expect(result.html).toContain("disabled");
		});
	});

	describe("list mode", () => {
		it("builds a radio group in fieldset", () => {
			const result = buildRadio(
				{
					mode: "list",
					name: "gender",
					legend: "Geschlecht",
					items: [
						{ value: "m", label: "Männlich" },
						{ value: "f", label: "Weiblich" },
						{ value: "d", label: "Divers" },
					],
				},
				"de",
			);

			expect(result.html).toContain('class="kern-fieldset"');
			expect(result.html).toContain("<legend");
			expect(result.html).toContain("Geschlecht");
			expect(result.html).toContain('class="kern-fieldset__body"');
			expect(result.html).toContain("Männlich");
			expect(result.html).toContain("Weiblich");
			expect(result.html).toContain("Divers");
			expect(result.warnings).toHaveLength(0);
		});

		it("builds a horizontal radio group", () => {
			const result = buildRadio(
				{
					mode: "list",
					name: "yesno",
					legend: "Zustimmung",
					horizontal: true,
					items: [
						{ value: "yes", label: "Ja" },
						{ value: "no", label: "Nein" },
					],
				},
				"de",
			);

			expect(result.html).toContain("kern-fieldset__body--horizontal");
		});

		it("builds a radio group with hint", () => {
			const result = buildRadio(
				{
					mode: "list",
					name: "pref",
					legend: "Präferenz",
					hint: "Bitte wählen Sie eine Option.",
					items: [{ value: "a", label: "A" }],
				},
				"de",
			);

			expect(result.html).toContain('class="kern-hint"');
			expect(result.html).toContain("Bitte wählen Sie eine Option.");
			expect(result.html).toContain("aria-describedby");
		});

		it("builds a radio group with error", () => {
			const result = buildRadio(
				{
					mode: "list",
					name: "required",
					legend: "Pflichtfeld",
					error: "Bitte wählen Sie eine Option.",
					items: [{ value: "x", label: "X" }],
				},
				"de",
			);

			expect(result.html).toContain("kern-fieldset--error");
			expect(result.html).toContain('class="kern-error"');
			expect(result.html).toContain('role="alert"');
			expect(result.html).toContain("kern-icon--danger");
			expect(result.html).toContain("Bitte wählen Sie eine Option.");
		});

		it("warns on empty error message", () => {
			const result = buildRadio(
				{
					mode: "list",
					name: "test",
					legend: "Test",
					error: "",
					items: [{ value: "a", label: "A" }],
				},
				"de",
			);

			expect(result.html).toContain("kern-fieldset--error");
			expect(result.warnings).toHaveLength(1);
			expect(result.warnings[0]).toContain("empty");
		});

		it("builds a radio group with optional marker", () => {
			const result = buildRadio(
				{
					mode: "list",
					name: "opt",
					legend: "Optional",
					optional: true,
					items: [{ value: "v", label: "Value" }],
				},
				"de",
			);

			expect(result.html).toContain("kern-label__optional");
			expect(result.html).toContain("Optional");
		});

		it("builds with items having checked/disabled states", () => {
			const result = buildRadio(
				{
					mode: "list",
					name: "mixed",
					legend: "Mixed States",
					items: [
						{ value: "a", label: "Normal" },
						{ value: "b", label: "Checked", checked: true },
						{ value: "c", label: "Disabled", disabled: true },
					],
				},
				"en",
			);

			expect(result.html).toContain("checked");
			expect(result.html).toContain("disabled");
		});
	});
});
