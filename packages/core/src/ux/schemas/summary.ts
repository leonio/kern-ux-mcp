import { z } from "zod";
import { IconRefSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a key-value item in the summary description list
 */
export const summaryItemSchema = z.object({
	/** Key/term for the description list */
	key: z.string().describe("The term, e.g. a form field's label."),
	/** Value/description for the description list */
	value: z.string().describe("Its value, e.g. the answer given."),
	/** Whether value is raw HTML */
	valueIsHtml: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Treat value as trusted HTML, e.g. a list, instead of escaping it.",
		),
});

/**
 * Schema for edit action in summary
 */
export const summaryActionSchema = z.object({
	/** Link URL for the action */
	href: z.string().describe("Target of the edit link."),
	/** Action label text */
	label: z
		.string()
		.optional()
		.describe("Link text; 'Bearbeiten' or 'Edit' by default."),
	/** Icon name (default: "edit") */
	icon: IconRefSchema.shape.name
		.optional()
		.default("edit")
		.describe("Icon of the link; edit by default."),
});

/**
 * Schema for a single summary
 */
export const singleSummarySchema = z.object({
	/** Step/task number displayed */
	number: z
		.union([z.string(), z.number()])
		.optional()
		.describe("Number shown before the title, e.g. of a step."),
	/** Summary title */
	title: z.string().describe("Title."),
	/** Heading level for the title (default: 3) */
	headingLevel: z
		.enum(["2", "3", "4", "5", "6"])
		.optional()
		.default("3")
		.describe("Heading level of the title (kern-title kern-title--small)."),
	/** Key-value items in the description list */
	items: z.array(summaryItemSchema).describe("Term and value pairs."),
	/** Optional edit action */
	action: summaryActionSchema.optional().describe("An optional edit link."),
});

/**
 * Schema for single summary mode
 */
export const summarySingleSchema = z
	.object({
		...CommonParams,
		mode: z.literal("single"),
		/** Single summary configuration */
		...singleSummarySchema.shape,
	})
	.describe("mode 'single': one summary.");

/**
 * Schema for summary group mode
 */
export const summaryGroupSchema = z
	.object({
		...CommonParams,
		mode: z.literal("group"),
		/** Group title */
		groupTitle: z.string().describe("Heading of the group."),
		/** Heading level for group title (default: 2) */
		groupHeadingLevel: z
			.enum(["2", "3", "4", "5", "6"])
			.optional()
			.default("2")
			.describe("Heading level of the group (kern-heading-medium)."),
		/** Array of summaries in the group */
		summaries: z
			.array(singleSummarySchema)
			.min(1)
			.describe("The summaries in the group."),
	})
	.describe("mode 'group': several summaries under one heading.");

/**
 * Discriminated union for summary: single vs group mode
 */
export const summarySchema = z.discriminatedUnion("mode", [
	summarySingleSchema,
	summaryGroupSchema,
]);

export type SummaryItemInput = z.input<typeof summaryItemSchema>;
export type SummaryActionInput = z.input<typeof summaryActionSchema>;
export type SingleSummaryInput = z.input<typeof singleSummarySchema>;
export type SummarySingleInput = z.input<typeof summarySingleSchema>;
export type SummaryGroupInput = z.input<typeof summaryGroupSchema>;
export type SummaryInput = z.input<typeof summarySchema>;
