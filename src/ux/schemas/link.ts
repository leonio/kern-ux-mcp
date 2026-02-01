import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

export const linkRenderSchema = z
	.object({
		text: z
			.string()
			.optional()
			.default("Beispieltext")
			.describe("Sichtbarer Link-Text."),
		href: z
			.string()
			.optional()
			.default("#")
			.describe("Ziel-URL fuer das href-Attribut des Links."),
	})
	.describe(
		'Parameter fuer KERN UX Link-Typografie. Diese MCP-Variante bildet den einfachen Textlink <a class="kern-link"> ab; Varianten wie Icon-Link, Link-Button oder Small-Link aus den KERN-Stories werden nicht ueber dieses Schema modelliert.',
	);

export const linkToolSchema = linkRenderSchema.merge(McpCommonSchema);

export type LinkRenderInput = z.input<typeof linkRenderSchema>;
