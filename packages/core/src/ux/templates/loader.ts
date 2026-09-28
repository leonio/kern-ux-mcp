import { LABELS } from "../i18n.js";
import type { LoaderInput } from "../schemas/loader.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build a Loader component
 */
export function buildLoader(params: LoaderInput, locale: Locale): BuildResult {
	const warnings: string[] = [];

	const visible = params.visible ?? true;
	const srText = params.srText ?? LABELS.loading[locale];

	const classes = ["kern-loader"];
	if (visible) {
		classes.push("kern-loader--visible");
	}

	const html = `<div class="${classes.join(" ")}" role="status">
  <span class="kern-sr-only">${srText}</span>
</div>`;

	return { html, warnings };
}
