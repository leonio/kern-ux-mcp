import { describe, expect, it } from "vitest";
import { buildInputUrl } from "./input-url.js";

describe("buildInputUrl", () => {
	it("builds a url input", () => {
		const result = buildInputUrl({ name: "website", label: "Website" }, "de");
		expect(result.html).toContain('type="url"');
		expect(result.html).toContain('name="website"');
	});
});
