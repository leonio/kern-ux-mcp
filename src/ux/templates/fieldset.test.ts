import { describe, expect, it } from "vitest";
import { buildFieldset } from "./fieldset.js";

describe("buildFieldset", () => {
	it("builds fieldset with hint and horizontal body", () => {
		const result = buildFieldset({ includeHint: true, horizontal: true });
		expect(result.html).toContain('class="kern-fieldset"');
		expect(result.html).toContain("kern-fieldset__hint");
		expect(result.html).toContain("kern-fieldset__body--horizontal");
	});
});
