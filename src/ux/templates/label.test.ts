import { describe, expect, it } from "vitest";
import { buildLabel } from "./label.js";

describe("buildLabel", () => {
	it("renders label typography", () => {
		const result = buildLabel({ text: "Feld" });
		expect(result.html).toContain('class="kern-label"');
		expect(result.html).toContain("Feld");
	});
});
