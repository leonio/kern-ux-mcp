import { type LabelRenderInput, labelRenderSchema } from "../schemas/label.js";
import type { BuildResult } from "../types.js";
import { escapeHtml } from "./escape.js";

export function buildLabel(input: LabelRenderInput): BuildResult {
	const params = labelRenderSchema.parse(input);
	return {
		html: `<label class="kern-label">${escapeHtml(params.text)}</label>`,
		warnings: [],
	};
}
