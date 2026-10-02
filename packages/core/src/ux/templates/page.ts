import { t } from "../i18n.js";
import { type PageInput, PageSchema } from "../schemas/page.js";
import type { BuildResult, Locale } from "../types.js";
import { createCompositionRenderer } from "./composition-renderer.js";
import { escapeHtml } from "./escape.js";
import { STACK_CLASSES } from "./form.js";
import { buildKopfzeile } from "./kopfzeile.js";

type PageParams = ReturnType<typeof PageSchema.parse>;
type Link = { label: string; href: string };

const LABELS = {
	skipLink: { de: "Zum Inhalt springen", en: "Skip to content" },
	mainNavigation: { de: "Hauptnavigation", en: "Main navigation" },
	serviceNavigation: { de: "Hilfsnavigation", en: "Service navigation" },
};

/**
 * Build a whole page: skip link, Kopfzeile, header, <main> with content blocks
 * and footer. `document: true` wraps it in the HTML document shell.
 */
export function buildPage(
	input: PageInput,
	locale: Locale,
	options: { kernVersion?: string } = {},
): BuildResult {
	const params = PageSchema.parse(input);
	// <main> is the page's container, so grids in it don't add their own, and it
	// stacks its heading and blocks like a form.
	const main = createCompositionRenderer(locale).renderBlocks(
		params.contentBlocks,
		1,
		{ inContainer: true, stacked: true },
	);
	const warnings = [...main.warnings];
	if (!params.heading) {
		warnings.push(
			"The page has no heading, so no <h1> unless a block sets headingLevel 1.",
		);
	}

	const headingHtml = params.heading
		? `<h1 class="kern-heading-x-large">${escapeHtml(params.heading)}</h1>\n  `
		: "";
	const parts = [
		// Visible: KERN has no focusable sr-only class, and a hidden focus fails WCAG 2.4.7.
		params.header
			? `<a class="kern-link kern-link--small" href="#main">${t(locale, LABELS.skipLink)}</a>`
			: "",
		params.kopfzeile ? buildKopfzeile({}, locale).html : "",
		params.header ? renderHeader(params.header, locale) : "",
		`<main id="main" class="kern-container ${STACK_CLASSES}">
  ${headingHtml}${main.html}
</main>`,
		params.footer ? renderFooter(params.footer) : "",
	].filter(Boolean);
	const body = parts.join("\n");

	if (!params.document) {
		return { html: body, warnings };
	}

	return {
		html: buildDocumentShell(body, {
			locale,
			title: params.title ?? params.heading ?? params.header?.title ?? "KERN",
			kernVersion: options.kernVersion,
		}),
		warnings,
	};
}

/**
 * A complete HTML document around `body`, loading the KERN stylesheets from
 * jsDelivr, pinned to `kernVersion` when known.
 */
export function buildDocumentShell(
	body: string,
	options: { locale: Locale; title: string; kernVersion?: string },
): string {
	const version = options.kernVersion ? `@${options.kernVersion}` : "";
	const base = `https://cdn.jsdelivr.net/npm/@kern-ux/native${version}/dist`;

	return `<!doctype html>
<html lang="${options.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)}</title>
  <link rel="stylesheet" href="${base}/kern.min.css">
  <link rel="stylesheet" href="${base}/fonts/fira-sans.css">
</head>
<body>
${body}
</body>
</html>`;
}

/**
 * The upstream flex header pattern, without its script-driven mobile toggles.
 * It sits in a container, so it keeps only the vertical part of upstream's padding.
 */
function renderHeader(
	header: NonNullable<PageParams["header"]>,
	locale: Locale,
): string {
	const logo = header.logo
		? `<img src="${escapeHtml(header.logo.src)}" alt="${escapeHtml(header.logo.alt)}">\n          `
		: "";
	const brand = `<div class="kern-brand">
        <a class="kern-link" href="${escapeHtml(header.homeHref ?? "/")}">
          ${logo}<span class="kern-title">${escapeHtml(header.title)}</span>
        </a>
      </div>`;

	const serviceNav = header.serviceLinks?.length
		? `
      <nav class="kern-align-self-end" aria-label="${t(locale, LABELS.serviceNavigation)}">
        <ul class="kern-list kern-flex-row-lg kern-gap-md kern-pt-none">
          ${header.serviceLinks.map((link) => `<li>${renderLink(link, "kern-link kern-link--small")}</li>`).join("\n          ")}
        </ul>
      </nav>`
		: "";

	const mainNav = header.navigation?.length
		? `
    <nav aria-label="${t(locale, LABELS.mainNavigation)}">
      <ul class="kern-list kern-flex-row-lg kern-gap-x-xl kern-gap-y-lg kern-pb-md">
        ${header.navigation.map((link) => `<li>${renderLink(link, "kern-link", link.current)}</li>`).join("\n        ")}
      </ul>
    </nav>`
		: "";

	return `<header>
  <div class="kern-container kern-flex kern-flex-col">
    <div class="kern-flex kern-justify-content-between kern-gap-x-xl kern-py-md">
      ${brand}${serviceNav}
    </div>${mainNav}
  </div>
</header>`;
}

/** Link columns in the 12-column grid, then an optional closing note. */
function renderFooter(footer: NonNullable<PageParams["footer"]>): string {
	const columns = footer.columns ?? [];
	const span = columns.length > 0 ? 12 / columns.length : 12;
	const columnsHtml = columns.length
		? `
    <div class="kern-row">
      ${columns
				.map(
					(column) => `<div class="kern-col-md-${span} kern-col-sm-12">
        <h2 class="kern-heading-small">${escapeHtml(column.heading)}</h2>
        <ul class="kern-list">
          ${column.links.map((link) => `<li>${renderLink(link, "kern-link")}</li>`).join("\n          ")}
        </ul>
      </div>`,
				)
				.join("\n      ")}
    </div>`
		: "";
	const note = footer.note
		? `
    <p class="kern-body kern-body--small">${escapeHtml(footer.note)}</p>`
		: "";

	return `<footer>
  <div class="kern-container">
    <hr class="kern-divider" role="presentation">${columnsHtml}${note}
  </div>
</footer>`;
}

function renderLink(link: Link, className: string, current = false): string {
	const ariaCurrent = current ? ' aria-current="page"' : "";
	return `<a class="${className}" href="${escapeHtml(link.href)}"${ariaCurrent}>${escapeHtml(link.label)}</a>`;
}
