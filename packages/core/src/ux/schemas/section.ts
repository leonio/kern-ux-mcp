import { z } from "zod";
import { contentBlocksSchema, simpleBlocksSchema } from "./content-union.js";
import {
	ComponentSizeSchema,
	HeadingLevelSchema,
	McpCommonSchema,
} from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

/**
 * What buildSection parses: a <section> with heading, content and an optional
 * divider. A section block in render_composition can hold any block, so this
 * takes the full content union; the get_section tool takes SectionSchema.
 */
export const SectionRenderSchema = z
	.object({
		...CommonParams,
		headingText: z.string().min(1).describe("Section heading."),
		headingLevel: HeadingLevelSchema.optional()
			.default(2)
			.describe("Heading level, h1 to h6; h2 by default. Don't skip levels."),
		contentBlocks: contentBlocksSchema("section").optional(),
		paragraphs: z
			.array(z.string().min(1))
			.min(1)
			.optional()
			.describe("Paragraphs as strings; contentBlocks is preferred."),
		paragraphSize: ComponentSizeSchema.optional()
			.default("default")
			.describe("Text size of paragraphs."),
		paragraphBold: z
			.boolean()
			.optional()
			.default(false)
			.describe("Bold paragraphs."),
		divider: z
			.boolean()
			.optional()
			.default(false)
			.describe("Adds a divider at the end of the section."),
	})
	.superRefine((params, ctx) => {
		const hasBlocks =
			Array.isArray(params.contentBlocks) && params.contentBlocks.length > 0;
		const hasParagraphs =
			Array.isArray(params.paragraphs) && params.paragraphs.length > 0;

		if (!hasBlocks && !hasParagraphs) {
			ctx.addIssue({
				code: "custom",
				path: ["contentBlocks"],
				message: "Set contentBlocks or paragraphs.",
			});
		}
	});

/** The get_section tool's input: simple blocks only (roadmap R5, option B). */
export const SectionSchema = SectionRenderSchema.safeExtend({
	contentBlocks: simpleBlocksSchema()
		.optional()
		.describe(
			"The section's content: text, html, badge or field blocks. For cards, grids or other containers inside a section, use render_composition with a section block.",
		),
});

export type SectionInput = z.input<typeof SectionRenderSchema>;
export type SectionParams = z.output<typeof SectionRenderSchema>;
