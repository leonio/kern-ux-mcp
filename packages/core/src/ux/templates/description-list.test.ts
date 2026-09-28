import { describe, expect, it } from "vitest";
import { buildDescriptionList } from "./description-list.js";

describe("buildDescriptionList", () => {
	it("renders description list items", () => {
		const result = buildDescriptionList({
			items: [{ key: "Name", value: "Max" }],
		});
		expect(result.html).toContain("kern-description-list");
		expect(result.html).toContain("Name");
		expect(result.html).toContain("Max");
	});
});
