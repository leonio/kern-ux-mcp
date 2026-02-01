import { describe, expect, it } from "vitest";
import { buildInputDate } from "./input-date.js";

describe("buildInputDate", () => {
	it("builds a date input", () => {
		const result = buildInputDate({ name: "dob", label: "Geburtsdatum" }, "de");
		expect(result.html).toContain('type="date"');
		expect(result.html).toContain('name="dob"');
	});
});
