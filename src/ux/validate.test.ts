import { describe, expect, it } from "vitest";

import { validateHtmlStrict } from "./validate.js";

describe("validateHtmlStrict", () => {
	it("accepts a valid dialog with aria-labelledby wiring", () => {
		const html = `
<dialog id="modal1" class="kern-dialog" aria-labelledby="modal1_heading" style="display:block">
  <header class="kern-dialog__header">
    <h2 class="kern-title kern-title--large" id="modal1_heading">Frage?</h2>
    <button class="kern-btn kern-btn--tertiary">
      <span class="kern-icon kern-icon--close" aria-hidden="true"></span>
      <span class="kern-sr-only">Schließen</span>
    </button>
  </header>
</dialog>
    `.trim();

		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(true);
	});

	it("errors when dialog aria-labelledby is missing", () => {
		const html = `<dialog class="kern-dialog"></dialog>`;
		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(false);
		expect(res.issues.some((i) => i.ruleId === "dialog.aria_labelledby")).toBe(
			true,
		);
	});

	it("errors when alert is missing role=alert", () => {
		const html = `<div class="kern-alert kern-alert--info"></div>`;
		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(false);
		expect(res.issues.some((i) => i.ruleId === "alert.role")).toBe(true);
	});

	it("errors when label for references missing id", () => {
		const html = `<label for="missing-input">Name</label>`;
		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(false);
		expect(res.issues.some((i) => i.ruleId === "form.label_for")).toBe(true);
	});

	it("passes when label for matches input id", () => {
		const html = `<label for="name-input">Name</label><input id="name-input" type="text">`;
		const res = validateHtmlStrict(html);
		expect(res.issues.some((i) => i.ruleId === "form.label_for")).toBe(false);
	});

	it("warns when table has no caption", () => {
		const html = `<table><thead><tr><th scope="col">A</th></tr></thead></table>`;
		const res = validateHtmlStrict(html);
		expect(res.issues.some((i) => i.ruleId === "table.caption")).toBe(true);
	});

	it("passes when table has caption", () => {
		const html = `<table><caption>Data</caption><thead><tr><th scope="col">A</th></tr></thead></table>`;
		const res = validateHtmlStrict(html);
		expect(res.issues.some((i) => i.ruleId === "table.caption")).toBe(false);
	});

	it("warns when th has no scope", () => {
		const html = `<table><caption>Data</caption><thead><tr><th>A</th></tr></thead></table>`;
		const res = validateHtmlStrict(html);
		expect(res.issues.some((i) => i.ruleId === "table.th_scope")).toBe(true);
	});

	it("errors when img has no alt attribute", () => {
		const html = `<img src="photo.jpg">`;
		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(false);
		expect(res.issues.some((i) => i.ruleId === "img.alt")).toBe(true);
	});

	it("passes when img has empty alt (decorative)", () => {
		const html = `<img src="photo.jpg" alt="">`;
		const res = validateHtmlStrict(html);
		expect(res.issues.some((i) => i.ruleId === "img.alt")).toBe(false);
	});
});
