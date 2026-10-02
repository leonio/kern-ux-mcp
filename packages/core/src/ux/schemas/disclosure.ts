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
			.describe(
				"Text für den Expand/Collapse-Trigger im <summary>. Kurz, eindeutig und als aufklappbare Information verständlich formulieren.",
			),
		contentBlocks: contentBlocksSchema("disclosure").optional(),
		content: z
			.string()
			.min(1)
			.optional()
			.describe(
				"Legacy-Inhalt des auf-/zuklappbaren Bereichs als Text oder HTML-String. Für neue Aufrufe contentBlocks bevorzugen.",
			),
		contentIsHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Legacy-Kompatibilität: Wenn true wird content als HTML interpretiert. Nur für vertrauenswürdige Inhalte verwenden.",
			),
		open: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true: Bereich ist initial geöffnet. Standardmäßig geschlossen lassen, außer der Kontext erfordert sofort sichtbare Zusatzinformationen.",
			),
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
				message: "Mindestens contentBlocks oder content muss gesetzt sein.",
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
}).describe(
	"Parameters for a KERN disclosure: expand and collapse with <details>/<summary> and accordion styling. " +
		"A composition helper of this repo for single disclosures, not the upstream accordion component.",
);

export type DisclosureInput = z.input<typeof DisclosureRenderSchema>;
export type DisclosureParams = z.output<typeof DisclosureRenderSchema>;
