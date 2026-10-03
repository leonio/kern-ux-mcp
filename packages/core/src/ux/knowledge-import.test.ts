import { describe, expect, it } from "vitest";

import {
	checkKnowledgeBundle,
	describeKnowledgeBundle,
	diffKnowledgeBundles,
	findBundleExample,
	formatKnowledgeImport,
} from "./knowledge-import.js";
import { COMPONENT_TOOL_IDS } from "./tool-builders/component-tools.js";

/** KERN IDs for a few of our components, so the fixture exercises the map. */
const KERN_IDS: Record<string, string> = {
	checkbox: "checkboxes",
	radio: "radios",
	lists: "list",
	inputtext: "input-text",
	tasklist: "task-list",
};

const example = (id: string) => ({
	id,
	html: {
		markup: `<div class="kern-${id}"></div>`,
		source: { repo: "kern-ux-plain", path: "stories/x.stories.js" },
	},
});

/**
 * The smallest bundle that passes: one component per component tool, the
 * utilities and the header pattern for layers and pattern, and the picked
 * examples, one of them in a separate examples file.
 */
function bundle(): Map<string, unknown> {
	const files = new Map<string, unknown>();
	const components = COMPONENT_TOOL_IDS.filter(
		(id) => id !== "layers" && id !== "pattern",
	).map((id) => KERN_IDS[id] ?? id);

	for (const kernId of components) {
		files.set(`components/${kernId}.json`, { id: kernId, status: "stable" });
	}
	files.set("components/details.json", {
		id: "details",
		status: "stable",
		examples: [example("details")],
	});
	files.set("components/search.json", {
		id: "search",
		status: "stable",
		examples: [example("search-without-label")],
		moreExamples: { file: "search.examples.json", count: 1 },
	});
	files.set("components/search.examples.json", {
		component: "search",
		examples: [example("search-with-label")],
	});
	files.set("foundations/utilities.json", {
		id: "utilities",
		examples: [example("stack")],
	});
	files.set("patterns/header.json", {
		id: "header",
		examples: [example("flex-header")],
	});
	files.set("index.json", {
		bundleVersion: "0.2.0",
		components: components.map((id) => ({
			id,
			title: id,
			file: `components/${id}.json`,
		})),
		patterns: [{ id: "header", title: "Header", file: "patterns/header.json" }],
		foundations: [
			{
				id: "utilities",
				title: "Utilities",
				file: "foundations/utilities.json",
			},
		],
	});
	return files;
}

type Index = {
	bundleVersion: string;
	components: Array<{ id: string; title: string; file: string }>;
};

/** A bundle changed by `edit`, with the index at hand. */
function bundleWith(
	edit: (files: Map<string, unknown>, index: Index) => void,
): Map<string, unknown> {
	const files = bundle();
	edit(files, files.get("index.json") as Index);
	return files;
}

describe("checkKnowledgeBundle", () => {
	it("finds nothing wrong with a complete bundle", () => {
		expect(checkKnowledgeBundle(bundle())).toEqual([]);
	});

	it("needs an index", () => {
		const files = bundle();
		files.delete("index.json");

		expect(checkKnowledgeBundle(files)).toEqual(["index.json is missing."]);
	});

	it("reads only its own major version", () => {
		const files = bundleWith((_files, index) => {
			index.bundleVersion = "1.0.0";
		});

		expect(checkKnowledgeBundle(files)).toEqual([
			"index.json has bundleVersion 1.0.0, but this repo reads major 0.",
		]);
	});

	it("reports files the index lists but the bundle lacks", () => {
		const files = bundleWith((files) => {
			files.delete("foundations/utilities.json");
		});

		expect(checkKnowledgeBundle(files)).toEqual([
			"index.json lists foundations/utilities.json, which isn't in the bundle.",
			"get_layers returns the example stack, which isn't in foundations/utilities.json.",
		]);
	});

	it("reports a status the tools don't know", () => {
		const files = bundleWith((files) => {
			files.set("components/badge.json", { id: "badge", status: "beta" });
		});

		expect(checkKnowledgeBundle(files)).toEqual([
			'components/badge.json has status "beta", which the tools don\'t know.',
		]);
	});

	it("reports a component tool without a component", () => {
		const files = bundleWith((files, index) => {
			files.delete("components/input-text.json");
			index.components = index.components.filter((c) => c.id !== "input-text");
		});

		expect(checkKnowledgeBundle(files)).toEqual([
			"get_inputtext has no component in the bundle.",
		]);
	});

	it("reports KERN IDs that map to the same ID of ours", () => {
		const files = bundleWith((files, index) => {
			files.set("components/inputtext.json", {
				id: "inputtext",
				status: "stable",
			});
			index.components.push({
				id: "inputtext",
				title: "Input Text",
				file: "components/inputtext.json",
			});
		});

		expect(checkKnowledgeBundle(files)).toEqual([
			"The KERN IDs input-text, inputtext all map to inputtext.",
		]);
	});

	it("reports a picked example that's gone", () => {
		const files = bundleWith((files) => {
			files.set("components/details.json", {
				id: "details",
				status: "stable",
				examples: [example("details-open")],
			});
		});

		expect(checkKnowledgeBundle(files)).toEqual([
			"get_details returns the example details, which isn't in components/details.json.",
		]);
	});

	it("accepts docs-only components without a tool", () => {
		const files = bundleWith((files, index) => {
			files.set("components/tabs.json", { id: "tabs", status: "docs-only" });
			index.components.push({
				id: "tabs",
				title: "Tabs",
				file: "components/tabs.json",
			});
		});

		expect(checkKnowledgeBundle(files)).toEqual([]);
	});
});

describe("findBundleExample", () => {
	it("finds an example in the document", () => {
		expect(
			findBundleExample(bundle(), {
				document: "components/search.json",
				example: "search-without-label",
			})?.id,
		).toBe("search-without-label");
	});

	it("finds an example the document moved to its examples file", () => {
		expect(
			findBundleExample(bundle(), {
				document: "components/search.json",
				example: "search-with-label",
			})?.id,
		).toBe("search-with-label");
	});

	it("finds nothing in a document that isn't there", () => {
		expect(
			findBundleExample(bundle(), {
				document: "components/nope.json",
				example: "nope",
			}),
		).toBeUndefined();
	});
});

describe("diffKnowledgeBundles", () => {
	const files = (entries: Record<string, unknown>) =>
		new Map(Object.entries(entries));

	it("names added and removed files", () => {
		const diff = diffKnowledgeBundles(
			files({ "components/a.json": {}, "components/b.json": {} }),
			files({ "components/b.json": {}, "components/c.json": {} }),
		);

		expect(diff).toEqual({
			added: ["components/c.json"],
			removed: ["components/a.json"],
			changed: [],
		});
	});

	it("describes changes two levels deep", () => {
		const diff = diffKnowledgeBundles(
			files({
				"components/grid.json": {
					status: "stable",
					title: { en: "Grid", de: "Grid" },
					knowledge: { dos: [{ en: "a" }], donts: [{ en: "b" }] },
					examples: [{ id: "x" }],
					docs: { sections: [{ id: "s", summary: { en: "old" } }] },
				},
			}),
			files({
				"components/grid.json": {
					status: "deprecated",
					title: { en: "Grid System", de: "Grid" },
					knowledge: {
						dos: [{ en: "a" }, { en: "c" }],
						donts: [{ en: "b2" }],
						whenToUse: [{ en: "d" }],
					},
					examples: [{ id: "x" }],
					docs: { sections: [{ id: "s", summary: { en: "new" } }] },
				},
			}),
		);

		expect(diff.changed).toEqual([
			{
				file: "components/grid.json",
				changes: [
					"docs.sections",
					"knowledge.donts",
					"knowledge.dos (1 -> 2 items)",
					"knowledge.whenToUse (new)",
					'status: "stable" -> "deprecated"',
					'title.en: "Grid" -> "Grid System"',
				],
			},
		]);
	});

	it("ignores key order and the index's generatedAt", () => {
		const diff = diffKnowledgeBundles(
			files({
				"index.json": {
					bundleVersion: "0.2.0",
					generatedAt: "2026-10-03T08:00:00Z",
				},
				"components/a.json": { id: "a", status: "stable" },
			}),
			files({
				"index.json": {
					generatedAt: "2026-10-04T09:00:00Z",
					bundleVersion: "0.2.0",
				},
				"components/a.json": { status: "stable", id: "a" },
			}),
		);

		expect(diff.changed).toEqual([]);
	});

	it("reports a key that's gone", () => {
		const diff = diffKnowledgeBundles(
			files({ "components/a.json": { id: "a", group: "form" } }),
			files({ "components/a.json": { id: "a" } }),
		);

		expect(diff.changed).toEqual([
			{ file: "components/a.json", changes: ["group (gone)"] },
		]);
	});
});

describe("describeKnowledgeBundle", () => {
	it("summarises the index and the packer's report", () => {
		const files = bundle();
		Object.assign(files.get("index.json") as object, { kernVersion: "2.8.2" });
		files.set("report.json", {
			text: { reviewed: 929, stale: null, missing: ["a", "b"], problems: null },
			drift: [{}, {}, {}],
		});

		expect(describeKnowledgeBundle(files)).toEqual([
			`Bundle 0.2.0 (KERN 2.8.2): ${COMPONENT_TOOL_IDS.length - 2} components, 1 foundations, 1 patterns.`,
			"Text: 929 reviewed, 0 stale, 2 missing, 0 problems. Drift: 3 items.",
		]);
	});

	it("says nothing without an index", () => {
		expect(describeKnowledgeBundle(new Map())).toEqual([]);
	});
});

describe("formatKnowledgeImport", () => {
	const header = (files: Map<string, unknown>) =>
		describeKnowledgeBundle(files).join("\n");

	it("lists the problems that stop an import", () => {
		const files = bundle();

		expect(formatKnowledgeImport(files, undefined, ["one", "two"])).toBe(
			[
				header(files),
				"",
				"The bundle can't be imported (2 problems):",
				"  one",
				"  two",
			].join("\n"),
		);
	});

	it("counts the files of a first import", () => {
		const files = bundle();

		expect(formatKnowledgeImport(files, undefined, [])).toBe(
			[header(files), "", `First import: ${files.size} files.`].join("\n"),
		);
	});

	it("says when nothing changed", () => {
		expect(formatKnowledgeImport(bundle(), bundle(), [])).toBe(
			[header(bundle()), "", "No changes."].join("\n"),
		);
	});

	it("lists what changed, file by file", () => {
		const previous = bundle();
		const next = bundleWith((files) => {
			files.set("components/badge.json", { id: "badge", status: "deprecated" });
			files.set("components/new.json", { id: "new", status: "docs-only" });
			files.delete("components/search.examples.json");
		});

		expect(formatKnowledgeImport(next, previous, [])).toBe(
			[
				header(next),
				"",
				"Added: components/new.json",
				"Removed: components/search.examples.json",
				"Changed:",
				"  components/badge.json",
				'    status: "stable" -> "deprecated"',
			].join("\n"),
		);
	});
});
