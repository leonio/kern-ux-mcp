import { describe, expect, it } from "vitest";
import { buildSubline } from "./subline.js";

describe("buildSubline", () => {
	it("renders subline typography", () => {
		const result = buildSubline({ text: "Unterzeile" });
		expect(result.html).toContain('class="kern-subline"');
	});
});
