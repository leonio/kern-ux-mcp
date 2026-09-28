import { describe, expect, it } from "vitest";
import { buildKopfzeile } from "./kopfzeile.js";

describe("buildKopfzeile", () => {
	it("renders header with optional nav", () => {
		const result = buildKopfzeile({ title: "Portal", includeNav: true });
		expect(result.html).toContain('class="kern-kopfzeile"');
		expect(result.html).toContain("Portal");
		expect(result.html).toContain("kern-kopfzeile__nav");
	});
});
