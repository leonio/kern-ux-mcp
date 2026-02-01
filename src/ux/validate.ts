import { parse } from "node-html-parser";
import type { Locale, ValidationIssue } from "./types.js";

export type ValidationResult = {
	ok: boolean;
	issues: ValidationIssue[];
};

type HtmlNodeLike = {
	getAttribute?(name: string): string | undefined;
	text?: string | null;
};

function issue(
	ruleId: string,
	severity: "error" | "warning",
	message: { en: string; de: string },
	selectorHint?: string,
): ValidationIssue {
	return { ruleId, severity, message, selectorHint };
}

function _hasClass(node: HtmlNodeLike, className: string) {
	const cls = node.getAttribute?.("class") ?? "";
	return cls.split(/\s+/).includes(className);
}

export function validateHtmlStrict(html: string): ValidationResult {
	const root = parse(html, {
		comment: true,
		lowerCaseTagName: false,
		blockTextElements: {
			script: true,
			style: true,
			pre: true,
		},
	});

	const issues: ValidationIssue[] = [];

	// Alert must have role=alert
	for (const el of root.querySelectorAll?.(".kern-alert") ?? []) {
		const role = el.getAttribute("role");
		if (role !== "alert") {
			issues.push(
				issue(
					"alert.role",
					"error",
					{
						en: 'Alerts must include role="alert".',
						de: 'Alerts müssen role="alert" enthalten.',
					},
					".kern-alert",
				),
			);
		}
	}

	// Loader visible must have role=status and sr-only text
	for (const el of root.querySelectorAll?.(
		".kern-loader.kern-loader--visible",
	) ?? []) {
		const role = el.getAttribute("role");
		if (role !== "status") {
			issues.push(
				issue(
					"loader.role",
					"error",
					{
						en: 'Visible loaders must have role="status".',
						de: 'Sichtbare Loader müssen role="status" haben.',
					},
					".kern-loader.kern-loader--visible",
				),
			);
		}
		const sr = el.querySelector?.(".kern-sr-only");
		const text = sr?.text?.trim() ?? "";
		if (!sr || !text) {
			issues.push(
				issue(
					"loader.sr_text",
					"error",
					{
						en: "Visible loaders must include a non-empty .kern-sr-only label.",
						de: "Sichtbare Loader müssen einen nicht-leeren .kern-sr-only Text enthalten.",
					},
					".kern-loader .kern-sr-only",
				),
			);
		}
	}

	// Dialog aria-labelledby must point to existing element
	for (const dlg of root.querySelectorAll?.("dialog.kern-dialog") ?? []) {
		const labelledBy = dlg.getAttribute("aria-labelledby");
		if (!labelledBy) {
			issues.push(
				issue(
					"dialog.aria_labelledby",
					"error",
					{
						en: "Dialogs must include aria-labelledby pointing to the dialog heading.",
						de: "Dialoge müssen aria-labelledby enthalten, das auf die Überschrift verweist.",
					},
					"dialog.kern-dialog",
				),
			);
			continue;
		}
		// Avoid CSS.escape (not always available in Node). Attribute selector is sufficient here.
		const target = root.querySelector?.(
			`[id="${labelledBy.replace(/"/g, '\\"')}"]`,
		);
		if (!target) {
			issues.push(
				issue(
					"dialog.aria_labelledby_target",
					"error",
					{
						en: `aria-labelledby references missing id: ${labelledBy}.`,
						de: `aria-labelledby verweist auf eine fehlende ID: ${labelledBy}.`,
					},
					`#${labelledBy}`,
				),
			);
		}
	}

	// Icons must be decorative or labelled
	for (const icon of root.querySelectorAll?.(".kern-icon") ?? []) {
		const ariaHidden = icon.getAttribute("aria-hidden");
		const ariaLabel = icon.getAttribute("aria-label");

		if (ariaHidden === "true") {
			continue;
		}

		// if not aria-hidden=true, require an aria-label (semantic icon)
		if (!ariaLabel) {
			issues.push(
				issue(
					"icon.aria",
					"error",
					{
						en: 'Icons must be aria-hidden="true" (decorative) or have aria-label (semantic).',
						de: 'Icons müssen aria-hidden="true" (dekorativ) sein oder ein aria-label (semantisch) haben.',
					},
					".kern-icon",
				),
			);
		}
	}

	// Icon-only buttons must have screenreader text
	for (const btn of root.querySelectorAll?.("button.kern-btn, a.kern-btn") ??
		[]) {
		const hasIcon = (btn.querySelectorAll?.(".kern-icon") ?? []).length > 0;
		const labels = btn.querySelectorAll?.(".kern-label") ?? [];

		if (!hasIcon) continue;

		const hasVisibleLabel = labels.some((l: HtmlNodeLike) => {
			const classes = (l.getAttribute?.("class") ?? "").split(/\s+/);
			const isSrOnly =
				classes.includes("kern-sr-only") ||
				classes.includes("kern-sr-only-mobile");
			const text = l.text?.trim() ?? "";
			return !!text && !isSrOnly;
		});

		if (hasVisibleLabel) continue;

		const ariaLabel = btn.getAttribute?.("aria-label") ?? "";
		if (ariaLabel.trim()) continue;

		const hasSrLabel = labels.some((l: HtmlNodeLike) => {
			const classes = (l.getAttribute?.("class") ?? "").split(/\s+/);
			const isSrOnly =
				classes.includes("kern-sr-only") ||
				classes.includes("kern-sr-only-mobile");
			const text = l.text?.trim() ?? "";
			return isSrOnly && !!text;
		});

		const hasSrOnlyText = (() => {
			const sr = btn.querySelector?.(".kern-sr-only, .kern-sr-only-mobile");
			const text = sr?.text?.trim() ?? "";
			return !!text;
		})();

		if (!hasSrLabel && !hasSrOnlyText) {
			issues.push(
				issue(
					"button.icon_only_sr_label",
					"error",
					{
						en: "Icon-only buttons must include a non-empty sr-only label.",
						de: "Icon-only Buttons müssen einen nicht-leeren sr-only Text enthalten.",
					},
					".kern-btn",
				),
			);
		}
	}

	// Form: <label for="X"> must match an <input id="X"> (or select/textarea)
	for (const label of root.querySelectorAll?.("label") ?? []) {
		const forAttr = label.getAttribute("for");
		if (!forAttr) continue;
		const target = root.querySelector?.(
			`[id="${forAttr.replace(/"/g, '\\"')}"]`,
		);
		if (!target) {
			issues.push(
				issue(
					"form.label_for",
					"error",
					{
						en: `<label for="${forAttr}"> references a missing id. Ensure the input has id="${forAttr}".`,
						de: `<label for="${forAttr}"> verweist auf eine fehlende ID. Das Eingabefeld muss id="${forAttr}" haben.`,
					},
					`label[for="${forAttr}"]`,
				),
			);
		}
	}

	// Form: input with error element should have aria-describedby
	for (const errorEl of root.querySelectorAll?.(
		".kern-input__error, .kern-select__error, .kern-textarea__error, .kern-fieldset__error",
	) ?? []) {
		const errorId = errorEl.getAttribute("id");
		if (!errorId) {
			issues.push(
				issue(
					"form.error_id",
					"warning",
					{
						en: "Error messages should have an id so inputs can reference them via aria-describedby.",
						de: "Fehlermeldungen sollten eine ID haben, damit Eingabefelder über aria-describedby darauf verweisen können.",
					},
					".kern-input__error",
				),
			);
			continue;
		}
		// Check if any input references this error via aria-describedby
		const describedByRef = root.querySelector?.(
			`[aria-describedby~="${errorId.replace(/"/g, '\\"')}"]`,
		);
		if (!describedByRef) {
			issues.push(
				issue(
					"form.error_describedby",
					"warning",
					{
						en: `Error element #${errorId} exists but no input references it via aria-describedby.`,
						de: `Fehlerelement #${errorId} existiert, aber kein Eingabefeld verweist darauf via aria-describedby.`,
					},
					`#${errorId}`,
				),
			);
		}
	}

	// Table: should have <caption>
	for (const table of root.querySelectorAll?.("table") ?? []) {
		const caption = table.querySelector?.("caption");
		if (!caption?.text?.trim()) {
			issues.push(
				issue(
					"table.caption",
					"warning",
					{
						en: "Tables should include a <caption> element describing the table content.",
						de: "Tabellen sollten ein <caption>-Element enthalten, das den Tabelleninhalt beschreibt.",
					},
					"table",
				),
			);
		}
	}

	// Table: <th> should have scope attribute
	for (const th of root.querySelectorAll?.("th") ?? []) {
		const scope = th.getAttribute("scope");
		if (!scope) {
			issues.push(
				issue(
					"table.th_scope",
					"warning",
					{
						en: '<th> elements should have a scope attribute (scope="col" or scope="row").',
						de: '<th>-Elemente sollten ein scope-Attribut haben (scope="col" oder scope="row").',
					},
					"th",
				),
			);
			break; // One warning per table fragment is enough
		}
	}

	// Images must have alt attribute
	for (const img of root.querySelectorAll?.("img") ?? []) {
		const alt = img.getAttribute("alt");
		if (alt === null || alt === undefined) {
			issues.push(
				issue(
					"img.alt",
					"error",
					{
						en: '<img> elements must have an alt attribute (use alt="" for decorative images).',
						de: '<img>-Elemente müssen ein alt-Attribut haben (alt="" für dekorative Bilder).',
					},
					"img",
				),
			);
		}
	}

	const ok = !issues.some((i) => i.severity === "error");
	return { ok, issues };
}

export function localizeIssues(issues: ValidationIssue[], _locale: Locale) {
	return issues.map((i) => ({
		...i,
		message: {
			en: i.message.en,
			de: i.message.de,
		},
		// locale selection is done by caller; keep both strings in the payload.
	}));
}
