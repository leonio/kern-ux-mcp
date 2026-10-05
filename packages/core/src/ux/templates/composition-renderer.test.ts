import { describe, expect, it } from "vitest";

import {
	RecursiveContentBlocksSchema,
	type RecursiveContentNodeInput,
} from "../schemas/content-union.js";
import type { BuildResult } from "../types.js";
import { buildCard } from "./card.js";
import { createCompositionRenderer } from "./composition-renderer.js";
import { buildDisclosure } from "./disclosure.js";
import { buildFieldset } from "./fieldset.js";
import { buildForm } from "./form.js";
import { buildFormFlow } from "./form-flow.js";
import { buildGrid } from "./grid.js";
import { buildSection } from "./section.js";

const renderer = createCompositionRenderer("de");

type ContainerKind =
	| "card"
	| "grid"
	| "section"
	| "disclosure"
	| "fieldset"
	| "form"
	| "formFlow";

const CONTAINER_KINDS: ContainerKind[] = [
	"card",
	"grid",
	"section",
	"disclosure",
	"fieldset",
	"form",
	"formFlow",
];

/** One block of every kind, each showing `marker` somewhere in its HTML. */
function leaf(
	kind: RecursiveContentNodeInput["kind"],
	marker: string,
): RecursiveContentNodeInput {
	switch (kind) {
		case "text":
			return { kind, text: marker };
		case "html":
			return { kind, html: `<p>${marker}</p>` };
		case "button":
			return { kind, button: { label: marker } };
		case "badge":
			return { kind, badge: { type: "info", text: marker } };
		case "field":
			return { kind, field: { type: "text", name: "feld", label: marker } };
		default:
			return wrap(kind, { kind: "text", text: marker });
	}
}

/** A container of `kind` holding `child`. */
function wrap(
	kind: ContainerKind,
	child: RecursiveContentNodeInput,
): RecursiveContentNodeInput {
	switch (kind) {
		case "card":
			return {
				kind,
				card: { header: { title: "Karte" }, contentBlocks: [child] },
			};
		case "grid":
			return { kind, grid: { columns: 1, columnsContent: [[child]] } };
		case "section":
			return {
				kind,
				section: { headingText: "Abschnitt", contentBlocks: [child] },
			};
		case "disclosure":
			return {
				kind,
				disclosure: { triggerLabel: "Mehr", contentBlocks: [child] },
			};
		case "fieldset":
			return {
				kind,
				fieldset: { legend: "Gruppe", contentBlocks: [child] },
			};
		case "form":
			return { kind, form: { contentBlocks: [child] } };
		case "formFlow":
			return {
				kind,
				formFlow: {
					currentStep: 1,
					steps: [
						{ label: "Schritt 1", contentBlocks: [child] },
						{ label: "Schritt 2" },
					],
				},
			};
	}
}

/** Renders `child` through the standalone builder of a container. */
function renderStandalone(
	kind: ContainerKind,
	child: RecursiveContentNodeInput,
): BuildResult {
	const contentBlocks = [child];
	switch (kind) {
		case "card":
			return buildCard({ contentBlocks }, "de");
		case "grid":
			return buildGrid({ columns: 1, columnsContent: [contentBlocks] }, "de");
		case "section":
			return buildSection({ headingText: "Abschnitt", contentBlocks }, "de");
		case "disclosure":
			return buildDisclosure({ triggerLabel: "Mehr", contentBlocks }, "de");
		case "fieldset":
			return buildFieldset({ legend: "Gruppe", contentBlocks }, "de");
		case "form":
			return buildForm({ contentBlocks }, "de");
		case "formFlow":
			return buildFormFlow(
				{
					currentStep: 1,
					steps: [
						{ label: "Schritt 1", contentBlocks },
						{ label: "Schritt 2" },
					],
				},
				"de",
			);
	}
}

const ALL_KINDS: RecursiveContentNodeInput["kind"][] = [
	"text",
	"html",
	"button",
	"badge",
	"field",
	...CONTAINER_KINDS,
];

const FORM_KINDS = new Set<string>(["form", "formFlow"]);

/** Why the schema rejects outer > inner > child, if it does. */
function nestingRule(
	outer: ContainerKind,
	inner: ContainerKind,
	child: RecursiveContentNodeInput["kind"],
): string | undefined {
	const chain = [outer, inner, child];
	if (chain.filter((kind) => FORM_KINDS.has(kind)).length > 1) {
		return "forms don't nest";
	}
	if (
		(outer === "card" && inner === "card") ||
		(inner === "card" && child === "card")
	) {
		return "A card can't sit directly inside another card";
	}
	return undefined;
}

const ALL_NESTINGS = CONTAINER_KINDS.flatMap((outer) =>
	CONTAINER_KINDS.flatMap((inner) =>
		ALL_KINDS.map((child) => ({
			outer,
			inner,
			child,
			rule: nestingRule(outer, inner, child),
		})),
	),
);
const NESTINGS = ALL_NESTINGS.filter(({ rule }) => rule === undefined);
const REJECTED_NESTINGS = ALL_NESTINGS.filter(({ rule }) => rule !== undefined);

function expectRendered(result: BuildResult, marker: string): void {
	expect(result.html).toContain(marker);
	expect(result.warnings.join("\n")).not.toContain("skipped");
}

describe("createCompositionRenderer", () => {
	it.each([undefined, []])("returns empty output for %j", (blocks) => {
		expect(renderer.renderBlocks(blocks, 1)).toEqual({
			html: "",
			warnings: [],
		});
	});

	it("escapes text blocks", () => {
		const result = renderer.renderBlocks(
			[{ kind: "text", text: `<b>"A" & 'B'</b>` }],
			1,
		);

		expect(result.html).toBe(
			'<p class="kern-body">&lt;b&gt;&quot;A&quot; &amp; &#039;B&#039;&lt;/b&gt;</p>',
		);
	});

	it("passes html blocks through unchanged", () => {
		const result = renderer.renderBlocks(
			[{ kind: "html", html: "<em>roh</em>" }],
			1,
		);

		expect(result.html).toBe("<em>roh</em>");
	});

	it("renders button and badge blocks with their builders", () => {
		const result = renderer.renderBlocks(
			[
				{ kind: "button", button: { label: "Weiter" } },
				{ kind: "badge", badge: { type: "info", text: "Neu" } },
			],
			1,
		);

		expect(result.html).toContain("kern-btn");
		expect(result.html).toContain("Weiter");
		expect(result.html).toContain("kern-badge");
		expect(result.html).toContain("Neu");
	});

	it("joins rendered blocks in order", () => {
		const result = renderer.renderBlocks(
			[
				{ kind: "html", html: "<i>1</i>" },
				{ kind: "html", html: "<i>2</i>" },
			],
			1,
		);

		expect(result.html).toBe("<i>1</i>\n      <i>2</i>");
	});

	it("renders in the renderer's locale", () => {
		const result = createCompositionRenderer("en").renderBlocks(
			[leaf("formFlow", "Step")],
			1,
		);

		expect(result.html).toContain("Step 1 of 2");
	});

	describe("depth", () => {
		it("renders blocks down to the maximum depth", () => {
			const tree = wrap(
				"card",
				wrap("grid", wrap("section", leaf("text", "Tief"))),
			);

			expectRendered(renderer.renderBlocks([tree], 1), "Tief");
		});

		it("skips blocks below the maximum depth with a warning", () => {
			const result = renderer.renderBlocks([leaf("text", "Zu tief")], 5);

			expect(result.html).toBe("");
			expect(result.warnings).toEqual([
				"1 content block(s) at depth 5 were skipped: the maximum nesting depth is 4.",
			]);
		});

		it("counts a standalone container as depth 0, like the tool schemas do", () => {
			const blocks = [
				wrap(
					"grid",
					wrap("section", wrap("disclosure", leaf("text", "Ebene 4"))),
				),
			];

			expect(RecursiveContentBlocksSchema.safeParse(blocks).success).toBe(true);
			expectRendered(buildCard({ contentBlocks: blocks }, "de"), "Ebene 4");
		});

		it("passes the container's depth on to its blocks", () => {
			const result = buildCard(
				{ contentBlocks: [leaf("text", "Zu tief")] },
				"de",
				{ renderer, depth: 4, inContainer: false },
			);

			expect(result.html).not.toContain("Zu tief");
			expect(result.warnings).toContain(
				"1 content block(s) at depth 5 were skipped: the maximum nesting depth is 4.",
			);
		});
	});

	describe("containers", () => {
		const containers = (html: string) =>
			html.match(/class="kern-container(-fluid)?"/g) ?? [];

		it("gives a grid its own container when nothing surrounds it", () => {
			const result = renderer.renderBlocks([leaf("grid", "Zelle")], 1);

			expect(containers(result.html)).toEqual(['class="kern-container"']);
		});

		it("gives a grid inside another grid no container of its own", () => {
			const result = renderer.renderBlocks(
				[wrap("grid", wrap("section", leaf("grid", "Innen")))],
				1,
			);

			expect(containers(result.html)).toHaveLength(1);
			expect(result.html).toContain("Innen");
		});

		it("renders no container inside a surrounding one, and says containerFluid is ignored", () => {
			const result = renderer.renderBlocks(
				[
					{
						kind: "grid",
						grid: {
							columns: 1,
							containerFluid: true,
							columnsContent: [[{ kind: "text", text: "x" }]],
						},
					},
				],
				1,
				{ inContainer: true },
			);

			expect(containers(result.html)).toEqual([]);
			expect(result.html).toContain(
				'<div>\n  <div class="kern-grid kern-grid-cols-1 kern-gap-lg">',
			);
			expect(result.warnings).toContain(
				"containerFluid is ignored: this grid already sits inside a container.",
			);
		});
	});

	describe("section paragraphs shorthand", () => {
		it("renders paragraphs as text blocks", () => {
			const result = renderer.renderBlocks(
				[
					{
						kind: "section",
						section: { headingText: "Abschnitt", paragraphs: ["A", "B"] },
					},
				],
				1,
			);

			expect(result.html).toContain('<p class="kern-body">A</p>');
			expect(result.html).toContain('<p class="kern-body">B</p>');
		});

		it("keeps explicit contentBlocks and ignores paragraphs", () => {
			const result = renderer.renderBlocks(
				[
					{
						kind: "section",
						section: {
							headingText: "Abschnitt",
							paragraphs: ["ignoriert"],
							contentBlocks: [{ kind: "text", text: "explizit" }],
						},
					},
				],
				1,
			);

			expect(result.html).toContain("explizit");
			expect(result.html).not.toContain("ignoriert");
		});
	});

	// Before the shared renderer, what rendered depended on where a block sat:
	// e.g. a grid inside a grid dropped its sections, and get_grid dropped all.
	describe("nesting matrix", () => {
		it.each(NESTINGS)(
			"renders $child in $inner in $outer inside a composition",
			({ outer, inner, child }) => {
				const blocks = [wrap(outer, wrap(inner, leaf(child, "MARKER")))];

				expect(RecursiveContentBlocksSchema.safeParse(blocks).success).toBe(
					true,
				);
				expectRendered(renderer.renderBlocks(blocks, 1), "MARKER");
			},
		);

		it.each(NESTINGS)(
			"renders $child in $inner in a standalone $outer",
			({ outer, inner, child }) => {
				expectRendered(
					renderStandalone(outer, wrap(inner, leaf(child, "MARKER"))),
					"MARKER",
				);
			},
		);

		it.each(REJECTED_NESTINGS)(
			"rejects $child in $inner in $outer ($rule)",
			({ outer, inner, child, rule }) => {
				const blocks = [wrap(outer, wrap(inner, leaf(child, "MARKER")))];
				const parsed = RecursiveContentBlocksSchema.safeParse(blocks);

				expect(parsed.success).toBe(false);
				expect(
					parsed.error?.issues.map((issue) => issue.message),
				).toContainEqual(expect.stringContaining(rule ?? ""));
			},
		);
	});
});
