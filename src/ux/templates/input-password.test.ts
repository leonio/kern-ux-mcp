import { describe, expect, it } from "vitest";
import { buildInputPassword } from "./input-password.js";

describe("buildInputPassword", () => {
	it("builds a password input", () => {
		const result = buildInputPassword({ name: "pwd", label: "Passwort" }, "de");
		expect(result.html).toContain('type="password"');
		expect(result.html).toContain('name="pwd"');
	});

	it("rejects disabled and readonly password props", () => {
		expect(() =>
			buildInputPassword(
				{ name: "pwd", label: "Passwort", disabled: true } as any,
				"de",
			),
		).toThrow();
		expect(() =>
			buildInputPassword(
				{ name: "pwd", label: "Passwort", readonly: true } as any,
				"de",
			),
		).toThrow();
	});
});
