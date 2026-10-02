import { type CardInput, cardRenderSchema } from "../schemas/card.js";
import type { BuildResult, Locale } from "../types.js";
import {
	type BlockContext,
	renderChildBlocks,
	standaloneContext,
} from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";

/**
 * Build HTML for a KERN UX Card component
 */
export function buildCard(
	input: CardInput,
	locale: Locale,
	context: BlockContext = standaloneContext(locale),
): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = cardRenderSchema.parse(input);

	const { size, hug, media, header, body, bodyIsHtml, contentBlocks, footer } =
		params;

	// Build card classes
	const cardClasses = ["kern-card"];
	if (size === "small") {
		cardClasses.push("kern-card--small");
	} else if (size === "large") {
		cardClasses.push("kern-card--large");
	}
	if (hug) {
		cardClasses.push("kern-card--hug");
	}
	if (header?.href) {
		cardClasses.push("kern-card--interactive");
	}

	// Build media section
	let mediaHtml = "";
	if (media) {
		mediaHtml = `
  <div class="kern-card__media">
    <img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}">
  </div>`;
	}

	// Build header section
	let headerHtml = "";
	if (header) {
		const prelineHtml = header.preline
			? `\n        <p class="kern-preline">${escapeHtml(header.preline)}</p>`
			: "";
		const sublineHtml = header.subline
			? `\n        <p class="kern-subline">${escapeHtml(header.subline)}</p>`
			: "";

		// Title - either plain or as stretched link
		const titleLevel = header.titleLevel ?? 2;
		let titleContent: string;
		if (header.href) {
			titleContent = `<a href="${escapeHtml(header.href)}" class="kern-link--stretched">${escapeHtml(header.title)}</a>`;
		} else {
			titleContent = escapeHtml(header.title);
		}

		headerHtml = `
    <header class="kern-card__header">
      <hgroup>${prelineHtml}
        <h${titleLevel} class="kern-title">${titleContent}</h${titleLevel}>${sublineHtml}
      </hgroup>
    </header>`;
	}

	// Build body section
	let bodyHtml = "";
	const bodyParts: string[] = [];

	if (body) {
		bodyParts.push(
			bodyIsHtml ? body : `<p class="kern-body">${escapeHtml(body)}</p>`,
		);
	}

	if (contentBlocks && contentBlocks.length > 0) {
		const recursiveResult = renderChildBlocks(context, contentBlocks);

		if (recursiveResult.html) {
			bodyParts.push(recursiveResult.html);
		}
		warnings.push(...recursiveResult.warnings);
	}

	if (bodyParts.length > 0) {
		bodyHtml = `
    <section class="kern-card__body">
      ${bodyParts.join("\n      ")}
    </section>`;
	}

	// Build footer section
	let footerHtml = "";
	if (footer && (footer.primaryLabel || footer.secondaryLabel)) {
		const buttons: string[] = [];
		if (footer.secondaryLabel) {
			buttons.push(`<button type="button" class="kern-btn kern-btn--secondary">
        <span class="kern-label">${escapeHtml(footer.secondaryLabel)}</span>
      </button>`);
		}
		if (footer.primaryLabel) {
			buttons.push(`<button type="button" class="kern-btn kern-btn--primary">
        <span class="kern-label">${escapeHtml(footer.primaryLabel)}</span>
      </button>`);
		}
		footerHtml = `
    <footer class="kern-card__footer">
      ${buttons.join("\n      ")}
    </footer>`;
	}

	const html = `<article class="${cardClasses.join(" ")}">${mediaHtml}
  <div class="kern-card__container">${headerHtml}${bodyHtml}${footerHtml}
  </div>
</article>`;

	return { html, warnings };
}
