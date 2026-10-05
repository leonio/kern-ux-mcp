import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

import { validateHtmlStrict } from "./validate.js";
import { VALIDATION_RULES, type ValidationRuleId } from "./validation-rules.js";

/** Markup that breaks each rule. */
const BREAKS: Record<ValidationRuleId, string> = {
	"alert.role": '<div class="kern-alert"></div>',
	"loader.role":
		'<div class="kern-loader kern-loader--visible"><span class="kern-sr-only">Lädt</span></div>',
	"loader.sr_text":
		'<div class="kern-loader kern-loader--visible" role="status"></div>',
	"dialog.aria_labelledby": '<dialog class="kern-dialog"></dialog>',
	"dialog.aria_labelledby_target":
		'<dialog class="kern-dialog" aria-labelledby="nope"></dialog>',
	"icon.aria": '<span class="kern-icon kern-icon--add"></span>',
	"button.icon_only_sr_label":
		'<button class="kern-btn"><span class="kern-icon kern-icon--add" aria-hidden="true"></span></button>',
	"form.label_for": '<label for="nope">Name</label>',
	"form.field_label": '<input id="plz" placeholder="PLZ">',
	"form.error_id": '<input id="plz"><p class="kern-error">Fehlt</p>',
	"form.error_describedby":
		'<input id="plz"><p class="kern-error" id="fehler">Fehlt</p>',
	"table.caption": "<table><tr><td>x</td></tr></table>",
	"table.th_scope":
		"<table><caption>Gebühren</caption><tr><th>Leistung</th></tr></table>",
	"table.headers":
		"<table><caption>Gebühren</caption><tr><td>Leistung</td></tr></table>",
	"heading.level_skip": "<h1>Amt</h1><h3>Öffnungszeiten</h3>",
	"img.alt": '<img src="wappen.png">',
	"layout.grid_in_container":
		'<div class="kern-container"><div class="kern-grid kern-grid-cols-1"></div></div>',
	"layout.grid_columns_small":
		'<div class="kern-grid kern-grid-cols-3-md"></div>',
	"class.unknown": '<div class="kern-nope"></div>',
};

describe("VALIDATION_RULES", () => {
	it("has one entry per rule ID", () => {
		const ids = VALIDATION_RULES.map((rule) => rule.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(VALIDATION_RULES)(
		"$id is what validate.ts reports, with the table's severity",
		(rule) => {
			const issues = validateHtmlStrict(BREAKS[rule.id]).issues.filter(
				(issue) => issue.ruleId === rule.id,
			);

			expect(issues.length).toBeGreaterThan(0);
			for (const issue of issues) {
				expect(issue.severity).toBe(rule.severity);
			}
		},
	);

	it.each(VALIDATION_RULES.filter((rule) => "appliesTo" in rule))(
		"$id applies to the markup it checks",
		(rule) => {
			const appliesTo = "appliesTo" in rule ? rule.appliesTo : "";
			expect(parse(BREAKS[rule.id]).querySelector(appliesTo)).not.toBeNull();
		},
	);
});
