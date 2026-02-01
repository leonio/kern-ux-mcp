import {
	type HeadingRenderInput,
	headingRenderSchema,
} from "../schemas/heading.js";
import type { BuildResult } from "../types.js";

export function buildHeading(input: HeadingRenderInput): BuildResult {
	const params = headingRenderSchema.parse(input);
	const warnings: string[] = [];

	return {
		html: `<h${params.level} class="kern-heading-medium">${params.text}</h${params.level}>`,
		warnings,
	};
}
