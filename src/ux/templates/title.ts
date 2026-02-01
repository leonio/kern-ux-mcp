import { type TitleRenderInput, titleRenderSchema } from "../schemas/title.js";
import type { BuildResult } from "../types.js";

export function buildTitle(input: TitleRenderInput): BuildResult {
	const params = titleRenderSchema.parse(input);
	const warnings: string[] = [];

	const classes = ["kern-title"];
	if (params.size === "small") {
		classes.push("kern-title--small");
	}
	if (params.size === "large") {
		classes.push("kern-title--large");
	}

	return {
		html: `<h2 class="${classes.join(" ")}">${params.text}</h2>`,
		warnings,
	};
}
