import { describe, expect, it } from "vitest";
import { buildLink } from "./link.js";

describe("buildLink", () => {
	it("renders link typography", () => {
		const result = buildLink({ text: "Mehr", href: "/mehr" });
		expect(result.html).toContain('class="kern-link"');
		expect(result.html).toContain('href="/mehr"');
	});
});
