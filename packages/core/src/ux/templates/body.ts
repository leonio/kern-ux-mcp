import { type BodyRenderInput, bodyRenderSchema } from "../schemas/body.js";
import type { BuildResult } from "../types.js";
import { escapeHtml } from "./escape.js";

export function buildBody(input: BodyRenderInput): BuildResult {
	const params = bodyRenderSchema.parse(input);
	const warnings: string[] = [];

	const classes = ["kern-body"];
	if (params.size === "small") {
		classes.push("kern-body--small");
	}
	if (params.size === "large") {
		classes.push("kern-body--large");
	}
	if (params.bold) {
		classes.push("kern-body--bold");
	}

	return {
		html: `<p class="${classes.join(" ")}">${escapeHtml(params.text)}</p>`,
		warnings,
	};
}
