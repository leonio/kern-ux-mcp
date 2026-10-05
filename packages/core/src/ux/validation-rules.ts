/**
 * The rules validate_html checks, one entry each. validate.ts reports issues
 * under these IDs with the severity given here; the component cards list the
 * rules that concern a component, and the accessibility guide lists them all.
 */
export type ValidationRule = {
	id: string;
	severity: "error" | "warning";
	/**
	 * The markup the rule concerns: a component whose rendered example contains
	 * it is subject to the rule. Absent for rules that concern any markup.
	 */
	appliesTo?: string;
	/** What the rule asks for, in English. */
	requirement: string;
};

export const VALIDATION_RULES = [
	{
		id: "alert.role",
		severity: "error",
		appliesTo: ".kern-alert",
		requirement: 'An alert has role="alert".',
	},
	{
		id: "loader.role",
		severity: "error",
		appliesTo: ".kern-loader",
		requirement: 'A visible loader has role="status".',
	},
	{
		id: "loader.sr_text",
		severity: "error",
		appliesTo: ".kern-loader",
		requirement: "A visible loader has a non-empty .kern-sr-only label.",
	},
	{
		id: "dialog.aria_labelledby",
		severity: "error",
		appliesTo: "dialog.kern-dialog",
		requirement: "A dialog has aria-labelledby, pointing to its heading.",
	},
	{
		id: "dialog.aria_labelledby_target",
		severity: "error",
		appliesTo: "dialog.kern-dialog",
		requirement: "The id in a dialog's aria-labelledby exists.",
	},
	{
		id: "icon.aria",
		severity: "error",
		appliesTo: ".kern-icon",
		requirement:
			'An icon is decorative (aria-hidden="true") or has an aria-label.',
	},
	{
		id: "button.icon_only_sr_label",
		severity: "error",
		appliesTo: ".kern-btn",
		requirement:
			"A button with only an icon has a non-empty sr-only label (.kern-label.kern-sr-only).",
	},
	{
		id: "form.label_for",
		severity: "error",
		appliesTo: "label[for]",
		requirement: "A label's for attribute names the id of an existing field.",
	},
	{
		id: "form.error_id",
		severity: "warning",
		appliesTo: "input, select, textarea",
		requirement: "An error message (.kern-error) has an id.",
	},
	{
		id: "form.error_describedby",
		severity: "warning",
		appliesTo: "input, select, textarea",
		requirement:
			"A field with an error message references it through aria-describedby.",
	},
	{
		id: "table.caption",
		severity: "warning",
		appliesTo: "table",
		requirement: "A table has a caption.",
	},
	{
		id: "table.th_scope",
		severity: "warning",
		appliesTo: "table",
		requirement: 'A header cell has scope="col" or scope="row".',
	},
	{
		id: "img.alt",
		severity: "error",
		appliesTo: "img",
		requirement: 'An image has an alt attribute: alt="" when it is decorative.',
	},
	{
		id: "layout.grid_in_container",
		severity: "warning",
		appliesTo: ".kern-grid",
		requirement:
			"A kern-grid sits in a div of its own, not directly in kern-container, which would lose its padding.",
	},
	{
		id: "layout.grid_columns_small",
		severity: "warning",
		appliesTo: ".kern-grid",
		requirement:
			"A kern-grid that sets its columns from a breakpoint up also sets them for small screens (kern-grid-cols-1).",
	},
	{
		id: "class.unknown",
		severity: "warning",
		requirement: "Every kern-* class is one KERN defines.",
	},
] as const satisfies readonly ValidationRule[];

export type ValidationRuleId = (typeof VALIDATION_RULES)[number]["id"];

const SEVERITY = new Map<string, ValidationRule["severity"]>(
	VALIDATION_RULES.map((rule) => [rule.id, rule.severity]),
);

export function ruleSeverity(id: ValidationRuleId): ValidationRule["severity"] {
	return SEVERITY.get(id) ?? "error";
}
