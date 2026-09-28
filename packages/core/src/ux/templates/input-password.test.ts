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
				// @ts-expect-error disabled is omitted from the password schema; this tests the runtime guard.
				{ name: "pwd", label: "Passwort", disabled: true },
				"de",
			),
		).toThrow();
		expect(() =>
			buildInputPassword(
				// @ts-expect-error readonly is omitted from the password schema; this tests the runtime guard.
				{ name: "pwd", label: "Passwort", readonly: true },
				"de",
			),
		).toThrow();
	});
});
