import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

import type { PageInput } from "../schemas/page.js";
import { validateHtmlStrict } from "../validate.js";
import { buildPage } from "./page.js";

const FULL_PAGE: PageInput = {
	kopfzeile: true,
	heading: "Wohngeld beantragen",
	header: {
		title: "Stadt Musterstadt",
		homeHref: "/start",
		logo: { src: "/logo.svg", alt: "" },
		navigation: [
			{ label: "Start", href: "/" },
			{ label: "Anträge", href: "/antraege", current: true },
		],
		serviceLinks: [{ label: "Leichte Sprache", href: "/leichte-sprache" }],
	},
	contentBlocks: [
		{
			kind: "section",
			section: { headingText: "Voraussetzungen", paragraphs: ["Text"] },
		},
	],
	footer: {
		columns: [
			{ heading: "Service", links: [{ label: "Kontakt", href: "/kontakt" }] },
			{
				heading: "Rechtliches",
				links: [{ label: "Impressum", href: "/impressum" }],
			},
		],
		note: "© 2026 Stadt Musterstadt",
	},
};

describe("buildPage", () => {
	it("renders skip link, Kopfzeile, header, main and footer in order", () => {
		const root = parse(buildPage(FULL_PAGE, "de").html);
		const order = root.childNodes
			.filter((node) => "tagName" in node)
			.map((node) => {
				const element = node as ReturnType<typeof parse>;
				return element.classList.contains("kern-kopfzeile")
					? "kopfzeile"
					: element.tagName.toLowerCase();
			});

		expect(order).toEqual(["a", "kopfzeile", "header", "main", "footer"]);
		expect(root.querySelector("a")?.getAttribute("href")).toBe("#main");
		expect(root.querySelector("a")?.text).toBe("Zum Inhalt springen");
	});

	it("renders the header after the flex header pattern", () => {
		const header = parse(buildPage(FULL_PAGE, "de").html).querySelector(
			"header",
		);
		const brand = header?.querySelector(".kern-brand a");

		expect(brand?.getAttribute("href")).toBe("/start");
		expect(brand?.querySelector(".kern-title")?.text).toBe("Stadt Musterstadt");
		expect(brand?.querySelector("img")?.getAttribute("alt")).toBe("");
		expect(
			header
				?.querySelector('nav[aria-label="Hilfsnavigation"] a')
				?.classList.contains("kern-link--small"),
		).toBe(true);

		const mainNav = header?.querySelectorAll(
			'nav[aria-label="Hauptnavigation"] a',
		);
		expect(mainNav?.map((link) => link.text)).toEqual(["Start", "Anträge"]);
		expect(mainNav?.map((link) => link.getAttribute("aria-current"))).toEqual([
			undefined,
			"page",
		]);
	});

	it("puts the h1 and the blocks in main", () => {
		const main = parse(buildPage(FULL_PAGE, "de").html).querySelector("main");

		expect(main?.getAttribute("id")).toBe("main");
		expect(main?.classList.contains("kern-container")).toBe(true);
		expect(main?.querySelector("h1")?.text).toBe("Wohngeld beantragen");
		expect(main?.querySelector("section h2")?.text).toBe("Voraussetzungen");
	});

	it("renders the footer columns in the 12-column grid", () => {
		const footer = parse(buildPage(FULL_PAGE, "de").html).querySelector(
			"footer",
		);

		expect(
			footer
				?.querySelectorAll(".kern-row > div")
				.map((column) => column.getAttribute("class")),
		).toEqual(["kern-col-md-6 kern-col-sm-12", "kern-col-md-6 kern-col-sm-12"]);
		expect(footer?.querySelectorAll("h2").map((h) => h.text)).toEqual([
			"Service",
			"Rechtliches",
		]);
		expect(footer?.querySelector("p.kern-body--small")?.text).toBe(
			"© 2026 Stadt Musterstadt",
		);
	});

	it("passes validation", () => {
		const html = buildPage(FULL_PAGE, "de").html;

		expect(validateHtmlStrict(html).issues).toEqual([]);
	});

	it("renders just main for a minimal page, and warns about the missing h1", () => {
		const result = buildPage(
			{ contentBlocks: [{ kind: "text", text: "Hallo" }] },
			"en",
		);
		const root = parse(result.html);

		expect(root.querySelector("header")).toBeNull();
		expect(root.querySelector(".kern-kopfzeile")).toBeNull();
		expect(root.querySelector('a[href="#main"]')).toBeNull();
		expect(root.querySelector("main")?.text.trim()).toBe("Hallo");
		expect(result.warnings).toEqual([
			"The page has no heading, so no <h1> unless a block sets headingLevel 1.",
		]);
	});

	it("wraps a document in the shell with pinned KERN stylesheets", () => {
		const html = buildPage({ ...FULL_PAGE, document: true }, "en", {
			kernVersion: "2.8.2",
		}).html;

		expect(html.startsWith('<!doctype html>\n<html lang="en">')).toBe(true);
		expect(html).toContain("<title>Wohngeld beantragen</title>");
		expect(html).toContain(
			'<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kern-ux/native@2.8.2/dist/kern.min.css">',
		);
		expect(html).toContain(
			'<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kern-ux/native@2.8.2/dist/fonts/fira-sans.css">',
		);
		expect(html).toContain("Skip to content");
		expect(html.trimEnd().endsWith("</body>\n</html>")).toBe(true);
		expect(validateHtmlStrict(html).issues).toEqual([]);
	});

	it("uses the title over the heading, and the latest KERN without a version", () => {
		const html = buildPage(
			{ ...FULL_PAGE, title: "Antrag | Musterstadt", document: true },
			"de",
		).html;

		expect(html).toContain("<title>Antrag | Musterstadt</title>");
		expect(html).toContain(
			"https://cdn.jsdelivr.net/npm/@kern-ux/native/dist/kern.min.css",
		);
	});

	it("escapes the model's text", () => {
		const text = `<b>"A" & 'B'</b>`;
		const html = buildPage(
			{
				title: text,
				heading: text,
				header: {
					title: text,
					homeHref: text,
					navigation: [{ label: text, href: text }],
				},
				contentBlocks: [{ kind: "text", text }],
				footer: {
					columns: [{ heading: text, links: [{ label: text, href: text }] }],
					note: text,
				},
				document: true,
			},
			"de",
		).html;

		expect(html).not.toContain("<b>");
	});
});
