import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const descriptionListItemSchema = z.object({
	key: z.string().describe("The term, rendered in <dt>."),
	value: z.string().describe("Its value as plain text, rendered in <dd>."),
});

export const descriptionListRenderSchema = z.object({
	items: z
		.array(descriptionListItemSchema)
		.min(1)
		.default([
			{ key: "Name", value: "Max" },
			{ key: "Vorname", value: "Mustermann" },
		])
		.describe("Term and value pairs, at least one."),
	stacked: z
		.boolean()
		.optional()
		.default(false)
		.describe(
			"Puts each value under its term (kern-description-list--col) instead of beside it.",
		),
});

export const descriptionListToolSchema = descriptionListRenderSchema.extend(
	McpCommonSchema.shape,
);

export type DescriptionListRenderInput = z.input<
	typeof descriptionListRenderSchema
>;
