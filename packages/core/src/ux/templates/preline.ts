import {
	type PrelineRenderInput,
	prelineRenderSchema,
} from "../schemas/preline.js";
import type { BuildResult } from "../types.js";
import { escapeHtml } from "./escape.js";

export function buildPreline(input: PrelineRenderInput): BuildResult {
	const params = prelineRenderSchema.parse(input);
	return {
		html: `<p class="kern-preline">${escapeHtml(params.text)}</p>`,
		warnings: [],
	};
}
