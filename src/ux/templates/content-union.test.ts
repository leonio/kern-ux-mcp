import { describe, expect, it, vi } from "vitest";

import type { RecursiveContentNodeInput } from "../schemas/content-union.js";
import type { BuildResult } from "../types.js";
import {
	type RecursiveContentRenderOptions,
	renderRecursiveContentBlocks,
} from "./content-union.js";

const baseOptions: RecursiveContentRenderOptions = {
	locale: "de",
	currentDepth: 0,
	maxDepth: 4,
};

function stubRenderer(name: string) {
	return vi.fn(
		(_input: unknown, depth: number): BuildResult => ({
			html: `<${name} depth="${depth}"></${name}>`,
			warnings: [`${name} warning`],
		}),
	);
}

type RendererKey =
	| "renderCardNode"
	| "renderGridNode"
	| "renderSectionNode"
	| "renderDisclosureNode";

const NESTED_KINDS: Array<{
	label: string;
	rendererKey: RendererKey;
	block: RecursiveContentNodeInput;
	payload: unknown;
}> = [
	{
		label: "Card",
		rendererKey: "renderCardNode",
		block: { kind: "card", card: { header: { title: "Karte" } } },
		payload: { header: { title: "Karte" } },
	},
	{
		label: "Grid",
		rendererKey: "renderGridNode",
		block: { kind: "grid", grid: { columns: 2 } },
		payload: { columns: 2 },
	},
	{
		label: "Section",
		rendererKey: "renderSectionNode",
		block: { kind: "section", section: { headingText: "Abschnitt" } },
		payload: { headingText: "Abschnitt" },
	},
	{
		label: "Disclosure",
		rendererKey: "renderDisclosureNode",
		block: { kind: "disclosure", disclosure: { triggerLabel: "Mehr" } },
		payload: { triggerLabel: "Mehr" },
	},
];

describe("renderRecursiveContentBlocks", () => {
	it.each([undefined, []])("returns empty output for %j", (blocks) => {
		expect(renderRecursiveContentBlocks(blocks, baseOptions)).toEqual({
			html: "",
			warnings: [],
		});
	});

	it("escapes text blocks", () => {
		const result = renderRecursiveContentBlocks(
			[{ kind: "text", text: `<b>"A" & 'B'</b>` }],
			baseOptions,
		);

		expect(result.html).toBe(
			'<p class="kern-body">&lt;b&gt;&quot;A&quot; &amp; &#039;B&#039;&lt;/b&gt;</p>',
		);
	});

	it("passes html blocks through unchanged", () => {
		const result = renderRecursiveContentBlocks(
			[{ kind: "html", html: "<em>roh</em>" }],
			baseOptions,
		);

		expect(result.html).toBe("<em>roh</em>");
	});

	it("renders button and badge blocks with their builders", () => {
		const result = renderRecursiveContentBlocks(
			[
				{ kind: "button", button: { label: "Weiter" } },
				{ kind: "badge", badge: { type: "info", text: "Neu" } },
			],
			baseOptions,
		);

		expect(result.html).toContain("kern-btn");
		expect(result.html).toContain("Weiter");
		expect(result.html).toContain("kern-badge");
		expect(result.html).toContain("Neu");
	});

	it("joins rendered blocks in order", () => {
		const result = renderRecursiveContentBlocks(
			[
				{ kind: "html", html: "<i>1</i>" },
				{ kind: "html", html: "<i>2</i>" },
			],
			baseOptions,
		);

		expect(result.html).toBe("<i>1</i>\n      <i>2</i>");
	});

	describe.each(NESTED_KINDS)("$label nodes", ({
		label,
		rendererKey,
		block,
		payload,
	}) => {
		it("delegates to the renderer with depth + 1 and collects its warnings", () => {
			const renderer = stubRenderer(label.toLowerCase());
			const options: RecursiveContentRenderOptions = {
				...baseOptions,
				currentDepth: 1,
			};
			options[rendererKey] = renderer;
			const result = renderRecursiveContentBlocks([block], options);

			expect(renderer).toHaveBeenCalledOnce();
			expect(renderer).toHaveBeenCalledWith(payload, 2);
			expect(result.html).toBe(
				`<${label.toLowerCase()} depth="2"></${label.toLowerCase()}>`,
			);
			expect(result.warnings).toEqual([`${label.toLowerCase()} warning`]);
		});

		it("skips the node with a warning when no renderer is provided", () => {
			const result = renderRecursiveContentBlocks([block], baseOptions);

			expect(result.html).toBe("");
			expect(result.warnings).toEqual([
				`${label} content node was skipped because no ${label.toLowerCase()} renderer was provided.`,
			]);
		});

		it("skips the node with a warning at max depth, without calling the renderer", () => {
			const renderer = stubRenderer(label.toLowerCase());
			const options: RecursiveContentRenderOptions = {
				...baseOptions,
				currentDepth: 4,
			};
			options[rendererKey] = renderer;
			const result = renderRecursiveContentBlocks([block], options);

			expect(renderer).not.toHaveBeenCalled();
			expect(result.html).toBe("");
			expect(result.warnings).toEqual([
				`${label} content node was skipped because the max rendering depth (4) was reached.`,
			]);
		});
	});

	describe("section paragraphs shorthand", () => {
		it("converts paragraphs into text content blocks", () => {
			const renderSectionNode = stubRenderer("section");
			renderRecursiveContentBlocks(
				[
					{
						kind: "section",
						section: { headingText: "Abschnitt", paragraphs: ["A", "B"] },
					},
				],
				{ ...baseOptions, renderSectionNode },
			);

			expect(renderSectionNode).toHaveBeenCalledWith(
				{
					headingText: "Abschnitt",
					paragraphs: undefined,
					contentBlocks: [
						{ kind: "text", text: "A" },
						{ kind: "text", text: "B" },
					],
				},
				1,
			);
		});

		it("keeps explicit contentBlocks and ignores paragraphs", () => {
			const renderSectionNode = stubRenderer("section");
			const section = {
				headingText: "Abschnitt",
				paragraphs: ["ignoriert"],
				contentBlocks: [{ kind: "text" as const, text: "explizit" }],
			};
			renderRecursiveContentBlocks([{ kind: "section", section }], {
				...baseOptions,
				renderSectionNode,
			});

			expect(renderSectionNode).toHaveBeenCalledWith(section, 1);
		});
	});

	describe("formFlow nodes", () => {
		const formFlowBlock: RecursiveContentNodeInput = {
			kind: "formFlow",
			formFlow: {
				currentStep: 1,
				steps: [{ label: "Persönliche Daten" }, { label: "Nachweise" }],
			},
		};

		it("renders with the built-in form-flow builder", () => {
			const result = renderRecursiveContentBlocks([formFlowBlock], baseOptions);

			expect(result.html).toContain("Persönliche Daten");
			expect(result.html).toContain("Nachweise");
		});

		it("skips the node with a warning at max depth", () => {
			const result = renderRecursiveContentBlocks([formFlowBlock], {
				...baseOptions,
				currentDepth: 4,
			});

			expect(result.html).toBe("");
			expect(result.warnings).toEqual([
				"FormFlow content node was skipped because the max rendering depth (4) was reached.",
			]);
		});
	});
});
