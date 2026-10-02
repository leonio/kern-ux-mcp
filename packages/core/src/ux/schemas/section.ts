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
		headingText: z
			.string()
			.min(1)
			.describe(
				"Abschnitts-Überschrift für diese Komposition. Sollte den Inhalt des folgenden Blocks präzise benennen.",
			),
		headingLevel: HeadingLevelSchema.optional()
			.default(2)
			.describe(
				"Heading-Ebene (h1–h6). Im Seitenkontext hierarchisch ohne Sprünge verwenden. Standard: h2.",
			),
		contentBlocks: contentBlocksSchema("section").optional(),
		paragraphs: z
			.array(z.string().min(1))
			.min(1)
			.optional()
			.describe(
				"Legacy-Kompatibilität: Ein oder mehrere Absätze als String-Liste. Für neue Aufrufe contentBlocks bevorzugen.",
			),
		paragraphSize: ComponentSizeSchema.optional()
			.default("default")
			.describe("Legacy-Kompatibilität: gemeinsame Textgröße für paragraphs."),
		paragraphBold: z
			.boolean()
			.optional()
			.default(false)
			.describe("Legacy-Kompatibilität: macht paragraphs fett."),
		divider: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Optionale Trennlinie am Ende des Abschnitts, wenn der Bereich visuell klar vom nächsten Block getrennt werden soll.",
			),
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
				message: "Mindestens contentBlocks oder paragraphs muss gesetzt sein.",
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
}).describe(
	"Parameters for a KERN section: a heading, content blocks and an optional divider. " +
		"A composition helper of this repo, not an upstream KERN component. " +
		"Prefer contentBlocks; paragraphs is still supported.",
);

export type SectionInput = z.input<typeof SectionRenderSchema>;
export type SectionParams = z.output<typeof SectionRenderSchema>;
