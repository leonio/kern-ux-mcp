import { describe, expect, it } from "vitest";
import { buildInputNumber } from "./input-number.js";

describe("buildInputNumber", () => {
	it("builds a number input", () => {
		const result = buildInputNumber({ name: "count", label: "Anzahl" }, "de");
		expect(result.html).toContain('type="text"');
		expect(result.html).toContain('inputmode="numeric"');
		expect(result.html).toContain('pattern="[0-9]*"');
		expect(result.html).not.toContain('type="number"');
		expect(result.html).toContain('name="count"');
		expect(result.html).toContain('class="kern-hint"');
		expect(result.html).toContain("Pflichtformat");
		expect(result.html).toContain("aria-describedby");
	});
});
