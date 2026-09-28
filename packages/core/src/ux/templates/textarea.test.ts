import { describe, expect, it } from "vitest";
import { buildTextarea } from "./textarea.js";

describe("buildTextarea", () => {
	it("should generate basic textarea HTML", () => {
		const result = buildTextarea({ name: "message", label: "Nachricht" }, "de");
		expect(result.html).toContain('class="kern-form-input"');
		expect(result.html).toContain('class="kern-label"');
		expect(result.html).toContain('class="kern-form-input__input"');
		expect(result.html).toContain("<textarea");
		expect(result.html).toContain('name="message"');
		expect(result.warnings).toEqual([]);
	});

	it("should include value inside textarea element", () => {
		const result = buildTextarea(
			{ name: "msg", label: "Message", value: "Hello World" },
			"en",
		);
		expect(result.html).toContain(">Hello World</textarea>");
	});

	it("should include placeholder attribute", () => {
		const result = buildTextarea(
			{
				name: "bio",
				label: "Biography",
				placeholder: "Tell us about yourself...",
			},
			"en",
		);
		expect(result.html).toContain('placeholder="Tell us about yourself..."');
	});

	it("should add disabled attribute when disabled", () => {
		const result = buildTextarea(
			{ name: "readonly", label: "Disabled", disabled: true },
			"de",
		);
		expect(result.html).toContain("disabled");
	});

	it("should add readonly attribute when readonly", () => {
		const result = buildTextarea(
			{ name: "fixed", label: "Read Only", readonly: true },
			"en",
		);
		expect(result.html).toContain("readonly");
	});

	it("should include hint with aria-describedby", () => {
		const result = buildTextarea(
			{ name: "desc", label: "Description", hint: "Maximum 500 characters." },
			"en",
		);
		expect(result.html).toContain('class="kern-hint"');
		expect(result.html).toContain("Maximum 500 characters.");
		expect(result.html).toContain("aria-describedby");
	});

	it("should include error with alert role", () => {
		const result = buildTextarea(
			{
				name: "required",
				label: "Required Field",
				error: "This field is required.",
			},
			"en",
		);
		expect(result.html).toContain(
			'class="kern-form-input kern-form-input--error"',
		);
		expect(result.html).toContain('class="kern-error"');
		expect(result.html).toContain('role="alert"');
		expect(result.html).toContain("This field is required.");
	});

	it("should warn about empty error message", () => {
		const result = buildTextarea(
			{ name: "test", label: "Test", error: "" },
			"de",
		);
		expect(result.warnings).toContain("Error message is empty");
	});

	it("should show optional marker in German", () => {
		const result = buildTextarea(
			{ name: "opt", label: "Optionales Feld", optional: true },
			"de",
		);
		expect(result.html).toContain('class="kern-label__optional"');
		expect(result.html).toContain("Optional");
	});

	it("should show optional marker in English", () => {
		const result = buildTextarea(
			{ name: "opt", label: "Optional Field", optional: true },
			"en",
		);
		expect(result.html).toContain('class="kern-label__optional"');
		expect(result.html).toContain("optional");
	});

	it("should include rows and cols attributes", () => {
		const result = buildTextarea(
			{ name: "sized", label: "Sized Textarea", rows: 10, cols: 50 },
			"en",
		);
		expect(result.html).toContain('rows="10"');
		expect(result.html).toContain('cols="50"');
	});
});
