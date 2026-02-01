import {
	type DividerRenderInput,
	dividerRenderSchema,
} from "../schemas/divider.js";
import type { BuildResult } from "../types.js";

export function buildDivider(input: DividerRenderInput): BuildResult {
	const params = dividerRenderSchema.parse(input);
	const warnings: string[] = [];

	const aria = params.decorative ? ' aria-hidden="true"' : "";
	return {
		html: `<hr class="kern-divider"${aria} />`,
		warnings,
	};
}
