import { z } from "zod";
import { contentBlocksSchema, simpleBlocksSchema } from "./content-union.js";
import { McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

/**
 * What buildDisclosure parses: expand/collapse with native <details>/<summary>
 * and KERN accordion styling. A disclosure block in render_composition can hold
 * any block, so this takes the full content union; the get_disclosure tool
 * takes DisclosureSchema.
 */
export const DisclosureRenderSchema = z
	.object({
		...CommonParams,
		triggerLabel: z
			.string()
			.min(1)
			.describe("Text of the <summary> that opens it."),
		contentBlocks: contentBlocksSchema("disclosure").optional(),
		content: z
			.string()
			.min(1)
			.optional()
			.describe("The hidden content as a string; contentBlocks is preferred."),
		contentIsHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe("Treat content as trusted HTML instead of escaping it."),
		open: z.boolean().optional().default(false).describe("Open initially."),
	})
	.superRefine((params, ctx) => {
		const hasBlocks =
			Array.isArray(params.contentBlocks) && params.contentBlocks.length > 0;
		const hasLegacyContent =
			typeof params.content === "string" && params.content.length > 0;

		if (!hasBlocks && !hasLegacyContent) {
			ctx.addIssue({
				code: "custom",
				path: ["contentBlocks"],
				message: "Set contentBlocks or content.",
			});
		}
	});

/** The get_disclosure tool's input: simple blocks only (roadmap R5, option B). */
export const DisclosureSchema = DisclosureRenderSchema.safeExtend({
	contentBlocks: simpleBlocksSchema()
		.optional()
		.describe(
			"The hidden content: text, html, badge or field blocks. For containers inside, use render_composition with a disclosure block.",
		),
});

export type DisclosureInput = z.input<typeof DisclosureRenderSchema>;
export type DisclosureParams = z.output<typeof DisclosureRenderSchema>;
