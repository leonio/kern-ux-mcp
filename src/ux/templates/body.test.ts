import { describe, expect, it } from "vitest";
import { buildBody } from "./body.js";

describe("buildBody", () => {
	it("renders body text with modifiers", () => {
		const result = buildBody({ text: "Text", size: "large", bold: true });
		expect(result.html).toContain(
			'class="kern-body kern-body--large kern-body--bold"',
		);
	});
});
