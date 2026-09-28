import { describe, expect, it } from "vitest";
import { buildDivider } from "./divider.js";

describe("buildDivider", () => {
	it("renders decorative divider by default", () => {
		const result = buildDivider({});
		expect(result.html).toContain('class="kern-divider"');
		expect(result.html).toContain('aria-hidden="true"');
	});
});
