import { describe, expect, it } from "vitest";
import { callHandler, createRegistry } from "../../test-support/tools.js";
import { createTools } from "../tools.js";
import type { ComponentInfo, Registry } from "../types.js";
import { findDocumentedComponent } from "./component-docs.js";

type DocsResult = {
	componentId: string;
	kernId?: string;
	title: string;
	status: string;
	tool?: string;
	note?: string;
	summary?: string;
	whenToUse?: string[];
	whenNotToUse?: Array<{ text: string; useInstead?: string; tool?: string }>;
	dos?: string[];
	donts?: string[];
	similar?: Array<{
		componentId?: string;
		name?: string;
		tool?: string;
		difference?: string;
	}>;
	accessibility?: Array<{ criterion?: string; status: string }>;
	docs?: { url: string; sections: Array<{ heading: string }> };
	canonicalHtml?: string;
	reviewedGuidance?: {
		status: string;
		summary: { text: string; evidence: Array<{ source: string }> };
	};
	relatedTools?: string[];
};

const inputText: ComponentInfo = {
	id: "inputtext",
	kernId: "input-text",
	title: "Input Text",
	status: "stable",
	summary: "The basic single-line field.",
	knowledge: {
		whenToUse: ["For a name or a street."],
		whenNotToUse: [{ text: "For long text.", useInstead: "textarea" }],
		dos: ["Show the error below the field."],
		donts: ["Don't disable it."],
		similar: [
			{ id: "inputemail", difference: "For e-mail addresses." },
			{ id: "tabs" },
			{ name: "Tooltip" },
		],
	},
	docs: {
		url: "https://www.kern-ux.de/komponenten/form-inputs/text",
		summary: "The page in short.",
		sections: [
			{
				heading: "Kurzbeschreibung",
				url: "https://www.kern-ux.de/komponenten/form-inputs/text#kurzbeschreibung",
				summary: "The section in short.",
			},
		],
	},
	accessibility: [
		{
			criterion: "1.3.1",
			slug: "info-and-relationships",
			level: "A",
			status: "passed",
		},
		{
			criterion: "3.3.2",
			slug: "labels-or-instructions",
			level: "A",
			status: "implementation-dependent",
		},
	],
	sources: ["src/scss/core/components/_input.scss"],
};

const docsOnlyTabs: ComponentInfo = {
	id: "tabs",
	kernId: "tabs",
	title: "Tabs",
	status: "docs-only",
	summary: "Lets users switch between content panels.",
};

function registryWith(components: ComponentInfo[]): Registry {
	return {
		...createRegistry(components),
		upstream: { package: "@kern-ux/native", version: "2.8.2" },
	};
}

const docs = (registry: Registry, componentId: string, locale?: string) =>
	callHandler<DocsResult>(createTools(registry).getTool("get_component_docs"), {
		componentId,
		locale,
	});

describe("get_component_docs", () => {
	it("returns KERN's guidance from the registry, with our tools named", async () => {
		const result = await docs(
			registryWith([inputText, docsOnlyTabs]),
			"inputtext",
		);

		expect(result).toEqual({
			componentId: "inputtext",
			kernId: "input-text",
			title: "Input Text",
			status: "stable",
			tool: "get_inputtext",
			card: "kern://components/inputtext",
			summary: "The basic single-line field.",
			whenToUse: ["For a name or a street."],
			whenNotToUse: [
				{
					text: "For long text.",
					useInstead: "textarea",
					tool: "get_textarea",
				},
			],
			dos: ["Show the error below the field."],
			donts: ["Don't disable it."],
			similar: [
				{
					componentId: "inputemail",
					tool: "get_inputemail",
					difference: "For e-mail addresses.",
				},
				{ componentId: "tabs" },
				{ name: "Tooltip" },
			],
			accessibility: [
				{
					criterion: "3.3.2",
					slug: "labels-or-instructions",
					level: "A",
					status: "implementation-dependent",
				},
			],
			docs: inputText.docs,
			relatedTools: ["get_inputemail", "get_textarea"],
		});
	});

	it.each([
		["KERN's ID", "input-text"],
		["another spelling of ours", "InputText"],
		["another spelling of KERN's", "input_text"],
	])("accepts %s", async (_label, componentId) => {
		const result = await docs(registryWith([inputText]), componentId);

		expect(result.componentId).toBe("inputtext");
	});

	it("finds KERN's ID where ours differs", () => {
		const checkbox: ComponentInfo = {
			id: "checkbox",
			kernId: "checkboxes",
			title: "Input Checkboxes",
			status: "stable",
		};
		const registry = registryWith([checkbox]);

		expect(findDocumentedComponent(registry, "checkboxes")?.id).toBe(
			"checkbox",
		);
		expect(findDocumentedComponent(registry, "Check-Boxes")?.id).toBe(
			"checkbox",
		);
	});

	it("says a docs-only component has no implementation", async () => {
		const result = await docs(registryWith([docsOnlyTabs]), "tabs");

		expect(result.tool).toBeUndefined();
		expect(result.note).toBe(
			"KERN 2.8.2 documents Tabs but doesn't implement it: there's no tool and no kern-* markup for it.",
		);
		expect(result.summary).toBe("Lets users switch between content panels.");
	});

	it("says when the server has no tool for an implemented component", async () => {
		const result = await docs(
			registryWith([{ id: "mystery", title: "Mystery", status: "stable" }]),
			"mystery",
		);

		expect(result.note).toBe("This server has no tool for this component.");
	});

	it("returns canonical HTML only where the registry has it", async () => {
		const registry = registryWith([
			inputText,
			{
				id: "details",
				title: "Details",
				status: "stable",
				htmlCanonical: '<details class="kern-details"></details>',
			},
		]);

		expect((await docs(registry, "details")).canonicalHtml).toBe(
			'<details class="kern-details"></details>',
		);
		expect((await docs(registry, "inputtext")).canonicalHtml).toBeUndefined();
	});

	it("serves the notes about our tool in the requested language", async () => {
		const registry = registryWith([
			{ id: "kopfzeile", title: "Kopfzeile", status: "stable" },
		]);

		const de = await docs(registry, "kopfzeile", "de");
		const en = await docs(registry, "kopfzeile", "en");

		expect(de.reviewedGuidance?.status).toBe("reviewed");
		expect(de.reviewedGuidance?.summary.text).toContain(
			"Die Kopfzeile ist die schmale Leiste mit Bundesflagge",
		);
		expect(de.reviewedGuidance?.summary.evidence[0].source).toBe(
			"kern-ux-plain/stories/Kopfzeile/Kopfzeile.stories.js",
		);
		expect(en.reviewedGuidance?.summary.text).toContain(
			"The tool renders the CSS variant of the upstream component",
		);
	});

	it.each([
		["inputdate", "single browser-native date field"],
		["dropdown", "details/summary"],
	])("serves the notes about the %s tool", async (componentId, phrase) => {
		const result = await docs(
			registryWith([{ id: componentId, title: componentId, status: "stable" }]),
			componentId,
			"en",
		);

		expect(result.reviewedGuidance?.summary.text).toContain(phrase);
	});

	it.each([
		{ id: "button", expected: ["get_icon", "list_icons"] },
		{ id: "dialog", expected: ["get_button"] },
		{ id: "card", expected: ["get_button", "get_card_group"] },
		{ id: "heading", expected: undefined },
	])("suggests the tools that go with $id", async ({ id, expected }) => {
		const result = await docs(
			registryWith([{ id, title: id, status: "stable" }]),
			id,
		);

		expect(result.relatedTools).toEqual(expected);
	});

	it("points a docs-only header at the tools that render one", async () => {
		const result = await docs(
			registryWith([{ id: "header", title: "Header", status: "docs-only" }]),
			"header",
		);

		expect(result.relatedTools).toEqual(["render_page", "get_pattern"]);
	});

	it("names the IDs it takes when it doesn't know one", async () => {
		await expect(docs(registryWith([inputText]), "form-input")).rejects.toThrow(
			"Unknown componentId: form-input. Use an ID from list_components_by_category, such as inputtext, or KERN's, such as input-text.",
		);
	});
});
