import { describe, expect, it } from "vitest";
import { buildInputText } from "./input-text.js";

describe("buildInputText", () => {
	it("builds a basic text input", () => {
		const result = buildInputText(
			{ name: "username", label: "Benutzername" },
			"de",
		);

		expect(result.html).toContain('class="kern-form-input"');
		expect(result.html).toContain('class="kern-form-input__input"');
		expect(result.html).toContain('type="text"');
		expect(result.html).toContain('name="username"');
		expect(result.html).toContain("Benutzername");
		expect(result.html).toContain('class="kern-hint"');
		expect(result.html).toContain("Pflichtformat");
		expect(result.html).toContain("aria-describedby");
		expect(result.warnings).toHaveLength(0);
	});

	it("builds an input with value", () => {
		const result = buildInputText(
			{ name: "name", label: "Name", value: "Max Mustermann" },
			"de",
		);

		expect(result.html).toContain('value="Max Mustermann"');
	});

	it("builds an input with placeholder", () => {
		const result = buildInputText(
			{ name: "email", label: "E-Mail", placeholder: "mail@example.com" },
			"de",
		);

		expect(result.html).toContain('placeholder="mail@example.com"');
	});

	it("renders an explicit autocomplete token", () => {
		const result = buildInputText(
			{ name: "givenName", label: "Vorname", autocomplete: "given-name" },
			"de",
		);

		expect(result.html).toContain('autocomplete="given-name"');
	});

	it("builds a disabled input", () => {
		const result = buildInputText(
			{ name: "disabled", label: "Disabled", disabled: true },
			"en",
		);

		expect(result.html).toMatch(/<input[^>]*disabled/);
	});

	it("builds a readonly input", () => {
		const result = buildInputText(
			{ name: "readonly", label: "Read Only", readonly: true },
			"en",
		);

		expect(result.html).toMatch(/<input[^>]*readonly/);
	});

	it("builds an input with hint", () => {
		const result = buildInputText(
			{ name: "pwd", label: "Password", hint: "At least 8 characters." },
			"en",
		);

		expect(result.html).toContain('class="kern-hint"');
		expect(result.html).toContain("At least 8 characters.");
		expect(result.html).toContain("aria-describedby");
	});

	it("builds an input with error", () => {
		const result = buildInputText(
			{
				name: "required",
				label: "Required Field",
				error: "This field is required.",
			},
			"en",
		);

		expect(result.html).toContain("kern-form-input--error");
		expect(result.html).toContain("kern-form-input__input--error");
		expect(result.html).toContain('class="kern-error"');
		expect(result.html).toContain('role="alert"');
		expect(result.html).toContain("kern-icon--danger");
		expect(result.html).toContain("This field is required.");
	});

	it("warns on empty error message", () => {
		const result = buildInputText(
			{ name: "test", label: "Test", error: "" },
			"de",
		);

		expect(result.html).toContain("kern-form-input--error");
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toContain("empty");
	});

	it("builds an input with optional marker (DE)", () => {
		const result = buildInputText(
			{ name: "opt", label: "Optionales Feld", optional: true },
			"de",
		);

		expect(result.html).toContain("kern-label__optional");
		expect(result.html).toContain("Optional");
	});

	it("builds different input types", () => {
		const emailResult = buildInputText(
			{ name: "email", label: "E-Mail", type: "email" },
			"de",
		);
		expect(emailResult.html).toContain('type="email"');
		expect(emailResult.html).toContain('autocomplete="email"');

		const telResult = buildInputText(
			{ name: "phone", label: "Telefon", type: "tel" },
			"de",
		);
		expect(telResult.html).toContain('type="tel"');
		expect(telResult.html).toContain('autocomplete="tel"');

		const passwordResult = buildInputText(
			{ name: "pwd", label: "Passwort", type: "password" },
			"de",
		);
		expect(passwordResult.html).toContain('type="password"');
		expect(passwordResult.html).not.toContain("autocomplete=");
	});
});
