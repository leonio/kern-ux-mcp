import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const linkRenderSchema = z.object({
	text: z.string().optional().default("Beispieltext").describe("Link text."),
	href: z.string().optional().default("#").describe("Link target."),
});

export const linkToolSchema = linkRenderSchema.extend(McpCommonSchema.shape);

export type LinkRenderInput = z.input<typeof linkRenderSchema>;
