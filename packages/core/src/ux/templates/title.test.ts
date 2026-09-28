import { describe, expect, it } from "vitest";
import { buildTitle } from "./title.js";

describe("buildTitle", () => {
	it("renders title with size modifier", () => {
		const result = buildTitle({ text: "Titel", size: "large" });
		expect(result.html).toContain('class="kern-title kern-title--large"');
		expect(result.html).toContain("Titel");
	});
});
