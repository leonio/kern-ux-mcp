import type { RecursiveContentNodeInput } from "../schemas/content-union.js";
import type { BuildResult, Locale } from "../types.js";
import { buildBadge } from "./badge.js";
import { buildButton } from "./button.js";
import { buildFormFlow } from "./form-flow.js";

export type CardNodeRenderer = (
	cardInput: unknown,
	nextDepth: number,
) => BuildResult;
export type GridNodeRenderer = (
	gridInput: unknown,
	nextDepth: number,
) => BuildResult;
export type SectionNodeRenderer = (
	sectionInput: unknown,
	nextDepth: number,
) => BuildResult;
export type DisclosureNodeRenderer = (
	disclosureInput: unknown,
	nextDepth: number,
) => BuildResult;
export type FormFlowNodeRenderer = (
	formFlowInput: unknown,
	nextDepth: number,
) => BuildResult;

export type RecursiveContentRenderOptions = {
	locale: Locale;
	currentDepth: number;
	maxDepth: number;
	renderCardNode?: CardNodeRenderer;
	renderGridNode?: GridNodeRenderer;
	renderSectionNode?: SectionNodeRenderer;
	renderDisclosureNode?: DisclosureNodeRenderer;
	renderFormFlowNode?: FormFlowNodeRenderer;
};

export function renderRecursiveContentBlocks(
	blocks: RecursiveContentNodeInput[] | undefined,
	options: RecursiveContentRenderOptions,
): BuildResult {
	const warnings: string[] = [];
	const htmlParts: string[] = [];

	if (!blocks || blocks.length === 0) {
		return { html: "", warnings };
	}

	for (const block of blocks) {
		if (block.kind === "text") {
			htmlParts.push(`<p class="kern-body">${escapeHtml(block.text)}</p>`);
			continue;
		}

		if (block.kind === "html") {
			htmlParts.push(block.html);
			continue;
		}

		if (block.kind === "button") {
			const buttonResult = buildButton(block.button, options.locale);
			htmlParts.push(buttonResult.html);
			warnings.push(...buttonResult.warnings);
			continue;
		}

		if (block.kind === "badge") {
			const badgeResult = buildBadge(block.badge, options.locale);
			htmlParts.push(badgeResult.html);
			warnings.push(...badgeResult.warnings);
			continue;
		}

		if (block.kind === "card") {
			const nextDepth = options.currentDepth + 1;
			if (options.currentDepth >= options.maxDepth) {
				warnings.push(
					`Card content node was skipped because the max rendering depth (${options.maxDepth}) was reached.`,
				);
				continue;
			}
			if (!options.renderCardNode) {
				warnings.push(
					"Card content node was skipped because no card renderer was provided.",
				);
				continue;
			}

			const cardResult = options.renderCardNode(block.card, nextDepth);
			htmlParts.push(cardResult.html);
			warnings.push(...cardResult.warnings);
			continue;
		}

		if (block.kind === "grid") {
			const nextDepth = options.currentDepth + 1;
			if (options.currentDepth >= options.maxDepth) {
				warnings.push(
					`Grid content node was skipped because the max rendering depth (${options.maxDepth}) was reached.`,
				);
				continue;
			}
			if (!options.renderGridNode) {
				warnings.push(
					"Grid content node was skipped because no grid renderer was provided.",
				);
				continue;
			}

			const gridResult = options.renderGridNode(block.grid, nextDepth);
			htmlParts.push(gridResult.html);
			warnings.push(...gridResult.warnings);
			continue;
		}

		if (block.kind === "section") {
			const nextDepth = options.currentDepth + 1;
			if (options.currentDepth >= options.maxDepth) {
				warnings.push(
					`Section content node was skipped because the max rendering depth (${options.maxDepth}) was reached.`,
				);
				continue;
			}
			if (!options.renderSectionNode) {
				warnings.push(
					"Section content node was skipped because no section renderer was provided.",
				);
				continue;
			}

			// Normalize paragraphs shorthand → contentBlocks with kind: "text"
			const sectionInput = { ...block.section } as Record<string, unknown>;
			const paragraphs = sectionInput.paragraphs as string[] | undefined;
			if (
				Array.isArray(paragraphs) &&
				paragraphs.length > 0 &&
				(!Array.isArray(sectionInput.contentBlocks) ||
					(sectionInput.contentBlocks as unknown[]).length === 0)
			) {
				sectionInput.contentBlocks = paragraphs.map((text: string) => ({
					kind: "text" as const,
					text,
				}));
				sectionInput.paragraphs = undefined;
			}

			const sectionResult = options.renderSectionNode(sectionInput, nextDepth);
			htmlParts.push(sectionResult.html);
			warnings.push(...sectionResult.warnings);
			continue;
		}

		if (block.kind === "disclosure") {
			const nextDepth = options.currentDepth + 1;
			if (options.currentDepth >= options.maxDepth) {
				warnings.push(
					`Disclosure content node was skipped because the max rendering depth (${options.maxDepth}) was reached.`,
				);
				continue;
			}
			if (!options.renderDisclosureNode) {
				warnings.push(
					"Disclosure content node was skipped because no disclosure renderer was provided.",
				);
				continue;
			}

			const disclosureResult = options.renderDisclosureNode(
				block.disclosure,
				nextDepth,
			);
			htmlParts.push(disclosureResult.html);
			warnings.push(...disclosureResult.warnings);
			continue;
		}

		if (block.kind === "formFlow") {
			const nextDepth = options.currentDepth + 1;
			if (options.currentDepth >= options.maxDepth) {
				warnings.push(
					`FormFlow content node was skipped because the max rendering depth (${options.maxDepth}) was reached.`,
				);
				continue;
			}

			const formFlowResult = buildFormFlow(block.formFlow, options.locale, {
				depth: nextDepth,
				maxDepth: options.maxDepth,
				renderCardNode: options.renderCardNode,
				renderGridNode: options.renderGridNode,
				renderSectionNode: options.renderSectionNode,
				renderDisclosureNode: options.renderDisclosureNode,
			});
			htmlParts.push(formFlowResult.html);
			warnings.push(...formFlowResult.warnings);
		}
	}

	return {
		html: htmlParts.join("\n      "),
		warnings,
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
