import { describe, expect, it } from "vitest";
import { buildHeading } from "./heading.js";

describe("buildHeading", () => {
	it("renders heading with configured level", () => {
		const result = buildHeading({ text: "Überschrift", level: 3 });
		expect(result.html).toContain("<h3");
		expect(result.html).toContain("Überschrift");
	});
});
