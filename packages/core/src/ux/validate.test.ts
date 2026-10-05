import { describe, expect, it } from "vitest";

import { buildCheckbox } from "./templates/checkbox.js";
import { buildInputDate } from "./templates/input-date.js";
import { buildInputEmail } from "./templates/input-email.js";
import { buildInputFile } from "./templates/input-file.js";
import { buildInputNumber } from "./templates/input-number.js";
import { buildInputPassword } from "./templates/input-password.js";
import { buildInputTel } from "./templates/input-tel.js";
import { buildInputText } from "./templates/input-text.js";
import { buildInputUrl } from "./templates/input-url.js";
import { buildRadio } from "./templates/radio.js";
import { buildSelect } from "./templates/select.js";
import { buildTextarea } from "./templates/textarea.js";
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
	it("warns when a .kern-error element has no id", () => {
		const res = validateHtmlStrict(`<p class="kern-error">Pflichtfeld</p>`);

		expect(res.issues.map((i) => i.ruleId)).toEqual(["form.error_id"]);
		expect(res.issues[0]?.selectorHint).toBe(".kern-error");
	});

	it("warns when no field references the error id via aria-describedby", () => {
		const html = `<label for="name">Name</label><input id="name" class="kern-form-input__input"><p id="name-error" class="kern-error">Pflichtfeld</p>`;
		const res = validateHtmlStrict(html);

		expect(res.issues.map((i) => i.ruleId)).toEqual(["form.error_describedby"]);
		expect(res.issues[0]?.selectorHint).toBe("#name-error");
	});

	it("accepts an error referenced as one of several aria-describedby ids", () => {
		const html = `<label for="name">Name</label><input id="name" aria-describedby="name-hint name-error"><p id="name-hint">Hinweis</p><p id="name-error" class="kern-error">Pflichtfeld</p>`;
		expect(ruleIdsOf(html)).toEqual([]);
	});

	it("accepts an error referenced by its fieldset", () => {
		const html = `<fieldset class="kern-fieldset kern-fieldset--error" aria-describedby="group-error"><legend class="kern-label">Anrede</legend><p class="kern-error" id="group-error">Bitte auswählen</p></fieldset>`;
		expect(ruleIdsOf(html)).toEqual([]);
	});

	it("keeps ok=true because error wiring issues are warnings", () => {
		const res = validateHtmlStrict(`<p class="kern-error">Pflichtfeld</p>`);
		expect(res.issues.every((i) => i.severity === "warning")).toBe(true);
		expect(res.ok).toBe(true);
	});

	// The rules used to look for .kern-input__error and similar, which no template
	// emits, so they never fired on generated output.
	describe("on the form templates", () => {
		const field = { name: "feld", label: "Feld", error: "Pflichtfeld" };
		const cases: Array<{ name: string; build: () => { html: string } }> = [
			{ name: "input text", build: () => buildInputText(field, "de") },
			{ name: "input email", build: () => buildInputEmail(field, "de") },
			{ name: "input tel", build: () => buildInputTel(field, "de") },
			{ name: "input url", build: () => buildInputUrl(field, "de") },
			{ name: "input number", build: () => buildInputNumber(field, "de") },
			{ name: "input date", build: () => buildInputDate(field, "de") },
			{
				name: "input password",
				build: () => buildInputPassword(field, "de"),
			},
			{ name: "input file", build: () => buildInputFile(field, "de") },
			{ name: "textarea", build: () => buildTextarea(field, "de") },
			{
				name: "select",
				build: () =>
					buildSelect({ ...field, options: [{ value: "a", text: "A" }] }, "de"),
			},
			{
				name: "radio list",
				build: () =>
					buildRadio(
						{
							mode: "list",
							name: "feld",
							legend: "Feld",
							items: [{ value: "a", label: "A" }],
							error: "Pflichtfeld",
						},
						"de",
					),
			},
			{
				name: "single checkbox",
				build: () =>
					buildCheckbox(
						{ name: "feld", label: "Feld", error: { message: "Pflichtfeld" } },
						"de",
					),
			},
			{
				name: "checkbox list",
				build: () =>
					buildCheckbox(
						{
							mode: "list",
							legend: "Feld",
							groupName: "feld",
							items: [{ label: "A" }],
							error: { message: "Pflichtfeld" },
						},
						"de",
					),
			},
		];

		it.each(cases)("$name wires its error message", ({ build }) => {
			const { html } = build();

			expect(html).toContain('class="kern-error"');
			expect(ruleIdsOf(html).filter((id) => id.startsWith("form."))).toEqual(
				[],
			);
		});

		it.each(cases)(
			"$name is reported once the aria-describedby reference is missing",
			({ build }) => {
				const html = build().html.replace(/ aria-describedby="[^"]*"/g, "");

				expect(ruleIdsOf(html)).toContain("form.error_describedby");
			},
		);
	});
});

describe("class.unknown", () => {
	const unknownClassIssues = (html: string) =>
		validateHtmlStrict(html).issues.filter(
			(entry) => entry.ruleId === "class.unknown",
		);

	it("warns once about every kern-* class KERN doesn't know, without failing", () => {
		const html =
			'<div class="kern-bg-subtle kern-flex"><p class="kern-tabs kern-body">x</p><span class="kern-bg-subtle"></span></div>';

		expect(validateHtmlStrict(html).ok).toBe(true);
		expect(unknownClassIssues(html)).toEqual([
			{
				ruleId: "class.unknown",
				severity: "warning",
				message: {
					en: "KERN doesn't define these classes: kern-bg-subtle, kern-tabs. Check the spelling; get_utility_reference lists the utility classes.",
					de: "Diese Klassen gibt es in KERN nicht: kern-bg-subtle, kern-tabs. Schreibweise prüfen; get_utility_reference listet die Hilfsklassen.",
				},
				selectorHint: ".kern-bg-subtle",
			},
		]);
	});

	it("leaves known classes, KERN's example-only classes and other prefixes alone", () => {
		expect(
			unknownClassIssues(
				'<div class="kern-accordion-group my-app kern"><button class="kern-btn kern-btn--primary kern-flex-row-md">x</button></div>',
			),
		).toEqual([]);
	});

	it("names eight classes and counts the rest", () => {
		const classes = Array.from({ length: 10 }, (_, i) => `kern-nope-${i}`);
		const [warning] = unknownClassIssues(
			`<div class="${classes.join(" ")}"></div>`,
		);

		expect(warning?.message.en).toContain(
			"kern-nope-0, kern-nope-1, kern-nope-2, kern-nope-3, kern-nope-4, kern-nope-5, kern-nope-6, kern-nope-7 (+2).",
		);
	});
});

describe("kern-grid layout warnings", () => {
	const layoutIssues = (html: string) =>
		validateHtmlStrict(html)
			.issues.filter((entry) => entry.ruleId.startsWith("layout."))
			.map((entry) => entry.ruleId);

	it("warns once about a kern-grid directly inside a container, without failing", () => {
		const html =
			'<main class="kern-container"><h1>x</h1><div class="kern-grid kern-grid-cols-1"></div></main><div class="kern-container-fluid"><div class="kern-grid kern-grid-cols-1"></div></div>';

		expect(validateHtmlStrict(html).ok).toBe(true);
		expect(layoutIssues(html)).toEqual(["layout.grid_in_container"]);
	});

	it("warns about columns set only from a breakpoint up", () => {
		expect(
			layoutIssues(
				'<div class="kern-grid kern-grid-cols-3-md kern-gap-md"></div>',
			),
		).toEqual(["layout.grid_columns_small"]);
	});

	it.each([
		[
			"a grid in its own div",
			'<div class="kern-container"><div><div class="kern-grid kern-grid-cols-1 kern-grid-cols-3-md"></div></div></div>',
		],
		[
			"a grid without column counts",
			'<div class="kern-grid"><div class="kern-col-4"></div></div>',
		],
		[
			"a count for small screens",
			'<div class="kern-grid kern-grid-cols-2 kern-grid-cols-4-lg"></div>',
		],
		[
			"the container grid",
			'<div class="kern-container"><div class="kern-row"></div></div>',
		],
	])("leaves %s alone", (_, html) => {
		expect(layoutIssues(html)).toEqual([]);
	});
});

describe("validateHtmlStrict: field labels", () => {
	it.each([
		["a label for its id", '<label for="plz">PLZ</label><input id="plz">'],
		["a label around it", "<label>PLZ <input></label>"],
		["aria-label", '<input aria-label="Suche">'],
		["aria-labelledby", '<span id="t">PLZ</span><input aria-labelledby="t">'],
		["a hidden input", '<input type="hidden" name="token">'],
		["a submit input", '<input type="submit" value="Senden">'],
		[
			"a select in a label with text of its own",
			"<label>Land <select><option>DE</option></select></label>",
		],
	])("accepts a field with %s", (_, html) => {
		expect(ruleIdsOf(html)).not.toContain("form.field_label");
	});

	it.each([
		["an input with only a placeholder", '<input id="plz" placeholder="PLZ">'],
		["an empty label", '<label for="plz"> </label><input id="plz">'],
		[
			"a select with no label",
			'<select name="land"><option>DE</option></select>',
		],
		[
			"a select whose label holds only its options",
			"<label><select><option>DE</option></select></label>",
		],
		["a textarea with no label", "<textarea></textarea>"],
	])("errors on %s", (_, html) => {
		const res = validateHtmlStrict(html);

		expect(res.ok).toBe(false);
		expect(res.issues.map((i) => i.ruleId)).toEqual(["form.field_label"]);
	});

	it("names the field by id, else by name", () => {
		const hints = validateHtmlStrict(
			'<input id="plz"><select name="land"></select><textarea></textarea>',
		).issues.map((i) => i.selectorHint);

		expect(hints).toEqual(["#plz", 'select[name="land"]', "textarea"]);
	});
});

describe("validateHtmlStrict: table headers", () => {
	it("errors on a table without header cells", () => {
		const res = validateHtmlStrict(
			"<table><caption>Gebühren</caption><tr><td>Leistung</td><td>Gebühr</td></tr></table>",
		);

		expect(res.ok).toBe(false);
		expect(res.issues.map((i) => i.ruleId)).toEqual(["table.headers"]);
	});

	it.each(["presentation", "none"])(
		"accepts a layout table with role=%s",
		(role) => {
			expect(
				ruleIdsOf(
					`<table role="${role}"><caption>x</caption><tr><td>x</td></tr></table>`,
				),
			).not.toContain("table.headers");
		},
	);

	it("accepts a table with a header row", () => {
		expect(
			ruleIdsOf(
				'<table><caption>Gebühren</caption><tr><th scope="col">Leistung</th></tr><tr><td>Pass</td></tr></table>',
			),
		).toEqual([]);
	});
});

describe("validateHtmlStrict: heading levels", () => {
	it("warns when a heading skips a level, without failing", () => {
		const res = validateHtmlStrict("<h1>Amt</h1><h3>Öffnungszeiten</h3>");

		expect(res.ok).toBe(true);
		expect(res.issues).toEqual([
			expect.objectContaining({
				ruleId: "heading.level_skip",
				severity: "warning",
				selectorHint: "h3",
				message: expect.objectContaining({
					en: expect.stringContaining("from h1 to h3. Use h2"),
				}),
			}),
		]);
	});

	it("lets the first heading have any level and go back up any number", () => {
		expect(
			ruleIdsOf("<h2>Teil</h2><h3>a</h3><h4>b</h4><h2>Nächster</h2><h3>c</h3>"),
		).toEqual([]);
	});

	it("reports each skip, in document order", () => {
		const hints = validateHtmlStrict(
			"<h1>a</h1><section><h3>b</h3></section><h2>c</h2><h4>d</h4>",
		).issues.map((i) => i.selectorHint);

		expect(hints).toEqual(["h3", "h4"]);
	});
});
