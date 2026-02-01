import {
	type KopfzeileRenderInput,
	kopfzeileRenderSchema,
} from "../schemas/kopfzeile.js";
import type { BuildResult } from "../types.js";

export function buildKopfzeile(input: KopfzeileRenderInput): BuildResult {
	const params = kopfzeileRenderSchema.parse(input);
	const warnings: string[] = [];

	const navHtml = params.includeNav
		? `\n  <nav class="kern-kopfzeile__nav" aria-label="Hauptnavigation">\n    <a class="kern-link" href="#">Start</a>\n  </nav>`
		: "";

	return {
		html: `<header class="kern-kopfzeile">\n  <p class="kern-title">${params.title}</p>${navHtml}\n</header>`,
		warnings,
	};
}
