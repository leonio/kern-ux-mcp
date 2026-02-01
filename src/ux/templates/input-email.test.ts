import { describe, expect, it } from "vitest";
import { buildInputEmail } from "./input-email.js";

describe("buildInputEmail", () => {
	it("builds an email input", () => {
		const result = buildInputEmail({ name: "mail", label: "E-Mail" }, "de");
		expect(result.html).toContain('type="email"');
		expect(result.html).toContain('autocomplete="email"');
		expect(result.html).toContain('name="mail"');
	});
});
