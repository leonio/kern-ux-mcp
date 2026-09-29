import {
	MAX_RECURSIVE_CONTENT_DEPTH,
	type RecursiveContentNodeInput,
} from "../schemas/content-union.js";
import type { BuildResult, Locale } from "../types.js";
import { buildBadge } from "./badge.js";
import { buildButton } from "./button.js";
import { buildCard } from "./card.js";
import { buildDisclosure } from "./disclosure.js";
import { buildField } from "./field.js";
import { buildFieldset } from "./fieldset.js";
import { buildForm } from "./form.js";
import { buildFormFlow } from "./form-flow.js";
import { buildGrid } from "./grid.js";
import { buildSection } from "./section.js";

/** Renders content blocks. Every container recurses through the same renderer. */
export type CompositionRenderer = {
	readonly locale: Locale;
	/**
	 * Renders blocks that sit `depth` levels deep: 1 for a tool's own blocks,
	 * 2 for the blocks inside one of those, and so on.
	 */
	renderBlocks(
		blocks: readonly RecursiveContentNodeInput[] | undefined,
		depth: number,
	): BuildResult;
};

/**
 * Where a container sits: the renderer for its blocks, and its own depth
 * (0 for a container rendered on its own, its block depth inside a composition).
 */
export type BlockContext = {
	renderer: CompositionRenderer;
	depth: number;
};

type SectionBlock = Extract<
	RecursiveContentNodeInput,
	{ kind: "section" }
>["section"];

export function createCompositionRenderer(locale: Locale): CompositionRenderer {
	const renderer: CompositionRenderer = {
		locale,
		renderBlocks: (blocks, depth) => renderBlocks(renderer, blocks, depth),
	};
	return renderer;
}

/** The context of a container rendered on its own, outside any composition. */
export function standaloneContext(locale: Locale): BlockContext {
	return { renderer: createCompositionRenderer(locale), depth: 0 };
}

function renderBlocks(
	renderer: CompositionRenderer,
	blocks: readonly RecursiveContentNodeInput[] | undefined,
	depth: number,
): BuildResult {
	if (!blocks || blocks.length === 0) {
		return { html: "", warnings: [] };
	}

	// The schema rejects deeper trees; this guards direct calls to the builders.
	if (depth > MAX_RECURSIVE_CONTENT_DEPTH) {
		return {
			html: "",
			warnings: [
				`${blocks.length} content block(s) at depth ${depth} were skipped: the maximum nesting depth is ${MAX_RECURSIVE_CONTENT_DEPTH}.`,
			],
		};
	}

	const context: BlockContext = { renderer, depth };
	const results = blocks.map((block) => renderBlock(block, context));

	return {
		html: results.map((result) => result.html).join("\n      "),
		warnings: results.flatMap((result) => result.warnings),
	};
}

function renderBlock(
	block: RecursiveContentNodeInput,
	context: BlockContext,
): BuildResult {
	const { locale } = context.renderer;

	switch (block.kind) {
		case "text":
			return {
				html: `<p class="kern-body">${escapeHtml(block.text)}</p>`,
				warnings: [],
			};
		case "html":
			return { html: block.html, warnings: [] };
		case "button":
			return buildButton(block.button, locale);
		case "badge":
			return buildBadge(block.badge, locale);
		case "field":
			return buildField(block.field, locale);
		case "fieldset":
			return buildFieldset(block.fieldset, locale, context);
		case "form":
			return buildForm(block.form, locale, context);
		case "card":
			return buildCard(block.card, locale, context);
		case "grid":
			return buildGrid(block.grid, locale, context);
		case "section":
			return buildSection(withParagraphBlocks(block.section), locale, context);
		case "disclosure":
			return buildDisclosure(block.disclosure, locale, context);
		case "formFlow":
			return buildFormFlow(block.formFlow, locale, context);
	}
}

/** Turns the `paragraphs` shorthand into text blocks, unless `contentBlocks` is set. */
function withParagraphBlocks(section: SectionBlock): SectionBlock {
	const { paragraphs, contentBlocks } = section;
	if (!paragraphs?.length || contentBlocks?.length) {
		return section;
	}

	return {
		...section,
		paragraphs: undefined,
		contentBlocks: paragraphs.map((text) => ({ kind: "text", text })),
	};
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
