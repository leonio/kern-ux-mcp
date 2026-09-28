import { describe, expect, it } from "vitest";
import { buildSelect } from "./select.js";

describe("buildSelect", () => {
	it("builds a basic select", () => {
		const result = buildSelect(
			{
				name: "country",
				label: "Land",
				options: [
					{ value: "de", text: "Deutschland" },
					{ value: "at", text: "Österreich" },
					{ value: "ch", text: "Schweiz" },
				],
			},
			"de",
		);

		expect(result.html).toContain('class="kern-form-input"');
		expect(result.html).toContain('class="kern-form-input__select"');
		expect(result.html).toContain('name="country"');
		expect(result.html).toContain("Land");
		expect(result.html).toContain('value="de"');
		expect(result.html).toContain("Deutschland");
		expect(result.warnings).toHaveLength(0);
	});

	it("builds a select with selected option", () => {
		const result = buildSelect(
			{
				name: "size",
				label: "Size",
				options: [
					{ value: "s", text: "Small" },
					{ value: "m", text: "Medium", selected: true },
					{ value: "l", text: "Large" },
				],
			},
			"en",
		);

		expect(result.html).toMatch(/<option value="m" selected>Medium<\/option>/);
	});

	it("builds a disabled select", () => {
		const result = buildSelect(
			{
				name: "disabled",
				label: "Disabled Field",
				disabled: true,
				options: [{ value: "x", text: "X" }],
			},
			"en",
		);

		expect(result.html).toMatch(/<select[^>]*disabled/);
	});

	it("builds a select with hint", () => {
		const result = buildSelect(
			{
				name: "pref",
				label: "Preference",
				hint: "Choose your preferred option.",
				options: [{ value: "a", text: "A" }],
			},
			"en",
		);

		expect(result.html).toContain('class="kern-hint"');
		expect(result.html).toContain("Choose your preferred option.");
		expect(result.html).toContain("aria-describedby");
	});

	it("builds a select with error", () => {
		const result = buildSelect(
			{
				name: "required",
				label: "Required Field",
				error: "Please select an option.",
				options: [{ value: "v", text: "Value" }],
			},
			"en",
		);

		expect(result.html).toContain("kern-form-input--error");
		expect(result.html).toContain("kern-form-input__select--error");
		expect(result.html).toContain('class="kern-error"');
		expect(result.html).toContain('role="alert"');
		expect(result.html).toContain("kern-icon--danger");
		expect(result.html).toContain("Please select an option.");
	});

	it("warns on empty error message", () => {
		const result = buildSelect(
			{
				name: "test",
				label: "Test",
				error: "",
				options: [{ value: "x", text: "X" }],
			},
			"de",
		);

		expect(result.html).toContain("kern-form-input--error");
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toContain("empty");
	});

	it("builds a select with optional marker (DE)", () => {
		const result = buildSelect(
			{
				name: "opt",
				label: "Optionales Feld",
				optional: true,
				options: [{ value: "v", text: "Wert" }],
			},
			"de",
		);

		expect(result.html).toContain("kern-label__optional");
		expect(result.html).toContain("Optional");
	});

	it("builds a select with disabled option", () => {
		const result = buildSelect(
			{
				name: "mixed",
				label: "Mixed Options",
				options: [
					{ value: "enabled", text: "Enabled" },
					{ value: "disabled", text: "Disabled", disabled: true },
				],
			},
			"en",
		);

		expect(result.html).toMatch(
			/<option value="disabled" disabled>Disabled<\/option>/,
		);
	});
});
