import { describe, expect, it } from "vitest";

import { validateHtmlStrict } from "../validate.js";
import { buildInputFile } from "./input-file.js";

describe("buildInputFile", () => {
	it("builds a file input", () => {
		const result = buildInputFile({ name: "upload", label: "Datei" }, "de");
		expect(result.html).toContain('type="file"');
		expect(result.html).toContain('name="upload"');
		expect(result.html).not.toContain("kern-hint");
		expect(result.html).not.toContain("aria-describedby");
	});

	it("renders accept and hint", () => {
		const result = buildInputFile(
			{ name: "upload", label: "Datei", accept: ".pdf", hint: "Nur PDF" },
			"de",
		);
		expect(result.html).toContain('accept=".pdf"');
		expect(result.html).toContain("Nur PDF");
	});

	it.each<[string, object]>([
		["no hint, even with accept", { accept: ".pdf, image/png" }],
		["a whitespace-only hint", { hint: "   " }],
	])("renders no hint for %s", (_, fields) => {
		const result = buildInputFile(
			{ name: "upload", label: "Nachweis", ...fields },
			"de",
		);

		expect(result.html).not.toContain("kern-hint");
		expect(result.html).not.toContain("aria-describedby");
	});

	describe("error state", () => {
		it("renders the error and references both hint and error via aria-describedby", () => {
			const result = buildInputFile(
				{
					name: "upload",
					label: "Nachweis",
					hint: "PDF, höchstens 5 MB",
					error: "Datei fehlt",
				},
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

	it("escapes the model's text", () => {
		const text = `<b>"A" & 'B'</b>`;
		const result = buildInputFile(
			{ name: "upload", label: text, hint: text, error: text, accept: text },
			"de",
		);

		expect(result.html).not.toContain("<b>");
		expect(result.html).toContain(
			"&lt;b&gt;&quot;A&quot; &amp; &#039;B&#039;&lt;/b&gt;",
		);
	});
});
