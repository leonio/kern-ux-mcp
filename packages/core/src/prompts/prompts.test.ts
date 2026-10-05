import { describe, expect, it } from "vitest";

import { getCatalog } from "../mcp/catalog.js";
import { byteLength } from "../resources/definition.js";
import { loadRegistryFromManifest } from "../ux/registry.js";
import { VALIDATE_HTML_MAX_LENGTH } from "../ux/tools.js";
import {
	cardLinks,
	embeddedResource,
	fencedHtml,
	type KernPromptContent,
	type KernPromptDefinition,
	strictRender,
} from "./definition.js";

const { prompts, resources } = getCatalog();

function prompt(name: string): KernPromptDefinition {
	const found = prompts.find((candidate) => candidate.name === name);
	if (!found) throw new Error(`No prompt ${name}.`);
	return found;
}

/** The prompt's content, parsed like the SDK does before it calls content(). */
async function contentOf(
	name: string,
	args: Record<string, string>,
): Promise<readonly KernPromptContent[]> {
	const definition = prompt(name);
	return definition.content(definition.argsSchema.parse(args));
}

/** The workflow: the last block, always text. */
async function workflowOf(name: string, args: Record<string, string>) {
	const last = (await contentOf(name, args)).at(-1);
	if (last?.type !== "text") throw new Error(`${name} doesn't end in text.`);
	return last.text;
}

/**
 * The messages for a snapshot: one heading line per block, then a text
 * block's text. An embedded resource shows its URI and size only, since each
 * resource has a snapshot of its own.
 */
function snapshotText(content: readonly KernPromptContent[]): string {
	return content
		.map((block, index) => {
			const heading = `<!-- message ${index + 1}: ${block.type}`;
			if (block.type === "resource") {
				return `${heading} ${block.resource.uri} (${block.resource.mimeType}, ${byteLength(block.resource.text)} bytes) -->`;
			}
			if (block.type === "resource_link") {
				return `${heading} ${block.uri} "${block.title}" -->`;
			}
			return `${heading} -->\n${block.text}`;
		})
		.join("\n\n")
		.concat("\n");
}

const CASES: ReadonlyArray<{
	prompt: string;
	label: string;
	args: Record<string, string>;
}> = [
	{
		prompt: "create_input_form",
		label: "contact",
		args: {
			purpose: "Kontaktformular des Bürgerbüros",
			fields:
				"Name, E-Mail, Nachricht, Zustimmung zur Datenschutzerklärung (Pflicht)",
		},
	},
	{
		prompt: "create_input_form",
		label: "contact-en",
		args: {
			purpose: "Contact form of the citizens' office",
			fields: "Name, Email, Message",
			locale: "en",
		},
	},
	{
		prompt: "create_input_form",
		label: "steps",
		args: {
			purpose: "Antrag auf einen Bewohnerparkausweis",
			fields:
				"Vorname, Nachname, Geburtsdatum, Kennzeichen, Fahrzeugart (PKW, Motorrad, Wohnmobil), Bestätigung der Angaben",
			steps: "Persönliche Daten; Fahrzeug; Prüfen und Absenden",
		},
	},
	{
		prompt: "create_page_layout",
		label: "service-page",
		args: {
			purpose:
				"Sperrmüll anmelden, Website der Stadt Musterstadt mit der Navigation Start, Abfall, Kontakt",
			sections:
				"Einleitung; Abholung buchen (Formular); Gebühren (Tabelle); Häufige Fragen",
		},
	},
	{
		prompt: "create_page_layout",
		label: "home-en",
		args: {
			purpose: "Home page of the Musterstadt citizen portal",
			locale: "en",
		},
	},
	{
		prompt: "review_kern_html",
		label: "fix",
		args: {
			html: '<h1>Bürgerbüro</h1>\n<h3>Öffnungszeiten</h3>\n<img src="buergerbuero.jpg">\n<input type="text" id="name" placeholder="Name">\n<button class="kern-button">Senden</button>',
		},
	},
];

describe("prompts", () => {
	it("are create_input_form, create_page_layout and review_kern_html", () => {
		expect(prompts.map((definition) => definition.name)).toEqual([
			"create_input_form",
			"create_page_layout",
			"review_kern_html",
		]);
	});

	it.each(CASES)(
		"renders $prompt ($label)",
		async ({ prompt, label, args }) => {
			await expect(
				snapshotText(await contentOf(prompt, args)),
			).toMatchFileSnapshot(`__snapshots__/${prompt}.${label}.md`);
		},
	);

	it.each(prompts.map((definition) => definition.name))(
		"%s gives the same content every time",
		async (name) => {
			const args = CASES.find((entry) => entry.prompt === name)?.args ?? {};

			expect(await contentOf(name, args)).toEqual(await contentOf(name, args));
		},
	);
});

describe("create_input_form", () => {
	const args = { purpose: "Kontakt", fields: "Name, E-Mail" };

	it("defaults to German, also for a blank locale", async () => {
		const german = await workflowOf("create_input_form", args);

		expect(german).toContain("a short `label` in German");
		expect(german).toContain('`locale: "de"`');
		expect(await workflowOf("create_input_form", { ...args, locale: "" })).toBe(
			german,
		);
	});

	it("passes English to the render call", async () => {
		const english = await workflowOf("create_input_form", {
			...args,
			locale: "en",
		});

		expect(english).toContain("a short `label` in English");
		expect(english).toContain('`locale: "en"`');
	});

	it("asks for strict rendering and the HTML verbatim", async () => {
		const text = await workflowOf("create_input_form", args);

		expect(text).toContain("`render_composition`");
		expect(text).toContain("`strict: true`");
		expect(text).toMatch(/verbatim, in one ```html block/);
	});

	it("embeds the forms guide first and links the input cards", async () => {
		const content = await contentOf("create_input_form", args);

		expect(content[0]).toMatchObject({
			type: "resource",
			resource: { uri: "kern://guides/forms", mimeType: "text/markdown" },
		});
		expect(
			content.flatMap((block) =>
				block.type === "resource_link" ? [block.name] : [],
			),
		).toEqual([
			"inputtext",
			"textarea",
			"select",
			"checkbox",
			"radio",
			"fieldset",
		]);
	});
});

describe("create_input_form with steps", () => {
	const args = {
		purpose: "Bewohnerparkausweis",
		fields: "Name, Kennzeichen",
		steps: "Person; Fahrzeug; Prüfen",
	};
	const linkNames = (content: readonly KernPromptContent[]) =>
		content.flatMap((block) =>
			block.type === "resource_link" ? [block.name] : [],
		);

	it("builds a formFlow whose review step starts with a summary block", async () => {
		const text = await workflowOf("create_input_form", args);

		expect(text).toMatch(/^Build a multi-step form with the kern tools/);
		expect(text).toContain("Steps: Person; Fahrzeug; Prüfen");
		expect(text).toContain("one `formFlow` block with exactly the steps given");
		expect(text).toContain(
			'start its `contentBlocks` with a summary block, `{ kind: "summary", summary:',
		);
		// Pasting get_summary's HTML into an html block made large, escape-heavy
		// inputs: one unparsable, and an empty step after it in 3 of 6 runs.
		expect(text).not.toContain("get_summary");
		expect(text).not.toContain("`html` block, before");
		expect(text).toContain("`renderAllSteps: true`");
		expect(text).toContain("such as Zurück, Weiter and Absenden");
		expect(text).not.toContain("one `form` block");
	});

	it("names the English labels for an English form", async () => {
		const text = await workflowOf("create_input_form", {
			...args,
			locale: "en",
		});

		expect(text).toContain("such as Back, Next and Submit");
		expect(text).toContain('such as "Review and submit"');
	});

	it("links the step list, progress and summary cards too", async () => {
		expect(linkNames(await contentOf("create_input_form", args))).toEqual([
			"inputtext",
			"textarea",
			"select",
			"checkbox",
			"radio",
			"fieldset",
			"tasklist",
			"progress",
			"summary",
		]);
	});

	it("builds a form on one page for blank steps", async () => {
		const single = { purpose: args.purpose, fields: args.fields };

		expect(
			await contentOf("create_input_form", { ...single, steps: " " }),
		).toEqual(await contentOf("create_input_form", single));
	});
});

describe("create_page_layout", () => {
	const args = { purpose: "Startseite", sections: "Einleitung; Leistungen" };

	it("embeds the layout guide and links the page's cards", async () => {
		const content = await contentOf("create_page_layout", args);

		expect(content[0]).toMatchObject({
			type: "resource",
			resource: { uri: "kern://guides/layout", mimeType: "text/markdown" },
		});
		expect(
			content.flatMap((block) =>
				block.type === "resource_link" ? [block.name] : [],
			),
		).toEqual(["kopfzeile", "heading", "grid", "card", "link"]);
	});

	it("renders the page strictly with render_page, in the sections' order", async () => {
		const text = await workflowOf("create_page_layout", args);

		expect(text).toContain("Sections: Einleitung; Leistungen");
		expect(text).toContain(
			'one section block per section, in the order given: `{ kind: "section", section: { headingText, contentBlocks } }`',
		);
		// Without the nested shape, every service-page run in prompts-r7-c wrote
		// headingText on the block itself.
		expect(text).toContain('`{ kind: "grid", grid: { columnsContent:');
		expect(text).toContain('`{ kind: "card", card: { header: { title,');
		expect(text).toContain(
			'call `render_page` with `locale: "de"` and `strict: true`',
		);
		expect(text).toMatch(/verbatim, in one ```html block/);
	});

	it("chooses the sections from the purpose when none are given", async () => {
		const text = await workflowOf("create_page_layout", {
			purpose: "Startseite",
			sections: "",
		});

		expect(text).not.toMatch(/^Sections: /m);
		expect(text).not.toContain("in the order given");
	});

	it("writes the text in English for an English page", async () => {
		const text = await workflowOf("create_page_layout", {
			...args,
			locale: "en",
		});

		expect(text).toContain("All text in English.");
		expect(text).toContain('`locale: "en"`');
	});
});

describe("review_kern_html", () => {
	const html = '<img src="wappen.png">';

	it("embeds the accessibility guide and links no cards", async () => {
		const content = await contentOf("review_kern_html", { html });

		expect(content.map((block) => block.type)).toEqual(["resource", "text"]);
		expect(content[0]).toMatchObject({
			resource: { uri: "kern://guides/accessibility" },
		});
	});

	it("puts the HTML before the steps: check, problems, rebuild, strict render", async () => {
		const text = await workflowOf("review_kern_html", { html });

		expect(text.indexOf(html)).toBeLessThan(text.indexOf("1. **Check:**"));
		expect(text).toContain('```html\n<img src="wappen.png">\n```');
		expect(text).toContain("call `validate_html` with the HTML as it is");
		expect(text).toContain("2. **Problems:** collect them for your answer");
		expect(text).toContain(
			'call `render_page` or `render_composition` with `locale: "de"` and `strict: true`',
		);
	});

	it("asks for the fix list once, in the answer, with what a person must check", async () => {
		const text = await workflowOf("review_kern_html", { html });

		expect(text.match(/fix list/g)).toHaveLength(1);
		expect(text).toMatch(
			/^Answer with the fix list in German, one line per problem: its rule, how the rebuild fixed it, and what a person still has to check/m,
		);
		expect(text).toMatch(/Then the final HTML from the tool, verbatim/);
	});

	it("writes the fix list in English for en", async () => {
		expect(
			await workflowOf("review_kern_html", { html, locale: "en" }),
		).toContain("Answer with the fix list in English");
	});

	it("takes no more HTML than validate_html", () => {
		const { argsSchema } = prompt("review_kern_html");

		expect(
			argsSchema.safeParse({ html: "x".repeat(VALIDATE_HTML_MAX_LENGTH) })
				.success,
		).toBe(true);
		expect(
			argsSchema.safeParse({ html: "x".repeat(VALIDATE_HTML_MAX_LENGTH + 1) })
				.success,
		).toBe(false);
	});
});

describe("prompt content helpers", () => {
	const registry = loadRegistryFromManifest();
	const guides = resources.find((definition) => definition.name === "guides");

	it("refuse a card the registry doesn't have", () => {
		expect(() => cardLinks(registry, ["input-text"])).toThrow(
			/card input-text, which isn't in the registry/,
		);
	});

	it("refuse a guide that doesn't exist", async () => {
		if (!guides) throw new Error("No guides resource.");
		await expect(embeddedResource(guides, "composition")).rejects.toThrow(
			/guides has no composition/,
		);
	});

	it("fence HTML with more backticks than any run inside it", () => {
		expect(fencedHtml("<p>a</p>")).toBe("```html\n<p>a</p>\n```");
		expect(fencedHtml("<pre>```js\nx\n```</pre>")).toBe(
			"````html\n<pre>```js\nx\n```</pre>\n````",
		);
	});

	it("join render tools as alternatives", () => {
		expect(strictRender("render_page", "en")).toMatch(
			/^\*\*Render:\*\* call `render_page` with `locale: "en"`/,
		);
		expect(strictRender(["render_page", "render_composition"], "de")).toMatch(
			/call `render_page` or `render_composition` with/,
		);
	});
});
