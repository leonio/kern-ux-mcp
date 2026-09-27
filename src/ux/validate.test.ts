import { describe, expect, it } from "vitest";

import { validateHtmlStrict } from "./validate.js";

function ruleIdsOf(html: string): string[] {
	return validateHtmlStrict(html).issues.map((i) => i.ruleId);
}

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

	it("passes when alert has role=alert", () => {
		const html = `<div class="kern-alert kern-alert--info" role="alert"></div>`;
		expect(ruleIdsOf(html)).not.toContain("alert.role");
	});

	it("emits a single th scope warning per fragment", () => {
		const html = `<table><caption>Data</caption><tr><th>A</th><th>B</th></tr></table>`;
		const thScope = ruleIdsOf(html).filter((id) => id === "table.th_scope");
		expect(thScope).toHaveLength(1);
	});
});

describe("validateHtmlStrict: loader", () => {
	it("accepts a visible loader with role=status and sr-only text", () => {
		const html = `<div class="kern-loader kern-loader--visible" role="status"><span class="kern-sr-only">Wird geladen...</span></div>`;
		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(true);
		expect(res.issues).toEqual([]);
	});

	it("errors when a visible loader lacks role=status", () => {
		const html = `<div class="kern-loader kern-loader--visible"><span class="kern-sr-only">Wird geladen...</span></div>`;
		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(false);
		expect(res.issues.map((i) => i.ruleId)).toEqual(["loader.role"]);
	});

	it("errors when a visible loader has no sr-only element", () => {
		const html = `<div class="kern-loader kern-loader--visible" role="status"></div>`;
		expect(ruleIdsOf(html)).toEqual(["loader.sr_text"]);
	});

	it("errors when the sr-only text is whitespace only", () => {
		const html = `<div class="kern-loader kern-loader--visible" role="status"><span class="kern-sr-only">   </span></div>`;
		expect(ruleIdsOf(html)).toEqual(["loader.sr_text"]);
	});

	it("reports both issues when role and sr-only text are missing", () => {
		const html = `<div class="kern-loader kern-loader--visible"></div>`;
		expect(ruleIdsOf(html)).toEqual(["loader.role", "loader.sr_text"]);
	});

	it("ignores loaders that are not visible", () => {
		const html = `<div class="kern-loader"></div>`;
		expect(ruleIdsOf(html)).toEqual([]);
	});
});

describe("validateHtmlStrict: dialog aria-labelledby target", () => {
	it("errors when aria-labelledby references a missing id", () => {
		const html = `<dialog class="kern-dialog" aria-labelledby="nope"><h2 id="other">Titel</h2></dialog>`;
		const res = validateHtmlStrict(html);

		expect(res.ok).toBe(false);
		const targetIssue = res.issues.find(
			(i) => i.ruleId === "dialog.aria_labelledby_target",
		);
		expect(targetIssue?.message.en).toContain("nope");
		expect(targetIssue?.message.de).toContain("nope");
		expect(targetIssue?.selectorHint).toBe("#nope");
	});

	it("does not also report the missing-attribute rule when the attribute exists", () => {
		const html = `<dialog class="kern-dialog" aria-labelledby="nope"></dialog>`;
		expect(ruleIdsOf(html)).toEqual(["dialog.aria_labelledby_target"]);
	});

	it("finds the target anywhere in the fragment, not only inside the dialog", () => {
		const html = `<h2 id="outside">Titel</h2><dialog class="kern-dialog" aria-labelledby="outside"></dialog>`;
		expect(ruleIdsOf(html)).toEqual([]);
	});
});

describe("validateHtmlStrict: icons", () => {
	it("errors when an icon is neither decorative nor labelled", () => {
		const html = `<span class="kern-icon kern-icon--download"></span>`;
		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(false);
		expect(res.issues.map((i) => i.ruleId)).toEqual(["icon.aria"]);
	});

	it("accepts a decorative icon with aria-hidden=true", () => {
		const html = `<span class="kern-icon kern-icon--download" aria-hidden="true"></span>`;
		expect(ruleIdsOf(html)).toEqual([]);
	});

	it("accepts a semantic icon with aria-label", () => {
		const html = `<span class="kern-icon kern-icon--download" role="img" aria-label="PDF herunterladen"></span>`;
		expect(ruleIdsOf(html)).toEqual([]);
	});

	it('treats aria-hidden="false" as not decorative', () => {
		const html = `<span class="kern-icon kern-icon--download" aria-hidden="false"></span>`;
		expect(ruleIdsOf(html)).toEqual(["icon.aria"]);
	});
});

describe("validateHtmlStrict: icon-only buttons", () => {
	// Icons are aria-hidden in every case so only the button rule is under test.
	const icon = `<span class="kern-icon kern-icon--close" aria-hidden="true"></span>`;

	it("errors when an icon-only button has no accessible label", () => {
		const html = `<button class="kern-btn">${icon}</button>`;
		const res = validateHtmlStrict(html);
		expect(res.ok).toBe(false);
		expect(res.issues.map((i) => i.ruleId)).toEqual([
			"button.icon_only_sr_label",
		]);
	});

	it("errors when the sr-only label is empty", () => {
		const html = `<button class="kern-btn">${icon}<span class="kern-label kern-sr-only"> </span></button>`;
		expect(ruleIdsOf(html)).toEqual(["button.icon_only_sr_label"]);
	});

	it("applies to link buttons as well", () => {
		const html = `<a class="kern-btn" href="/close">${icon}</a>`;
		expect(ruleIdsOf(html)).toEqual(["button.icon_only_sr_label"]);
	});

	it.each([
		[
			"a visible .kern-label",
			`<button class="kern-btn">${icon}<span class="kern-label">Schließen</span></button>`,
		],
		[
			"an aria-label on the button",
			`<button class="kern-btn" aria-label="Schließen">${icon}</button>`,
		],
		[
			"a .kern-label.kern-sr-only",
			`<button class="kern-btn">${icon}<span class="kern-label kern-sr-only">Schließen</span></button>`,
		],
		[
			"a .kern-label.kern-sr-only-mobile",
			`<button class="kern-btn">${icon}<span class="kern-label kern-sr-only-mobile">Schließen</span></button>`,
		],
		[
			"a bare .kern-sr-only span",
			`<button class="kern-btn">${icon}<span class="kern-sr-only">Schließen</span></button>`,
		],
	])("accepts an icon button labelled by %s", (_case, html) => {
		expect(ruleIdsOf(html)).toEqual([]);
	});

	it("ignores buttons without an icon", () => {
		const html = `<button class="kern-btn"></button>`;
		expect(ruleIdsOf(html)).toEqual([]);
	});
});

describe("validateHtmlStrict: form error wiring", () => {
	it.each([
		"kern-input__error",
		"kern-select__error",
		"kern-textarea__error",
		"kern-fieldset__error",
	])("warns when a .%s element has no id", (errorClass) => {
		const html = `<p class="${errorClass}">Pflichtfeld</p>`;
		expect(ruleIdsOf(html)).toEqual(["form.error_id"]);
	});

	it("warns when no field references the error id via aria-describedby", () => {
		const html = `<input id="name" class="kern-form-input__input"><p id="name-error" class="kern-input__error">Pflichtfeld</p>`;
		const res = validateHtmlStrict(html);

		expect(res.issues.map((i) => i.ruleId)).toEqual(["form.error_describedby"]);
		expect(res.issues[0]?.selectorHint).toBe("#name-error");
	});

	it("accepts an error referenced as one of several aria-describedby ids", () => {
		const html = `<input id="name" aria-describedby="name-hint name-error"><p id="name-hint">Hinweis</p><p id="name-error" class="kern-input__error">Pflichtfeld</p>`;
		expect(ruleIdsOf(html)).toEqual([]);
	});

	it("keeps ok=true because error wiring issues are warnings", () => {
		const res = validateHtmlStrict(
			`<p class="kern-input__error">Pflichtfeld</p>`,
		);
		expect(res.issues.every((i) => i.severity === "warning")).toBe(true);
		expect(res.ok).toBe(true);
	});
});
