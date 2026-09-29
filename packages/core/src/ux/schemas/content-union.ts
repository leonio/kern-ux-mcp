import { z } from "zod";
import { badgeSchema } from "./badge.js";
import { ButtonSchema } from "./button.js";
import {
	type FieldInput,
	FieldSchema,
	type FieldsetBaseInput,
	FieldsetBaseSchema,
	type FormBaseInput,
	FormBaseSchema,
} from "./field.js";
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

type FieldContentNodeInput = {
	kind: "field";
	field: FieldInput;
};

type FieldsetContentNodeInput = {
	kind: "fieldset";
	fieldset: FieldsetBaseInput & {
		contentBlocks: RecursiveContentNodeInput[];
	};
};

/** Input of a fieldset block; the tool schema is FieldsetRenderSchema. */
export type FieldsetBlockInput = FieldsetContentNodeInput["fieldset"];

type FormContentNodeInput = {
	kind: "form";
	form: FormBaseInput & {
		contentBlocks: RecursiveContentNodeInput[];
	};
};

/** Input of a form block. */
export type FormBlockInput = FormContentNodeInput["form"];

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
		contentBlocks: RecursiveContentNodeInput[];
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
		tasklistHeading?: string;
		showProgress?: boolean;
		renderAllSteps?: boolean;
		navigation?: {
			backLabel?: string;
			nextLabel?: string;
			submitLabel?: string;
		};
	} & Pick<FormBaseInput, "action" | "method" | "errorSummary">;
};

/** Input of a formFlow block; the schema is the formFlow branch of RecursiveContentNodeSchema. */
export type FormFlowInput = FormFlowContentNodeInput["formFlow"];

export type RecursiveContentNodeInput =
	| TextContentNodeInput
	| HtmlContentNodeInput
	| ButtonContentNodeInput
	| BadgeContentNodeInput
	| FieldContentNodeInput
	| FieldsetContentNodeInput
	| FormContentNodeInput
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
				kind: z.literal("field"),
				field: FieldSchema,
			}),
			z.object({
				kind: z.literal("fieldset"),
				fieldset: FieldsetBaseSchema.extend({
					contentBlocks: z.array(RecursiveContentNodeSchema).min(1),
				}),
			}),
			z.object({
				kind: z.literal("form"),
				form: FormBaseSchema.extend({
					contentBlocks: z.array(RecursiveContentNodeSchema).min(1),
				}),
			}),
			z.object({
				kind: z.literal("section"),
				section: z
					.object({
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
					})
					.superRefine((section, ctx) => {
						if (!section.contentBlocks?.length && !section.paragraphs?.length) {
							ctx.addIssue({
								code: "custom",
								path: ["contentBlocks"],
								message: "A section needs contentBlocks or paragraphs.",
							});
						}
					}),
			}),
			z.object({
				kind: z.literal("disclosure"),
				disclosure: z.object({
					triggerLabel: z.string().min(1),
					open: z.boolean().optional().default(false),
					contentBlocks: z.array(RecursiveContentNodeSchema).min(1),
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
						heading: z
							.string()
							.optional()
							.describe("Form heading above the step list."),
						headingLevel: HeadingLevelSchema.optional().default(2),
						tasklistHeading: z
							.string()
							.min(1)
							.optional()
							.describe(
								"Heading of the step list; 'Fortschritt' or 'Progress' when omitted.",
							),
						showProgress: z.boolean().optional().default(true),
						renderAllSteps: z
							.boolean()
							.optional()
							.describe(
								"Render every step, the inactive ones hidden, so a script can switch steps in the browser.",
							),
						navigation: z
							.object({
								backLabel: z.string().optional(),
								nextLabel: z.string().optional(),
								submitLabel: z.string().optional(),
							})
							.optional(),
						...FormBaseSchema.pick({
							action: true,
							method: true,
							errorSummary: true,
						}).shape,
					})
					.describe(
						"Mehrstufiges Formular: Tasklist + Progress + aktiver Schritt.",
					),
			}),
		])
		.describe(
			"Rekursiver Content-Knoten: text/html/button/badge/field/fieldset/form/section/disclosure/grid/card/formFlow.",
		),
);

/** Blocks that contain other blocks. */
export type ContainerKind =
	| "card"
	| "section"
	| "disclosure"
	| "grid"
	| "fieldset"
	| "form"
	| "formFlow";

/** Blocks that render a <form>; forms can't nest. */
const FORM_KINDS: ReadonlySet<string> = new Set(["form", "formFlow"]);

type BlockList = { blocks: unknown[]; path: Array<string | number> };

/** A container node's child block lists, each with its path below the node. */
function childBlockLists(node: Record<string, unknown>): BlockList[] {
	const kind = node.kind;
	const body = typeof kind === "string" ? node[kind] : undefined;
	if (typeof kind !== "string" || typeof body !== "object" || body === null) {
		return [];
	}
	const container = body as {
		contentBlocks?: unknown;
		columnsContent?: unknown;
		steps?: unknown;
	};

	if (kind === "grid") {
		return Array.isArray(container.columnsContent)
			? container.columnsContent.flatMap((column, index) =>
					Array.isArray(column)
						? [{ blocks: column, path: [kind, "columnsContent", index] }]
						: [],
				)
			: [];
	}

	if (kind === "formFlow") {
		return Array.isArray(container.steps)
			? container.steps.flatMap((step, index) => {
					const blocks = (step as { contentBlocks?: unknown } | null)
						?.contentBlocks;
					return Array.isArray(blocks)
						? [{ blocks, path: [kind, "steps", index, "contentBlocks"] }]
						: [];
				})
			: [];
	}

	return Array.isArray(container.contentBlocks)
		? [{ blocks: container.contentBlocks, path: [kind, "contentBlocks"] }]
		: [];
}

/**
 * Checks what the JSON Schema can't say: the size and depth limits, and the
 * nesting rules (forms don't nest, no card directly inside a card).
 * `parent` is the container the blocks sit in, when a tool renders one.
 */
function validateRecursiveContent(
	nodes: unknown[],
	ctx: z.RefinementCtx,
	parent?: ContainerKind,
): void {
	let nodeCount = 0;
	let nodeLimitReported = false;

	const visit = (
		node: unknown,
		depth: number,
		path: Array<string | number>,
		ancestors: readonly string[],
	) => {
		if (typeof node !== "object" || node === null) {
			return;
		}

		nodeCount += 1;
		if (nodeCount > MAX_RECURSIVE_CONTENT_NODES && !nodeLimitReported) {
			nodeLimitReported = true;
			ctx.addIssue({
				code: "custom",
				path,
				message: `Maximal ${MAX_RECURSIVE_CONTENT_NODES} Content-Knoten erlaubt.`,
			});
		}

		if (depth > MAX_RECURSIVE_CONTENT_DEPTH) {
			ctx.addIssue({
				code: "custom",
				path,
				message: `Maximale Verschachtelungstiefe von ${MAX_RECURSIVE_CONTENT_DEPTH} überschritten.`,
			});
			return;
		}

		const record = node as Record<string, unknown>;
		const kind = typeof record.kind === "string" ? record.kind : undefined;

		if (kind && FORM_KINDS.has(kind)) {
			const enclosing = ancestors.findLast((ancestor) =>
				FORM_KINDS.has(ancestor),
			);
			if (enclosing) {
				ctx.addIssue({
					code: "custom",
					path,
					message: `A ${kind} can't sit inside a ${enclosing}: forms don't nest.`,
				});
			}
		}

		if (kind === "card" && ancestors.at(-1) === "card") {
			ctx.addIssue({
				code: "custom",
				path,
				message:
					"A card can't sit directly inside another card. Put the content in the outer card, or place the cards side by side in a grid.",
			});
		}

		const childAncestors = kind ? [...ancestors, kind] : ancestors;
		for (const list of childBlockLists(record)) {
			list.blocks.forEach((child, index) => {
				visit(child, depth + 1, [...path, ...list.path, index], childAncestors);
			});
		}
	};

	nodes.forEach((node, index) => {
		visit(node, 1, [index], parent ? [parent] : []);
	});
}

/**
 * Content blocks with the limits and nesting rules checked. `parent` is the
 * container they sit in when a tool renders one (get_card, get_section, ...).
 */
export function contentBlocksSchema(parent?: ContainerKind) {
	return z
		.array(RecursiveContentNodeSchema)
		.superRefine((nodes, ctx) => {
			validateRecursiveContent(nodes, ctx, parent);
		})
		.describe(
			"Rekursive Content-Blöcke mit erlaubten Knotenarten text/html/button/badge/field/fieldset/form/section/disclosure/grid/card/formFlow inklusive Tiefen- und Größenlimit.",
		);
}

/** A tool's own content blocks, outside any container. */
export const RecursiveContentBlocksSchema = contentBlocksSchema();
