import { describe, expect, it } from "vitest";
import { buildInputGroup } from "./input-group.js";

describe("buildInputGroup", () => {
	it("builds an input group with prefix and suffix", () => {
		const result = buildInputGroup(
			{ name: "amount", prefix: "€", suffix: "EUR" },
			"de",
		);
		expect(result.html).toContain('class="kern-input-group"');
		expect(result.html).toContain("€");
		expect(result.html).toContain("EUR");
	});

	it("builds a readonly input group with readonly affixes", () => {
		const result = buildInputGroup(
			{
				name: "amount",
				prefix: "€",
				suffix: "EUR",
				value: "100",
				readonly: true,
			},
			"de",
		);

		expect(result.html).toContain("readonly");
		expect(result.html).toContain("kern-input-group-text--readonly");
	});
});
