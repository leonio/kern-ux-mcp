import { describe, expect, it } from "vitest";
import { validateHtmlStrict } from "../validate.js";
import { buildInputGroup } from "./input-group.js";

describe("buildInputGroup", () => {
	it("builds an input group with prefix and suffix", () => {
		const result = buildInputGroup(
			{ name: "amount", label: "Betrag", prefix: "€", suffix: "EUR" },
			"de",
		);
		expect(result.html).toContain('class="kern-input-group"');
		expect(result.html).toContain("€");
		expect(result.html).toContain("EUR");
	});

	it("labels the input, as KERN's labelled input group does", () => {
		const { html } = buildInputGroup(
			{ name: "miete", label: "Monatliche Miete in €", suffix: "€" },
			"de",
		);
		const id = html.match(/<input [^>]*id="([^"]+)"/)?.[1];

		expect(html).toMatch(/^<div class="kern-form-input">/);
		expect(html).toContain(
			`<label class="kern-label" for="${id}">Monatliche Miete in €</label>`,
		);
		expect(validateHtmlStrict(html)).toEqual({ ok: true, issues: [] });
	});

	it("needs a label", () => {
		expect(() => buildInputGroup({ name: "miete" } as never, "de")).toThrow(
			/label/,
		);
	});

	it("builds a readonly input group with readonly affixes", () => {
		const result = buildInputGroup(
			{
				name: "amount",
				label: "Betrag",
				prefix: "€",
				suffix: "EUR",
				value: "100",
				readonly: true,
			},
			"de",
		);

		expect(result.html).toContain("readonly");
		expect(result.html).toContain("kern-input-group-text--readonly");
	});

	it("escapes the model's text", () => {
		const text = `<b>"A" & 'B'</b>`;
		const result = buildInputGroup(
			{
				name: "betrag",
				label: text,
				prefix: text,
				suffix: text,
				value: text,
				placeholder: text,
			},
			"de",
		);

		expect(result.html).not.toContain("<b>");
		expect(result.html).toContain(
			"&lt;b&gt;&quot;A&quot; &amp; &#039;B&#039;&lt;/b&gt;",
		);
	});
});
