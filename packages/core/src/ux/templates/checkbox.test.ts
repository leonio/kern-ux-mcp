import { describe, expect, it } from "vitest";
import { buildCheckbox } from "./checkbox.js";

describe("buildCheckbox - single mode", () => {
	it("builds a basic single checkbox", () => {
		const result = buildCheckbox(
			{ mode: "single", name: "terms", label: "Ich akzeptiere die AGB" },
			"de",
		);

		expect(result.html).toContain('class="kern-form-check"');
		expect(result.html).toContain('type="checkbox"');
		expect(result.html).toContain('name="terms"');
		expect(result.html).toContain("Ich akzeptiere die AGB");
		expect(result.html).toContain('class="kern-label"');
		// Should have matching id and for attributes
		expect(result.html).toMatch(/id="checkbox-[a-f0-9]+"/);
		expect(result.html).toMatch(/for="checkbox-[a-f0-9]+"/);
		expect(result.warnings).toHaveLength(0);
	});

	it("builds a checked checkbox", () => {
		const result = buildCheckbox(
			{ mode: "single", name: "opt", label: "Option", checked: true },
			"en",
		);

		expect(result.html).toContain("checked");
	});

	it("builds a disabled checkbox", () => {
		const result = buildCheckbox(
			{ mode: "single", name: "opt", label: "Option", disabled: true },
			"en",
		);

		expect(result.html).toContain("disabled");
	});

	it("builds a checkbox with error state", () => {
		const result = buildCheckbox(
			{
				mode: "single",
				name: "terms",
				label: "Terms",
				error: { message: "You must accept the terms" },
			},
			"en",
		);

		expect(result.html).toContain("kern-form-check--error");
		expect(result.html).toContain("kern-form-check__checkbox--error");
		expect(result.html).toContain('class="kern-error"');
		expect(result.html).toContain('role="alert"');
		expect(result.html).toContain("You must accept the terms");
		expect(result.html).toContain("aria-describedby");
		expect(result.html).toContain("kern-icon--danger");
	});

	it("warns when error message is empty", () => {
		const result = buildCheckbox(
			{
				mode: "single",
				name: "terms",
				label: "Terms",
				error: { message: "" },
			},
			"en",
		);

		expect(result.html).toContain("kern-form-check--error");
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toContain("empty");
	});

	it("uses custom id when provided", () => {
		const result = buildCheckbox(
			{ mode: "single", id: "my-checkbox", name: "opt", label: "Option" },
			"en",
		);

		expect(result.html).toContain('id="my-checkbox"');
		expect(result.html).toContain('for="my-checkbox"');
	});
});

describe("buildCheckbox - list mode", () => {
	it("builds a checkbox list without per-item names", () => {
		const result = buildCheckbox(
			{
				mode: "list",
				legend: "Select options",
				groupName: "options",
				items: [{ label: "Option A" }, { label: "Option B", checked: true }],
			},
			"en",
		);

		expect(result.html).toContain('name="options"');
		expect(result.html).toContain("Option A");
		expect(result.html).toContain("Option B");
		expect(result.warnings).toHaveLength(0);
	});

	it("builds a checkbox list in fieldset", () => {
		const result = buildCheckbox(
			{
				mode: "list",
				legend: "Select options",
				groupName: "options",
				items: [{ label: "Option A" }, { label: "Option B" }],
			},
			"en",
		);

		expect(result.html).toContain('class="kern-fieldset"');
		expect(result.html).toContain("<legend");
		expect(result.html).toContain("Select options");
		expect(result.html).toContain("kern-fieldset__body");
		expect(result.html).toContain("Option A");
		expect(result.html).toContain("Option B");
		expect(result.warnings).toHaveLength(0);
	});

	it("builds a checkbox list with optional marker", () => {
		const result = buildCheckbox(
			{
				mode: "list",
				legend: "Preferences",
				groupName: "prefs",
				optional: true,
				items: [{ label: "Pref 1" }],
			},
			"en",
		);

		expect(result.html).toContain("kern-label__optional");
		expect(result.html).toContain("Optional");
	});

	it("shows German optional marker with de locale", () => {
		const result = buildCheckbox(
			{
				mode: "list",
				legend: "Einstellungen",
				groupName: "prefs",
				optional: true,
				items: [{ label: "Option 1" }],
			},
			"de",
		);

		expect(result.html).toContain("Optional");
	});

	it("builds a checkbox list with hint", () => {
		const result = buildCheckbox(
			{
				mode: "list",
				legend: "Options",
				groupName: "opts",
				hint: { text: "Select at least one" },
				items: [{ label: "Opt 1" }],
			},
			"en",
		);

		expect(result.html).toContain('class="kern-hint"');
		expect(result.html).toContain("Select at least one");
		expect(result.html).toContain("aria-describedby");
	});

	it("builds a checkbox list with error", () => {
		const result = buildCheckbox(
			{
				mode: "list",
				legend: "Required",
				groupName: "req",
				items: [{ label: "Item" }],
				error: { message: "Please select at least one option" },
			},
			"en",
		);

		expect(result.html).toContain("kern-fieldset--error");
		expect(result.html).toContain("kern-form-check__checkbox--error");
		expect(result.html).toContain("Please select at least one option");
		expect(result.html).toContain('role="alert"');
	});

	it("builds a checkbox list with mixed states", () => {
		const result = buildCheckbox(
			{
				mode: "list",
				legend: "Items",
				groupName: "items",
				items: [
					{ label: "Normal" },
					{ label: "Checked", checked: true },
					{ label: "Disabled", disabled: true },
				],
			},
			"en",
		);

		// Count checkboxes
		const checkboxMatches = result.html.match(/type="checkbox"/g);
		expect(checkboxMatches).toHaveLength(3);
		expect(result.html).toContain("checked");
		expect(result.html).toContain("disabled");
	});
});
