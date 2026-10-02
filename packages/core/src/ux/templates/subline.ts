import {
	type SublineRenderInput,
	sublineRenderSchema,
} from "../schemas/subline.js";
import type { BuildResult } from "../types.js";
import { escapeHtml } from "./escape.js";

export function buildSubline(input: SublineRenderInput): BuildResult {
	const params = sublineRenderSchema.parse(input);
	return {
		html: `<p class="kern-subline">${escapeHtml(params.text)}</p>`,
		warnings: [],
	};
}
