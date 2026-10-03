import { z } from "zod";
import { REGISTRY_CONTRACT_MAJOR } from "./registry.js";

/**
 * The registry contract: the shape of registry.json, the data the server reads.
 * `npm run knowledge:import` generates the file from the knowledge bundle in
 * knowledge/ (knowledge-projection.ts). It holds only what the server serves,
 * with our component IDs; nobody edits it by hand. Tests check the checked-in
 * file against this contract and against a fresh projection. The server
 * doesn't load this module at startup (see REGISTRY_CONTRACT_MAJOR).
 */

const LinkSchema = z.string().regex(/^https:\/\//);

export const ComponentStatusSchema = z.enum([
	"stable",
	"experimental",
	"deprecated",
	"docs-only",
]);

export const ComponentKnowledgeSchema = z.object({
	whenToUse: z.array(z.string()).optional(),
	whenNotToUse: z
		.array(
			z.object({
				text: z.string(),
				useInstead: z.string().optional().describe("Our component ID."),
			}),
		)
		.optional(),
	dos: z.array(z.string()).optional(),
	donts: z.array(z.string()).optional(),
	contentGuidelines: z.array(z.string()).optional(),
	similar: z
		.array(
			z.object({
				id: z.string().optional().describe("Our component ID."),
				name: z
					.string()
					.optional()
					.describe("A component KERN doesn't have, e.g. Tooltip."),
				difference: z.string().optional(),
			}),
		)
		.optional(),
});

export const ComponentDocsSchema = z.object({
	url: LinkSchema.describe("The component's page on kern-ux.de."),
	summary: z.string().optional(),
	sections: z.array(
		z.object({
			heading: z.string().describe("The page's heading, in German."),
			url: LinkSchema,
			summary: z.string().optional(),
		}),
	),
});

export const AccessibilityCriterionSchema = z.object({
	criterion: z
		.string()
		.optional()
		.describe("WCAG success criterion, e.g. 1.3.1."),
	slug: z.string(),
	level: z.enum(["A", "AA", "AAA"]).optional(),
	status: z
		.enum(["passed", "implementation-dependent", "failed", "unknown"])
		.describe(
			"The strictest status the docs record for the criterion: failed, then implementation-dependent, unknown, passed.",
		),
});

export const ComponentInfoSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9]+$/)
		.describe(
			"Our component ID: KERN's without hyphens (knowledge-map.ts). If the server has a tool for the component, it's get_<id>.",
		),
	kernId: z
		.string()
		.optional()
		.describe(
			"KERN's ID, e.g. input-text. Missing for tools whose markup comes from elsewhere in the bundle (layers, pattern).",
		),
	title: z
		.string()
		.min(1)
		.describe("The component's English name. Tool titles derive from it."),
	titleDe: z
		.string()
		.optional()
		.describe("The German name, where it differs from the English one."),
	status: ComponentStatusSchema.describe(
		"experimental and deprecated components get a banner and a warning in tool output. docs-only components have no implementation in KERN.",
	),
	group: z.string().optional(),
	synonyms: z.array(z.string()).optional(),
	links: z
		.object({
			docs: LinkSchema.optional(),
			figma: LinkSchema.optional(),
			source: LinkSchema.optional(),
		})
		.optional(),
	summary: z.string().max(160).optional(),
	knowledge: ComponentKnowledgeSchema.optional(),
	docs: ComponentDocsSchema.optional(),
	accessibility: z.array(AccessibilityCriterionSchema).optional(),
	sources: z
		.array(z.string())
		.optional()
		.describe("Source files, relative to the kern-ux-plain root."),
	htmlCanonical: z
		.string()
		.optional()
		.describe(
			"The markup a fallback tool returns, picked from the bundle by example ID.",
		),
});

export const TokenSnapshotSchema = z.object({
	colors: z.array(z.string()).describe("Colour custom property names."),
	spacing: z.array(z.string()).describe("Spacing custom property names."),
	rawVariables: z
		.array(z.string())
		.describe("Every custom property name the token sources define."),
});

export const UpstreamSourceSchema = z.object({
	package: z
		.string()
		.min(1)
		.describe("The upstream npm package, e.g. @kern-ux/native."),
	version: z
		.string()
		.min(1)
		.describe(
			"The KERN release the registry describes. render_page loads this version's CSS.",
		),
	commit: z
		.string()
		.optional()
		.describe("The kern-ux-plain commit the bundle was built from."),
	bundleVersion: z
		.string()
		.optional()
		.describe("The knowledge bundle the registry was generated from."),
});

export const RegistryManifestSchema = z
	.object({
		manifestVersion: z
			.string()
			.regex(new RegExp(`^${REGISTRY_CONTRACT_MAJOR}\\.\\d+\\.\\d+$`))
			.describe(
				`The contract version (semver). This server reads major ${REGISTRY_CONTRACT_MAJOR}.`,
			),
		generatedAt: z.iso
			.datetime()
			.describe("When the bundle the registry comes from was generated."),
		upstream: UpstreamSourceSchema,
		tokens: TokenSnapshotSchema.describe(
			"Carried over from the previous registry until the bundle has tokens.",
		),
		components: z.array(ComponentInfoSchema),
	})
	.superRefine((manifest, ctx) => {
		const seen = new Set<string>();
		manifest.components.forEach((component, index) => {
			if (seen.has(component.id)) {
				ctx.addIssue({
					code: "custom",
					path: ["components", index, "id"],
					message: `Duplicate component id "${component.id}".`,
				});
			}
			seen.add(component.id);
		});
	});

export type ComponentStatus = z.infer<typeof ComponentStatusSchema>;
export type ComponentKnowledge = z.infer<typeof ComponentKnowledgeSchema>;
export type ComponentDocs = z.infer<typeof ComponentDocsSchema>;
export type AccessibilityCriterion = z.infer<
	typeof AccessibilityCriterionSchema
>;
export type ComponentInfo = z.infer<typeof ComponentInfoSchema>;
export type TokenSnapshot = z.infer<typeof TokenSnapshotSchema>;
export type UpstreamSource = z.infer<typeof UpstreamSourceSchema>;
export type RegistryManifest = z.infer<typeof RegistryManifestSchema>;
