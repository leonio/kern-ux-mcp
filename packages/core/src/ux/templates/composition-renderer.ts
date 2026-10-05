import { HTMLElement, parse } from "node-html-parser";
import { t } from "../i18n.js";
import {
	MAX_RECURSIVE_CONTENT_DEPTH,
	type RecursiveContentNodeInput,
	type SummaryBlockInput,
} from "../schemas/content-union.js";
import type { BuildResult, Locale } from "../types.js";
import { buildBadge } from "./badge.js";
import { buildButton } from "./button.js";
import { buildCard } from "./card.js";
import { buildDisclosure } from "./disclosure.js";
import { escapeHtml } from "./escape.js";
import { buildField } from "./field.js";
import { buildFieldset } from "./fieldset.js";
import { buildForm } from "./form.js";
import { buildFormFlow } from "./form-flow.js";
import { buildGrid } from "./grid.js";
import { buildSection } from "./section.js";
import { buildSummary } from "./summary.js";

/** Renders content blocks. Every container recurses through the same renderer. */
export type CompositionRenderer = {
	readonly locale: Locale;
	/**
	 * Renders blocks that sit `depth` levels deep: 1 for a tool's own blocks,
	 * 2 for the blocks inside one of those, and so on. `inContainer` says a
	 * kern-container already surrounds them; `stacked` says they are the items of
	 * a flex column (STACK_CLASSES).
	 */
	renderBlocks(
		blocks: readonly RecursiveContentNodeInput[] | undefined,
		depth: number,
		options?: { inContainer?: boolean; stacked?: boolean },
	): BuildResult;
};

/**
 * Where a container sits: the renderer for its blocks, its own depth (0 for a
 * container rendered on its own, its block depth inside a composition), and
 * whether a kern-container already surrounds it (render_page's main, a grid).
 */
export type BlockContext = {
	renderer: CompositionRenderer;
	depth: number;
	inContainer: boolean;
};

type SectionBlock = Extract<
	RecursiveContentNodeInput,
	{ kind: "section" }
>["section"];

export function createCompositionRenderer(locale: Locale): CompositionRenderer {
	const renderer: CompositionRenderer = {
		locale,
		renderBlocks: (blocks, depth, options) =>
			renderBlocks(
				renderer,
				blocks,
				depth,
				options?.inContainer ?? false,
				options?.stacked ?? false,
			),
	};
	return renderer;
}

/** The context of a container rendered on its own, outside any composition. */
export function standaloneContext(locale: Locale): BlockContext {
	return {
		renderer: createCompositionRenderer(locale),
		depth: 0,
		inContainer: false,
	};
}

/** Renders a container's own blocks, one level below it and in its layout. */
export function renderChildBlocks(
	context: BlockContext,
	blocks: readonly RecursiveContentNodeInput[] | undefined,
	options: { inContainer?: boolean; stacked?: boolean } = {},
): BuildResult {
	return context.renderer.renderBlocks(blocks, context.depth + 1, {
		inContainer: options.inContainer ?? context.inContainer,
		stacked: options.stacked,
	});
}

/**
 * Whether hand-written HTML has a kern-grid among its top-level elements. KERN
 * drops a kern-container's padding when a kern-grid is its direct child, so
 * such a block gets a div of its own: in render_page's main, the page keeps
 * its inset.
 */
function hasTopLevelGrid(html: string): boolean {
	return parse(html).childNodes.some(
		(node) =>
			node instanceof HTMLElement && node.classList.contains("kern-grid"),
	);
}

/** Blocks whose element is inline-level: a flex column would stretch it to full width. */
const INLINE_KINDS: ReadonlySet<RecursiveContentNodeInput["kind"]> = new Set([
	"button",
	"badge",
]);

function renderBlocks(
	renderer: CompositionRenderer,
	blocks: readonly RecursiveContentNodeInput[] | undefined,
	depth: number,
	inContainer: boolean,
	stacked: boolean,
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

	const context: BlockContext = { renderer, depth, inContainer };
	const results = blocks.map((block) => {
		const result = renderBlock(block, context);
		return stacked && INLINE_KINDS.has(block.kind)
			? { ...result, html: `<div>${result.html}</div>` }
			: result;
	});

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
			return {
				html: hasTopLevelGrid(block.html)
					? `<div>${block.html}</div>`
					: block.html,
				warnings: [],
			};
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
		case "summary":
			return buildSummaryBlock(block.summary, locale);
	}
}

const SUMMARY_TITLE = { de: "Ihre Angaben", en: "Your answers" };

/** A summary block as get_summary's group: numbered summaries, edit links labelled by default. */
function buildSummaryBlock(
	summary: SummaryBlockInput,
	locale: Locale,
): BuildResult {
	return buildSummary(
		{
			mode: "group",
			groupTitle: summary.title ?? t(locale, SUMMARY_TITLE),
			summaries: summary.summaries.map((entry, index) => ({
				number: index + 1,
				title: entry.title,
				items: entry.items,
				action: entry.editHref ? { href: entry.editHref } : undefined,
			})),
		},
		locale,
	);
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
