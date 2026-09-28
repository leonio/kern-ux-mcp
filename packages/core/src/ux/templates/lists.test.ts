import { describe, expect, it } from "vitest";
import { buildLists } from "./lists.js";

describe("buildLists", () => {
	it("renders unordered list by default", () => {
		const result = buildLists({ text: "Punkt" });
		expect(result.html).toContain("<ul");
		expect(result.html).toContain("Punkt 1");
	});
});
