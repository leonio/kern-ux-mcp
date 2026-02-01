import { describe, expect, it } from "vitest";
import { buildPreline } from "./preline.js";

describe("buildPreline", () => {
	it("renders preline typography", () => {
		const result = buildPreline({ text: "Vorzeile" });
		expect(result.html).toContain('class="kern-preline"');
	});
});
