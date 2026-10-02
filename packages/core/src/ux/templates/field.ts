import { type FieldInput, FieldSchema } from "../schemas/field.js";
import type { BuildResult, Locale } from "../types.js";
import { buildCheckbox } from "./checkbox.js";
import { buildInputText } from "./input-text.js";
import { buildRadio } from "./radio.js";
import { buildSelect } from "./select.js";
import { buildTextarea } from "./textarea.js";

/**
 * Build one form field from the flat `field` block, through the same templates
 * as the dedicated field tools.
 */
export function buildField(input: FieldInput, locale: Locale): BuildResult {
	const field = FieldSchema.parse(input);
	const { type, id, name, label, hint, error, optional } = field;
	const options = field.options ?? [];
	const ignored = ignoredProperties(field);

	const result = (() => {
		switch (type) {
			case "textarea":
				return buildTextarea(
					{
						name,
						label,
						hint,
						error,
						optional,
						value: field.value,
						placeholder: field.placeholder,
						rows: field.rows,
					},
					locale,
					{ id },
				);
			case "select":
				return buildSelect(
					{
						name,
						label,
						hint,
						error,
						optional,
						options: options.map((option) => ({
							value: option.value,
							text: option.label,
							selected: option.selected,
							disabled: option.disabled,
						})),
					},
					locale,
					{ id },
				);
			case "radio":
				return buildRadio(
					{
						mode: "list",
						name,
						legend: label,
						hint,
						error,
						optional,
						items: options.map((option, index) => ({
							id: index === 0 ? id : undefined,
							value: option.value,
							label: option.label,
							checked: option.selected,
							disabled: option.disabled,
						})),
					},
					locale,
				);
			case "checkbox":
				if (options.length === 0) {
					return buildCheckbox(
						{
							mode: "single",
							id,
							name,
							label,
							error: error === undefined ? undefined : { message: error },
						},
						locale,
					);
				}
				return buildCheckbox(
					{
						mode: "list",
						legend: label,
						groupName: name,
						optional,
						hint: hint === undefined ? undefined : { text: hint },
						error: error === undefined ? undefined : { message: error },
						items: options.map((option, index) => ({
							id: index === 0 ? id : undefined,
							value: option.value,
							label: option.label,
							checked: option.selected,
							disabled: option.disabled,
						})),
					},
					locale,
				);
			default:
				return buildInputText(
					{
						type,
						name,
						label,
						hint,
						error,
						optional,
						value: field.value,
						placeholder: field.placeholder,
						autocomplete: field.autocomplete,
					},
					locale,
					{ id },
				);
		}
	})();

	return {
		html: result.html,
		warnings: [
			...result.warnings,
			...ignored.map(
				(property) =>
					`Field "${name}": ${property} is ignored for a ${describeType(field)}.`,
			),
		],
	};
}

/** Properties the field's type has no place for. */
function ignoredProperties(field: FieldInput): string[] {
	const { type } = field;
	const choice = type === "select" || type === "radio" || type === "checkbox";
	const singleCheckbox = type === "checkbox" && !field.options;

	return [
		!choice && field.options && "options",
		choice && field.value !== undefined && "value",
		(choice || type === "date") &&
			field.placeholder !== undefined &&
			"placeholder",
		(choice || type === "textarea") &&
			field.autocomplete !== undefined &&
			"autocomplete",
		type !== "textarea" && field.rows !== undefined && "rows",
		singleCheckbox && field.hint !== undefined && "hint",
		singleCheckbox && field.optional !== undefined && "optional",
	].filter((property): property is string => typeof property === "string");
}

function describeType(field: FieldInput): string {
	if (field.type === "checkbox") {
		return field.options ? "checkbox group" : "single checkbox";
	}
	return `${field.type} field`;
}
