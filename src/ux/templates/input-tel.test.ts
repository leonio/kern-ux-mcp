import { describe, expect, it } from "vitest";
import { buildInputTel } from "./input-tel.js";

describe("buildInputTel", () => {
	it("builds a tel input", () => {
		const result = buildInputTel({ name: "phone", label: "Telefon" }, "de");
		expect(result.html).toContain('type="tel"');
		expect(result.html).toContain('autocomplete="tel"');
		expect(result.html).toContain('name="phone"');
	});
});
