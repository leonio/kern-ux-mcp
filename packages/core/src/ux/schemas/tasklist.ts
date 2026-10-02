import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

export const tasklistItemSchema = z.object({
	title: z.string().describe("Task title."),
	href: z
		.string()
		.optional()
		.describe("Link target; without one the title is plain text."),
	status: z
		.string()
		.optional()
		.default("Offen")
		.describe("Status text, e.g. 'Erledigt'; 'Offen' by default."),
	statusType: z
		.enum(["info", "success", "warning", "danger"])
		.optional()
		.default("info")
		.describe("Badge colour of the status."),
});

export const tasklistSchema = z.object({
	...CommonParams,
	heading: z
		.string()
		.optional()
		.default("Aufgaben")
		.describe("Heading (kern-heading-medium); 'Aufgaben' by default."),
	numbered: z
		.boolean()
		.optional()
		.default(true)
		.describe(
			'Numbers each task (<span class="kern-number">); false gives an unnumbered list.',
		),
	items: z
		.array(tasklistItemSchema)
		.min(1)
		.describe("The tasks, each with a status badge."),
});

export type TasklistInput = z.input<typeof tasklistSchema>;
