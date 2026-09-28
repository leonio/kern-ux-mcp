import {
	type DescriptionListRenderInput,
	descriptionListRenderSchema,
} from "../schemas/description-list.js";
import type { BuildResult } from "../types.js";

export function buildDescriptionList(
	input: DescriptionListRenderInput,
): BuildResult {
	const params = descriptionListRenderSchema.parse(input);
	const warnings: string[] = [];

	const listClass = params.stacked
		? "kern-description-list kern-description-list--col"
		: "kern-description-list";

	const items = params.items
		.map(
			(item) =>
				`  <div class="kern-description-list-item">\n    <dt class="kern-description-list-item__key">${item.key}</dt>\n    <dd class="kern-description-list-item__value">${item.value}</dd>\n  </div>`,
		)
		.join("\n");

	return {
		html: `<dl class="${listClass}">\n${items}\n</dl>`,
		warnings,
	};
}
