import { describe, expect, it } from "vitest";

import { validateHtmlStrict } from "../validate.js";
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

	describe("default hint", () => {
		it("derives the German hint from accept tokens", () => {
			const result = buildInputFile(
				{ name: "upload", label: "Nachweis", accept: ".pdf, image/png" },
				"de",
			);
			expect(result.html).toContain(
				"Pflichtformat: PDF, IMAGE/PNG; maximale Dateigroesse 10 MB.",
			);
		});

		it("derives the English hint from accept tokens", () => {
			const result = buildInputFile(
				{ name: "upload", label: "Proof", accept: ".jpg" },
				"en",
			);
			expect(result.html).toContain(
				"Required format: JPG; maximum file size 10 MB.",
			);
		});

		it("uses the generic English hint when accept is missing", () => {
			const result = buildInputFile({ name: "upload", label: "Proof" }, "en");
			expect(result.html).toContain(
				"Required format: upload a readable file (for example PDF, JPG, PNG)",
			);
		});

		it("falls back to the generic hint when accept has no usable tokens", () => {
			const result = buildInputFile(
				{ name: "upload", label: "Nachweis", accept: " , ," },
				"de",
			);
			expect(result.html).toContain(
				"Pflichtformat: lesbare Datei hochladen (zum Beispiel PDF, JPG, PNG)",
			);
		});

		it("treats a whitespace-only hint as missing", () => {
			const result = buildInputFile(
				{ name: "upload", label: "Nachweis", hint: "   " },
				"de",
			);
			expect(result.html).toContain("maximale Dateigroesse 10 MB.");
		});
	});

	describe("error state", () => {
		it("renders the error and references both hint and error via aria-describedby", () => {
			const result = buildInputFile(
				{ name: "upload", label: "Nachweis", error: "Datei fehlt" },
				"de",
			);

			expect(result.html).toContain(
				'<div class="kern-form-input kern-form-input--error">',
			);
			expect(result.html).toContain("kern-form-input__input--error");
			expect(result.html).toContain('role="alert"');
			expect(result.html).toContain("Datei fehlt");

			const describedBy = result.html.match(
				/aria-describedby="(hint-\w+) (error-\w+)"/,
			);
			expect(describedBy).not.toBeNull();
			expect(result.html).toContain(`id="${describedBy?.[1]}"`);
			expect(result.html).toContain(`id="${describedBy?.[2]}"`);
			expect(result.warnings).toEqual([]);
		});

		it("warns when the error message is empty but still renders the error block", () => {
			const result = buildInputFile(
				{ name: "upload", label: "Nachweis", error: "" },
				"de",
			);
			expect(result.warnings).toEqual(["Error message is empty"]);
			expect(result.html).toContain('class="kern-error"');
		});
	});

	it("renders disabled and optional states", () => {
		const result = buildInputFile(
			{ name: "upload", label: "Nachweis", disabled: true, optional: true },
			"de",
		);
		expect(result.html).toMatch(/<input [^>]*\bdisabled\b/);
		expect(result.html).toContain(
			'<span class="kern-label__optional">Optional</span>',
		);
	});

	it("produces markup that passes strict validation, including the error state", () => {
		for (const error of [undefined, "Datei fehlt"]) {
			const result = buildInputFile(
				{ name: "upload", label: "Nachweis", accept: ".pdf", error },
				"de",
			);
			expect(validateHtmlStrict(result.html).ok).toBe(true);
		}
	});
});
