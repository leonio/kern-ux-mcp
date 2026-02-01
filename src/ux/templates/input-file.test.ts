import { describe, expect, it } from "vitest";
import { buildInputFile } from "./input-file.js";

describe("buildInputFile", () => {
	it("builds a file input", () => {
		const result = buildInputFile({ name: "upload", label: "Datei" }, "de");
		expect(result.html).toContain('type="file"');
		expect(result.html).toContain('name="upload"');
		expect(result.html).toContain('class="kern-hint"');
		expect(result.html).toContain("Dateigroesse");
		expect(result.html).toContain("aria-describedby");
	});

	it("renders accept and hint", () => {
		const result = buildInputFile(
			{ name: "upload", label: "Datei", accept: ".pdf", hint: "Nur PDF" },
			"de",
		);
		expect(result.html).toContain('accept=".pdf"');
		expect(result.html).toContain("Nur PDF");
	});
});
