import { z } from "zod";
import { badgeSchema } from "./badge.js";
import { ButtonSchema } from "./button.js";
import {
	ComponentSizeSchema,
	GridColumnsSchema,
	HeadingLevelSchema,
} from "./foundations.js";

export const MAX_RECURSIVE_CONTENT_DEPTH = 4;
export const MAX_RECURSIVE_CONTENT_NODES = 60;

const embeddedButtonSchema = ButtonSchema.omit({
	locale: true,
	strict: true,
}).describe("Eingebetteter KERN Button im rekursiven Content-Baum.");

const embeddedBadgeSchema = badgeSchema
	.omit({ locale: true, strict: true })
	.describe("Eingebettetes KERN Badge im rekursiven Content-Baum.");

const textContentNodeSchema = z.object({
	kind: z.literal("text"),
	text: z.string().min(1).describe("KERN Body-Textblock."),
});

const htmlContentNodeSchema = z.object({
	kind: z.literal("html"),
	html: z.string().min(1).describe("Rohes HTML (wird nicht escaped)."),
});

const buttonContentNodeSchema = z.object({
	kind: z.literal("button"),
	button: embeddedButtonSchema,
});

const badgeContentNodeSchema = z.object({
	kind: z.literal("badge"),
	badge: embeddedBadgeSchema,
});

type TextContentNodeInput = {
	kind: "text";
	text: string;
};

type HtmlContentNodeInput = {
	kind: "html";
	html: string;
};

type ButtonContentNodeInput = {
	kind: "button";
	button: z.input<typeof embeddedButtonSchema>;
};

type BadgeContentNodeInput = {
	kind: "badge";
	badge: z.input<typeof embeddedBadgeSchema>;
};

type SectionContentNodeInput = {
	kind: "section";
	section: {
		headingText: string;
		headingLevel?: z.input<typeof HeadingLevelSchema>;
		divider?: boolean;
		contentBlocks?: RecursiveContentNodeInput[];
		paragraphs?: string[];
	};
};

type DisclosureContentNodeInput = {
	kind: "disclosure";
	disclosure: {
		triggerLabel: string;
		open?: boolean;
		contentBlocks?: RecursiveContentNodeInput[];
	};
};

type GridContentNodeInput = {
	kind: "grid";
	grid: {
		columns?: z.input<typeof GridColumnsSchema>;
		containerFluid?: boolean;
		rowAlignment?: "start" | "center" | "end";
		includeHeading?: boolean;
		headingText?: string;
		headingLevel?: z.input<typeof HeadingLevelSchema>;
		columnsContent?: RecursiveContentNodeInput[][];
	};
};

type CardContentNodeInput = {
	kind: "card";
	card: {
		size?: z.input<typeof ComponentSizeSchema>;
		hug?: boolean;
		media?: {
			src: string;
			alt: string;
		};
		header?: {
			preline?: string;
			title: string;
			titleLevel?: z.input<typeof HeadingLevelSchema>;
			subline?: string;
			href?: string;
		};
		body?: string;
		bodyIsHtml?: boolean;
		contentBlocks?: RecursiveContentNodeInput[];
		footer?: {
			primaryLabel?: string;
			secondaryLabel?: string;
		};
	};
};

type FormFlowContentNodeInput = {
	kind: "formFlow";
	formFlow: {
		currentStep: number;
		steps: Array<{
			label: string;
			statusText?: string;
			contentBlocks?: RecursiveContentNodeInput[];
		}>;
		heading?: string;
		headingLevel?: z.input<typeof HeadingLevelSchema>;
		showProgress?: boolean;
		navigation?: {
			backLabel?: string;
			nextLabel?: string;
			submitLabel?: string;
		};
	};
};

export type RecursiveContentNodeInput =
	| TextContentNodeInput
	| HtmlContentNodeInput
	| ButtonContentNodeInput
	| BadgeContentNodeInput
	| SectionContentNodeInput
	| DisclosureContentNodeInput
	| GridContentNodeInput
	| CardContentNodeInput
	| FormFlowContentNodeInput;

export const RecursiveContentNodeSchema: z.ZodType<
	RecursiveContentNodeInput,
	RecursiveContentNodeInput
> = z.lazy(() =>
	z
		.discriminatedUnion("kind", [
			textContentNodeSchema,
			htmlContentNodeSchema,
			buttonContentNodeSchema,
			badgeContentNodeSchema,
			z.object({
				kind: z.literal("section"),
				section: z.object({
					headingText: z.string().min(1),
					headingLevel: HeadingLevelSchema.optional().default(2),
					divider: z.boolean().optional().default(false),
					contentBlocks: z.array(RecursiveContentNodeSchema).optional(),
					paragraphs: z
						.array(z.string().min(1))
						.optional()
						.describe(
							"Shorthand: string[] wird automatisch zu text-contentBlocks konvertiert.",
						),
				}),
			}),
			z.object({
				kind: z.literal("disclosure"),
				disclosure: z.object({
					triggerLabel: z.string().min(1),
					open: z.boolean().optional().default(false),
					contentBlocks: z.array(RecursiveContentNodeSchema).optional(),
				}),
			}),
			z.object({
				kind: z.literal("grid"),
				grid: z.object({
					columns: GridColumnsSchema.optional().default(2),
					containerFluid: z.boolean().optional().default(false),
					rowAlignment: z.enum(["start", "center", "end"]).optional(),
					includeHeading: z.boolean().optional().default(false),
					headingText: z.string().optional(),
					headingLevel: HeadingLevelSchema.optional().default(2),
					columnsContent: z
						.array(z.array(RecursiveContentNodeSchema))
						.optional(),
				}),
			}),
			z.object({
				kind: z.literal("card"),
				card: z.object({
					size: ComponentSizeSchema.optional().default("default"),
					hug: z.boolean().optional().default(false),
					media: z
						.object({
							src: z.string().describe("Bild-URL."),
							alt: z.string().describe("Alt-Text für das Bild."),
						})
						.optional(),
					header: z
						.object({
							preline: z.string().optional(),
							title: z.string().min(1),
							titleLevel: HeadingLevelSchema.optional().default(2),
							subline: z.string().optional(),
							href: z.string().optional(),
						})
						.optional(),
					body: z
						.string()
						.optional()
						.describe("Optionaler einfacher Body-Text."),
					bodyIsHtml: z.boolean().optional().default(false),
					contentBlocks: z.array(RecursiveContentNodeSchema).optional(),
					footer: z
						.object({
							primaryLabel: z.string().optional(),
							secondaryLabel: z.string().optional(),
						})
						.optional(),
				}),
			}),
			z.object({
				kind: z.literal("formFlow"),
				formFlow: z
					.object({
						currentStep: z
							.number()
							.int()
							.min(1)
							.describe(
								"Aktiver Schritt (1-basiert). Werte über steps.length werden begrenzt.",
							),
						steps: z
							.array(
								z.object({
									label: z.string().min(1),
									statusText: z.string().optional(),
									contentBlocks: z.array(RecursiveContentNodeSchema).optional(),
								}),
							)
							.min(2),
						heading: z.string().optional(),
						headingLevel: HeadingLevelSchema.optional().default(2),
						showProgress: z.boolean().optional().default(true),
						navigation: z
							.object({
								backLabel: z.string().optional(),
								nextLabel: z.string().optional(),
								submitLabel: z.string().optional(),
							})
							.optional(),
					})
					.describe(
						"Mehrstufiges Formular: Tasklist + Progress + aktiver Schritt.",
					),
			}),
		])
		.describe(
			"Rekursiver Content-Knoten: text/html/button/badge/card/formFlow.",
		),
);

function validateRecursiveContentLimits(
	nodes: unknown[],
	ctx: z.RefinementCtx,
): void {
	let nodeCount = 0;
	let nodeLimitReported = false;

	const visit = (
		node: unknown,
		depth: number,
		path: Array<string | number>,
	) => {
		if (typeof node !== "object" || node === null) {
			return;
		}

		nodeCount += 1;
		if (nodeCount > MAX_RECURSIVE_CONTENT_NODES && !nodeLimitReported) {
			nodeLimitReported = true;
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path,
				message: `Maximal ${MAX_RECURSIVE_CONTENT_NODES} Content-Knoten erlaubt.`,
			});
		}

		if (depth > MAX_RECURSIVE_CONTENT_DEPTH) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path,
				message: `Maximale Verschachtelungstiefe von ${MAX_RECURSIVE_CONTENT_DEPTH} überschritten.`,
			});
			return;
		}

		const current = node as {
			kind?: string;
			card?: { contentBlocks?: unknown[] };
			section?: { contentBlocks?: unknown[] };
			disclosure?: { contentBlocks?: unknown[] };
			grid?: { columnsContent?: unknown[][] };
			formFlow?: { steps?: Array<{ contentBlocks?: unknown[] }> };
		};

		if (current.kind === "card" && Array.isArray(current.card?.contentBlocks)) {
			current.card.contentBlocks.forEach((child, index) => {
				visit(child, depth + 1, [...path, "card", "contentBlocks", index]);
			});
			return;
		}

		if (
			current.kind === "section" &&
			Array.isArray(current.section?.contentBlocks)
		) {
			current.section.contentBlocks.forEach((child, index) => {
				visit(child, depth + 1, [...path, "section", "contentBlocks", index]);
			});
			return;
		}

		if (
			current.kind === "disclosure" &&
			Array.isArray(current.disclosure?.contentBlocks)
		) {
			current.disclosure.contentBlocks.forEach((child, index) => {
				visit(child, depth + 1, [
					...path,
					"disclosure",
					"contentBlocks",
					index,
				]);
			});
			return;
		}

		if (
			current.kind === "grid" &&
			Array.isArray(current.grid?.columnsContent)
		) {
			current.grid.columnsContent.forEach((column, columnIndex) => {
				if (!Array.isArray(column)) {
					return;
				}

				column.forEach((child, childIndex) => {
					visit(child, depth + 1, [
						...path,
						"grid",
						"columnsContent",
						columnIndex,
						childIndex,
					]);
				});
			});
			return;
		}

		if (current.kind === "formFlow" && Array.isArray(current.formFlow?.steps)) {
			current.formFlow.steps.forEach((step, stepIndex) => {
				if (Array.isArray(step.contentBlocks)) {
					step.contentBlocks.forEach((child, childIndex) => {
						visit(child, depth + 1, [
							...path,
							"formFlow",
							"steps",
							stepIndex,
							"contentBlocks",
							childIndex,
						]);
					});
				}
			});
		}
	};

	nodes.forEach((node, index) => {
		visit(node, 1, [index]);
	});
}

export const RecursiveContentBlocksSchema = z
	.array(RecursiveContentNodeSchema)
	.superRefine((nodes, ctx) => {
		validateRecursiveContentLimits(nodes, ctx);
	})
	.describe(
		"Rekursive Content-Blöcke mit erlaubten Knotenarten text/html/button/badge/section/disclosure/grid/card inklusive Tiefen- und Größenlimit.",
	);
