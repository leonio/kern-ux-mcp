import {
	type SublineRenderInput,
	sublineRenderSchema,
} from "../schemas/subline.js";
import type { BuildResult } from "../types.js";

export function buildSubline(input: SublineRenderInput): BuildResult {
	const params = sublineRenderSchema.parse(input);
	return { html: `<p class="kern-subline">${params.text}</p>`, warnings: [] };
}
