import {
	type FieldsetRenderInput,
	FieldsetRenderSchema,
} from "../schemas/fieldset.js";
import type { BuildResult } from "../types.js";

export function buildFieldset(input: FieldsetRenderInput): BuildResult {
	const params = FieldsetRenderSchema.parse(input);
	const warnings: string[] = [];

	const bodyClass = params.horizontal
		? "kern-fieldset__body kern-fieldset__body--horizontal"
		: "kern-fieldset__body";

	const hintHtml = params.includeHint
		? `\n  <div class="kern-fieldset__hint">${params.hintText ?? "Hinweis"}</div>`
		: "";

	return {
		html: `<fieldset class="kern-fieldset">\n  <legend class="kern-label">${params.legend}</legend>${hintHtml}\n  <div class="${bodyClass}">\n    <div class="kern-form-input">\n      <label class="kern-label" for="vorname">Vorname</label>\n      <input class="kern-form-input__input" id="vorname" name="vorname" type="text">\n    </div>\n    <div class="kern-form-input">\n      <label class="kern-label" for="name">Name</label>\n      <input class="kern-form-input__input" id="name" name="name" type="text">\n    </div>\n  </div>\n</fieldset>`,
		warnings,
	};
}
