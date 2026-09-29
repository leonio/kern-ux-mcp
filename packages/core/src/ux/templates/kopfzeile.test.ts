import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

import { validateHtmlStrict } from "../validate.js";
import { buildKopfzeile } from "./kopfzeile.js";

describe("buildKopfzeile", () => {
	it("renders the upstream Kopfzeile: flag and official label in a container", () => {
		const html = buildKopfzeile({}, "de").html;
		const bar = parse(html).querySelector(".kern-kopfzeile");

		expect(
			bar?.querySelector(".kern-container > .kern-kopfzeile__content"),
		).not.toBeNull();
		expect(
			bar
				?.querySelector(".kern-kopfzeile__flagge")
				?.getAttribute("aria-hidden"),
		).toBe("true");
		expect(bar?.querySelector(".kern-kopfzeile__flagge svg")).not.toBeNull();
		expect(bar?.querySelector(".kern-kopfzeile__label")?.text).toBe(
			"Offizielle Website – Bundesrepublik Deutschland",
		);
		expect(html).not.toContain("<nav");
		expect(validateHtmlStrict(html).issues).toEqual([]);
	});

	it("uses the English label, a custom label and the fluid container", () => {
		expect(buildKopfzeile({}, "en").html).toContain(
			"Official website – Federal Republic of Germany",
		);

		const html = buildKopfzeile(
			{ label: "Land & Bund", fluid: true },
			"de",
		).html;
		expect(html).toContain('<div class="kern-container-fluid">');
		expect(html).toContain("Land &amp; Bund");
	});
});
