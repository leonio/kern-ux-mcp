import { type LabelRenderInput, labelRenderSchema } from "../schemas/label.js";
import type { BuildResult } from "../types.js";

export function buildLabel(input: LabelRenderInput): BuildResult {
	const params = labelRenderSchema.parse(input);
	return {
		html: `<label class="kern-label">${params.text}</label>`,
		warnings: [],
	};
}
