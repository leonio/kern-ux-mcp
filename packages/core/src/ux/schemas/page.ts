import { z } from "zod";
import { RecursiveContentBlocksSchema } from "./content-union.js";
import { McpCommonSchema } from "./foundations.js";

const linkSchema = z.object({
	label: z.string().min(1),
	href: z.string().min(1),
});

export const PageSchema = z.object({
	...McpCommonSchema.shape,
	title: z
		.string()
		.min(1)
		.optional()
		.describe(
			"The document <title> for document: true; the heading when omitted.",
		),
	kopfzeile: z
		.boolean()
		.optional()
		.describe(
			"Show the Kopfzeile bar ('Offizielle Website – Bundesrepublik Deutschland'). Only for official federal websites.",
		),
	header: z
		.object({
			title: z
				.string()
				.min(1)
				.describe("Site or service name, shown as the brand."),
			homeHref: z
				.string()
				.min(1)
				.optional()
				.describe("Link target of the brand; / when omitted."),
			logo: z.object({ src: z.string().min(1), alt: z.string() }).optional(),
			navigation: z
				.array(
					linkSchema.extend({
						current: z
							.boolean()
							.optional()
							.describe("Marks the current page (aria-current)."),
					}),
				)
				.max(8)
				.optional()
				.describe("Main navigation."),
			serviceLinks: z
				.array(linkSchema)
				.max(6)
				.optional()
				.describe(
					"Small links beside the brand, e.g. Leichte Sprache, Gebärdensprache, Kontakt.",
				),
		})
		.optional(),
	heading: z
		.string()
		.min(1)
		.optional()
		.describe("The page's <h1>, at the top of <main>."),
	contentBlocks: RecursiveContentBlocksSchema.min(1).describe(
		"The content of <main>: the same blocks as render_composition. Start sections at headingLevel 2 below the h1.",
	),
	footer: z
		.object({
			columns: z
				.array(
					z.object({
						heading: z.string().min(1),
						links: z.array(linkSchema).min(1),
					}),
				)
				.min(1)
				.max(4)
				.optional()
				.describe("Link columns, side by side from md up."),
			note: z
				.string()
				.min(1)
				.optional()
				.describe("A closing line, e.g. © 2026 Stadt Musterstadt."),
		})
		.optional(),
	document: z
		.boolean()
		.optional()
		.describe(
			"Wrap the page in a complete HTML document that loads the KERN stylesheets; a fragment for an existing <body> when omitted.",
		),
});

export type PageInput = z.input<typeof PageSchema>;
