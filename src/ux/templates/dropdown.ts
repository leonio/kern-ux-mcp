import {
	type DropdownInput,
	type DropdownOptionInput,
	dropdownSchema,
} from "../schemas/dropdown.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Build HTML for a KERN UX Dropdown component
 * Note: This component is EXPERIMENTAL
 */
export function buildDropdown(
	input: DropdownInput,
	_locale: Locale,
): BuildResult {
	const warnings: string[] = [];

	// Add warning about experimental status
	warnings.push("Dropdown is an experimental component and may change.");

	// Parse input to apply defaults
	const params = dropdownSchema.parse(input);

	const { triggerLabel, name, options, inputType, open } = params;

	const openAttr = open ? " open" : "";

	// Build options list
	const optionsHtml = options
		.map((option: DropdownOptionInput) => {
			const checkedAttr = option.checked ? " checked" : "";
			const disabledAttr = option.disabled ? " disabled" : "";

			return `      <li>
        <label>
          <input name="${escapeHtml(name)}" type="${inputType}" value="${escapeHtml(option.value)}"${checkedAttr}${disabledAttr}>
          ${escapeHtml(option.label)}
        </label>
      </li>`;
		})
		.join("\n");

	const html = `<!-- WARNING: Experimental Component -->
<div class="kern-dropdown">
  <details${openAttr}>
    <summary>${escapeHtml(triggerLabel)}</summary>
    <ul>
${optionsHtml}
    </ul>
  </details>
</div>`;

	return { html, warnings };
}
