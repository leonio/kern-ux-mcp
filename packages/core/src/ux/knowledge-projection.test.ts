import { describe, expect, it } from "vitest";
import { GUIDE_FOUNDATIONS } from "./knowledge-map.js";
import { projectRegistry } from "./knowledge-projection.js";
import { COMPONENT_TOOL_IDS } from "./tool-builders/component-tools.js";

const TOKENS = { colors: ["--kern-color-x"], spacing: [], rawVariables: [] };

const example = (id: string, path = "stories/x.stories.js") => ({
	id,
	html: {
		markup: `<div class="kern-${id}"></div>`,
		source: { repo: "kern-ux-plain", path },
	},
});

/** A bundle with one component per component tool, as checkKnowledgeBundle wants it. */
function bundle(input: Record<string, unknown> = {}): Map<string, unknown> {
	const files = new Map<string, unknown>();
	const ids = COMPONENT_TOOL_IDS.filter(
		(id) => id !== "layers" && id !== "pattern",
	).map(
		(id) => ({ checkbox: "checkboxes", inputtext: "input-text" })[id] ?? id,
	);

	for (const id of ids) {
		files.set(`components/${id}.json`, {
			id,
			title: { en: id, de: id },
			status: "stable",
			group: "test",
			synonyms: { de: [] },
			links: { docs: `https://www.kern-ux.de/${id}` },
			implementations: {},
		});
	}
	files.set("components/details.json", {
		...(files.get("components/details.json") as object),
		examples: [example("details")],
	});
	files.set("components/search.json", {
		...(files.get("components/search.json") as object),
		examples: [example("search-with-label")],
	});
	files.set("foundations/classes.json", {
		id: "classes",
		classes: [{ class: "kern-btn", kind: "component", owner: "button" }],
	});
	files.set("foundations/icons.json", {
		id: "icons",
		icons: [{ name: "add", class: "kern-icon--add" }],
	});
	files.set("foundations/utilities.json", {
		id: "utilities",
		examples: [example("stack", "stories/Layers/Layers.stories.js")],
		docs: {
			url: "https://www.kern-ux.de/komponenten/layout/hilfsklassen",
			sections: [
				["css-flex", "Flex utilities."],
				["css-grid", "kern-grid replaces kern-row."],
				["beschreibung", "kern-grid-cols-{n} sets the columns."],
				["dos-and-donts", undefined],
				["stack", "A vertical flex container."],
			].map(([id, summary]) => ({
				id,
				heading: `Heading ${id}`,
				url: `https://www.kern-ux.de/komponenten/layout/hilfsklassen#${id}`,
				...(summary ? { summary: { en: summary } } : {}),
			})),
		},
	});
	files.set("patterns/header.json", {
		id: "header",
		examples: [example("flex-header", "stories/Pattern/Header.stories.js")],
	});
	for (const id of GUIDE_FOUNDATIONS) {
		const file = `foundations/${id}.json`;
		files.set(file, {
			id,
			title: { en: id, de: id },
			status: "documented",
			links: { docs: `https://www.kern-ux.de/${id}` },
			...(files.get(file) as object | undefined),
		});
	}
	files.set("index.json", {
		bundleVersion: "0.2.0",
		generatedAt: "2026-10-03T09:09:48Z",
		kernVersion: "2.8.2",
		sources: [
			{
				id: "kern-ux-plain",
				package: "@kern-ux/native",
				version: "2.8.2",
				license: "EUPL-1.2",
				commit: "c098170",
			},
		],
		components: ids.map((id) => ({
			id,
			title: id,
			file: `components/${id}.json`,
		})),
		patterns: [],
		foundations: [],
	});
	for (const [file, document] of Object.entries(input)) {
		files.set(file, document);
	}
	return files;
}

const project = (input: Record<string, unknown> = {}) =>
	projectRegistry(bundle(input), TOKENS);

const componentOf = (
	registry: ReturnType<typeof projectRegistry>,
	id: string,
) => registry.components.find((component) => component.id === id);

describe("projectRegistry", () => {
	it("takes the version, date and pins from the index, and keeps the tokens", () => {
		const registry = project();

		expect(registry.manifestVersion).toBe("2.1.0");
		expect(registry.generatedAt).toBe("2026-10-03T09:09:48Z");
		expect(registry.upstream).toEqual({
			package: "@kern-ux/native",
			version: "2.8.2",
			commit: "c098170",
			bundleVersion: "0.2.0",
		});
		expect(registry.tokens).toBe(TOKENS);
		expect(registry.icons).toEqual(["add"]);
	});

	it("gives every component tool an entry, under our IDs, sorted", () => {
		const ids = project().components.map((component) => component.id);

		expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
		expect(new Set(ids)).toEqual(new Set(COMPONENT_TOOL_IDS));
	});

	it("maps a component's identity and the bundle's English text", () => {
		const registry = project({
			"components/input-text.json": {
				id: "input-text",
				title: { en: "Input Text", de: "Textfeld" },
				status: "stable",
				group: "form",
				synonyms: {
					de: ["Textfeld", "Eingabefeld"],
					en: ["Text field", "Textfeld"],
				},
				links: {
					docs: "https://www.kern-ux.de/komponenten/form-inputs/text",
					figma: "https://www.figma.com/file",
				},
				docs: {
					url: "https://www.kern-ux.de/komponenten/form-inputs/text",
					summary: { en: "The page in short." },
					sections: [
						{
							id: "kurzbeschreibung",
							heading: "Kurzbeschreibung",
							url: "https://www.kern-ux.de/komponenten/form-inputs/text#kurzbeschreibung",
							summary: { en: "The section in short." },
						},
						{
							id: "weiteres",
							heading: "Weiteres",
							url: "https://www.kern-ux.de/komponenten/form-inputs/text#weiteres",
						},
					],
				},
				knowledge: {
					summary: { en: "A single-line field." },
					whenToUse: [{ en: "For a name." }],
					whenNotToUse: [{ en: "For long text.", useInstead: "textarea" }],
					donts: [{ en: "Don't disable it." }],
					similar: [
						{ id: "checkboxes", difference: { en: "Picks from a list." } },
						{ name: "Tooltip" },
					],
				},
				implementations: {
					html: {
						package: "@kern-ux/native",
						version: "2.8.2",
						sources: ["src/scss/core/components/_input.scss"],
					},
				},
				provenance: { "knowledge.summary": { origin: "reviewed" } },
			},
		});

		expect(componentOf(registry, "inputtext")).toEqual({
			id: "inputtext",
			kernId: "input-text",
			title: "Input Text",
			titleDe: "Textfeld",
			status: "stable",
			group: "form",
			synonyms: ["Textfeld", "Eingabefeld", "Text field"],
			links: {
				docs: "https://www.kern-ux.de/komponenten/form-inputs/text",
				figma: "https://www.figma.com/file",
			},
			summary: "A single-line field.",
			knowledge: {
				whenToUse: ["For a name."],
				whenNotToUse: [{ text: "For long text.", useInstead: "textarea" }],
				donts: ["Don't disable it."],
				similar: [
					{ id: "checkbox", difference: "Picks from a list." },
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
					{
						heading: "Weiteres",
						url: "https://www.kern-ux.de/komponenten/form-inputs/text#weiteres",
					},
				],
			},
			sources: ["src/scss/core/components/_input.scss"],
		});
	});

	it("leaves out what a component doesn't have", () => {
		expect(componentOf(project(), "badge")).toEqual({
			id: "badge",
			kernId: "badge",
			title: "badge",
			status: "stable",
			group: "test",
			links: { docs: "https://www.kern-ux.de/badge" },
		});
	});

	it("keeps one entry per criterion, with the strictest status, in WCAG order", () => {
		const base = bundle().get("components/badge.json") as object;
		const registry = project({
			"components/badge.json": {
				...base,
				accessibility: [
					{
						id: "a",
						criterion: "1.4.11",
						slug: "non-text-contrast",
						level: "AA",
						status: "passed",
					},
					{
						id: "b",
						criterion: "1.3.5",
						slug: "identify-input-purpose",
						level: "AA",
						status: "passed",
					},
					{
						id: "c",
						criterion: "1.4.3",
						slug: "contrast-minimum",
						level: "AA",
						status: "unknown",
					},
					{
						id: "b-2",
						criterion: "1.3.5",
						slug: "identify-input-purpose",
						level: "AA",
						status: "implementation-dependent",
					},
					{
						id: "b-3",
						criterion: "1.3.5",
						slug: "identify-input-purpose",
						level: "AA",
						status: "passed",
					},
					{ id: "d", slug: "custom-check", level: "", status: "passed" },
				],
			},
		});

		expect(componentOf(registry, "badge")?.accessibility).toEqual([
			{
				criterion: "1.3.5",
				slug: "identify-input-purpose",
				level: "AA",
				status: "implementation-dependent",
			},
			{
				criterion: "1.4.3",
				slug: "contrast-minimum",
				level: "AA",
				status: "unknown",
			},
			{
				criterion: "1.4.11",
				slug: "non-text-contrast",
				level: "AA",
				status: "passed",
			},
			{ slug: "custom-check", status: "passed" },
		]);
	});

	it("gives the fallback tools their picked markup, and only them", () => {
		const registry = project();

		expect(componentOf(registry, "details")?.htmlCanonical).toBe(
			'<div class="kern-details"></div>',
		);
		expect(componentOf(registry, "layers")).toEqual({
			id: "layers",
			title: "Layers",
			status: "stable",
			htmlCanonical: '<div class="kern-stack"></div>',
			sources: ["stories/Layers/Layers.stories.js"],
		});
		expect(componentOf(registry, "pattern")?.htmlCanonical).toBe(
			'<div class="kern-flex-header"></div>',
		);
		expect(
			registry.components
				.filter((component) => component.htmlCanonical)
				.map((component) => component.id),
		).toEqual(["details", "layers", "pattern", "search"]);
	});

	it("makes get_grid's entry from the utilities' CSS Grid sections, not KERN's container grid", () => {
		const registry = project({
			"components/grid.json": {
				id: "grid",
				title: { en: "Grid System" },
				status: "deprecated",
				group: "layout",
				synonyms: { de: [] },
				links: {},
				implementations: {},
			},
		});
		const url = "https://www.kern-ux.de/komponenten/layout/hilfsklassen";

		expect(
			registry.components.filter((component) => component.id === "grid"),
		).toEqual([
			{
				id: "grid",
				title: "CSS Grid",
				status: "stable",
				links: { docs: `${url}#css-grid` },
				docs: {
					url: `${url}#css-grid`,
					summary: "kern-grid replaces kern-row.",
					sections: [
						{
							heading: "Heading beschreibung",
							url: `${url}#beschreibung`,
							summary: "kern-grid-cols-{n} sets the columns.",
						},
						{ heading: "Heading dos-and-donts", url: `${url}#dos-and-donts` },
					],
				},
			},
		]);
	});

	it("carries the foundations pages the guides quote, with their sections by ID", () => {
		const registry = project({
			"foundations/layout.json": {
				id: "layout",
				title: { en: "Layout", de: "Layout" },
				status: "documented",
				links: { docs: "https://www.kern-ux.de/layout" },
				docs: {
					url: "https://www.kern-ux.de/layout",
					summary: { en: "A mobile-first grid." },
					sections: [
						{
							id: "breakpoints",
							heading: "Breakpoints",
							url: "https://www.kern-ux.de/layout#breakpoints",
							summary: { en: "From 576 px up." },
						},
					],
				},
				knowledge: {
					summary: { en: "Short." },
					dos: [{ en: "Think mobile-first." }],
				},
			},
		});

		expect(registry.foundations.map((page) => page.id)).toEqual([
			...GUIDE_FOUNDATIONS,
		]);
		expect(registry.foundations.find((page) => page.id === "layout")).toEqual({
			id: "layout",
			title: "Layout",
			url: "https://www.kern-ux.de/layout",
			summary: "A mobile-first grid.",
			knowledge: { dos: ["Think mobile-first."] },
			sections: [
				{
					id: "breakpoints",
					heading: "Breakpoints",
					url: "https://www.kern-ux.de/layout#breakpoints",
					summary: "From 576 px up.",
				},
			],
		});
	});

	it("knows the classes the SCSS defines and KERN's examples use, with breakpoint variants collapsed", () => {
		const responsive = ["", "-sm", "-md", "-lg", "-xl", "-xxl"].map(
			(suffix) => ({
				class: `kern-flex-row${suffix}`,
				kind: "utility",
				owner: "",
			}),
		);
		const registry = project({
			"foundations/classes.json": {
				id: "classes",
				classes: [
					{ class: "kern-btn", kind: "component", owner: "button" },
					{ class: "kern-gap-lg", kind: "utility", owner: "" },
					{ class: "kern-gap-lg-md", kind: "utility", owner: "" },
					...responsive,
				],
			},
			"patterns/header.json": {
				id: "header",
				examples: [
					{
						...example("flex-header"),
						html: {
							markup: '<div class="kern-brand  kern-btn my-app"></div>',
							source: {
								repo: "kern-ux-plain",
								path: "stories/Pattern/Header.stories.js",
							},
						},
					},
				],
			},
		});

		expect(registry.classes).toEqual({
			exact: [
				"kern-brand",
				"kern-btn",
				"kern-details",
				"kern-flex-row",
				"kern-gap-lg",
				"kern-gap-lg-md",
				"kern-search-with-label",
				"kern-stack",
			],
			responsive: ["kern-flex-row"],
		});
	});

	it("needs a checked bundle", () => {
		const files = bundle();
		const utilities = files.get("foundations/utilities.json") as object;

		files.set("foundations/utilities.json", { ...utilities, examples: [] });
		expect(() => projectRegistry(files, TOKENS)).toThrow(
			"get_layers's example stack isn't in foundations/utilities.json; run checkKnowledgeBundle first.",
		);

		files.set("foundations/utilities.json", { ...utilities, docs: undefined });
		expect(() => projectRegistry(files, TOKENS)).toThrow(
			"get_grid's sections css-grid to dos-and-donts aren't in foundations/utilities.json; run checkKnowledgeBundle first.",
		);
	});
});
