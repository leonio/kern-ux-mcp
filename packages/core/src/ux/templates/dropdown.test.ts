import { describe, expect, it } from "vitest";
import { buildDropdown } from "./dropdown.js";

describe("buildDropdown", () => {
	it("should generate basic dropdown HTML", () => {
		const result = buildDropdown(
			{
				triggerLabel: "Select option",
				name: "choice",
				options: [
					{ value: "a", label: "Option A" },
					{ value: "b", label: "Option B" },
				],
			},
			"de",
		);
		expect(result.html).toContain('class="kern-dropdown"');
		expect(result.html).toContain("<details");
		expect(result.html).toContain("<summary>");
		expect(result.html).toContain("Select option");
		expect(result.html).toContain('name="choice"');
		expect(result.html).toContain('value="a"');
		expect(result.html).toContain("Option A");
	});

	it("should warn about experimental status", () => {
		const result = buildDropdown(
			{
				triggerLabel: "Pick",
				name: "pick",
				options: [{ value: "x", label: "X" }],
			},
			"en",
		);
		expect(result.warnings).toContain(
			"Dropdown is an experimental component and may change.",
		);
		expect(result.html).toContain("<!-- WARNING: Experimental Component -->");
	});

	it("should use radio inputs by default", () => {
		const result = buildDropdown(
			{
				triggerLabel: "Select",
				name: "radio-group",
				options: [{ value: "1", label: "One" }],
			},
			"de",
		);
		expect(result.html).toContain('type="radio"');
	});

	it("should support checkbox inputs for multi-select", () => {
		const result = buildDropdown(
			{
				triggerLabel: "Select multiple",
				name: "check-group",
				options: [
					{ value: "a", label: "A" },
					{ value: "b", label: "B" },
				],
				inputType: "checkbox",
			},
			"en",
		);
		expect(result.html).toContain('type="checkbox"');
	});

	it("should mark checked options", () => {
		const result = buildDropdown(
			{
				triggerLabel: "Select",
				name: "opts",
				options: [
					{ value: "a", label: "A" },
					{ value: "b", label: "B", checked: true },
				],
			},
			"de",
		);
		expect(result.html).toContain('value="b" checked');
	});

	it("should mark disabled options", () => {
		const result = buildDropdown(
			{
				triggerLabel: "Select",
				name: "opts",
				options: [
					{ value: "a", label: "A", disabled: true },
					{ value: "b", label: "B" },
				],
			},
			"en",
		);
		expect(result.html).toContain('value="a" disabled');
	});

	it("should add open attribute when open", () => {
		const result = buildDropdown(
			{
				triggerLabel: "Expanded",
				name: "exp",
				options: [{ value: "x", label: "X" }],
				open: true,
			},
			"de",
		);
		expect(result.html).toContain("<details open>");
	});

	it("should escape special characters", () => {
		const result = buildDropdown(
			{
				triggerLabel: "Choose <item>",
				name: "esc",
				options: [{ value: "a&b", label: "A & B" }],
			},
			"en",
		);
		expect(result.html).toContain("Choose &lt;item&gt;");
		expect(result.html).toContain("A &amp; B");
	});
});
