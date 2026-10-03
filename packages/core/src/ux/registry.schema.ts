import { z } from "zod";
import { REGISTRY_CONTRACT_MAJOR } from "./registry.js";

/**
 * The registry contract: the shape of registry.json, the data the server reads.
 * The registry types derive from it, and a test checks the checked-in file
 * against it. The server doesn't load this module at startup (see
 * REGISTRY_CONTRACT_MAJOR).
 */

const notRead = (what: string) => ({
	deprecated: true,
	description: `${what} The server doesn't read it; it may be dropped in the next major version.`,
});

const LocalizedTextSchema = z.object({ de: z.string(), en: z.string() });

export const ComponentStatusSchema = z.enum([
	"stable",
	"experimental",
	"deprecated",
]);

export const ComponentCategorySchema = z.enum(["interactive", "foundational"]);

export const ComponentStrategySchema = z.enum([
	"interactive",
	"layout",
	"typography",
	"fallback",
]);

export const GuidanceSectionSchema = z.object({
	source: z
		.string()
		.describe("Where the section comes from, e.g. COMPONENTS.MD."),
	heading: z.string(),
	content: z.string(),
});

export const ComponentDocsSchema = z.object({
	excerpt: z
		.string()
		.describe("The documentation get_component_docs returns as excerpt."),
	sections: z.array(GuidanceSectionSchema).optional(),
});

export const GuidanceEvidenceKindSchema = z.enum([
	"docs-snapshot",
	"story",
	"scss",
	"schema",
	"template",
	"test",
	"manual-review",
	"other",
]);

export const ReviewedGuidanceEvidenceRefSchema = z.object({
	kind: GuidanceEvidenceKindSchema,
	source: z.string(),
	locator: z.string().optional(),
	note: LocalizedTextSchema.optional(),
});

export const ReviewedGuidanceStatementSchema = z.object({
	text: LocalizedTextSchema,
	confidence: z.enum(["high", "medium", "low"]),
	evidence: z.array(ReviewedGuidanceEvidenceRefSchema),
});

export const ReviewedComponentGuidanceSchema = z.object({
	status: z.enum(["draft", "reviewed", "approved"]),
	summary: ReviewedGuidanceStatementSchema,
	primaryUseCases: z.array(ReviewedGuidanceStatementSchema),
	antiUseCases: z.array(ReviewedGuidanceStatementSchema),
	requiredA11yPractices: z.array(ReviewedGuidanceStatementSchema),
	semanticInvariants: z.array(ReviewedGuidanceStatementSchema),
	compositionPatterns: z.array(ReviewedGuidanceStatementSchema),
	authoringNotes: z.array(ReviewedGuidanceStatementSchema),
	migrationNotes: z.array(ReviewedGuidanceStatementSchema),
});

export const ComponentInfoSchema = z.object({
	id: z
		.string()
		.regex(/^[a-z0-9][a-z0-9_-]*$/)
		.describe(
			"Stable component ID, lowercase. If the server has a tool for the component, it's get_<id>.",
		),
	title: z
		.string()
		.min(1)
		.describe("The component's name. Tool titles derive from it."),
	status: ComponentStatusSchema.describe(
		"experimental and deprecated components get a banner and a warning in tool output.",
	),
	category: ComponentCategorySchema.optional().meta(
		notRead("Tool routing from the in-repo generator."),
	),
	strategy: ComponentStrategySchema.optional().meta(
		notRead("Tool routing from the in-repo generator."),
	),
	docs: ComponentDocsSchema.optional().describe(
		"Extracted documentation, served by get_component_docs.",
	),
	reviewedGuidance: ReviewedComponentGuidanceSchema.optional().meta(
		notRead(
			"Notes from the retired guidance overlay. The server's notes about its own tools are in code.",
		),
	),
	sources: z
		.object({
			scss: z.array(z.string()).optional(),
			stories: z.array(z.string()).optional(),
		})
		.optional()
		.describe("Source files, relative to the kern-ux-plain root."),
	htmlCanonical: z
		.string()
		.optional()
		.describe(
			"Canonical example markup. Tools without their own template return it.",
		),
	warnings: z
		.array(z.string())
		.optional()
		.meta(
			notRead("Generator diagnostics; they belong in the generator's report."),
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
		.describe(
			"The commit of that release in kern-ux-plain (the release tag's).",
		),
});

export const RegistryManifestSchema = z
	.object({
		manifestVersion: z
			.string()
			.regex(new RegExp(`^${REGISTRY_CONTRACT_MAJOR}\\.\\d+\\.\\d+$`))
			.describe(
				`The contract version (semver). This server reads major ${REGISTRY_CONTRACT_MAJOR}.`,
			),
		generatedAt: z.iso.datetime().describe("When the registry was generated."),
		upstream: UpstreamSourceSchema,
		tokens: TokenSnapshotSchema,
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
	})
	.meta({
		title: "KERN UX MCP registry",
		description:
			"registry.json for @leonio/kern-ux-mcp: KERN UX components, tokens and the upstream release they describe. Unknown keys are allowed.",
	});

export type ComponentStatus = z.infer<typeof ComponentStatusSchema>;
export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;
export type ComponentStrategy = z.infer<typeof ComponentStrategySchema>;
export type GuidanceSection = z.infer<typeof GuidanceSectionSchema>;
export type ComponentDocs = z.infer<typeof ComponentDocsSchema>;
export type GuidanceEvidenceKind = z.infer<typeof GuidanceEvidenceKindSchema>;
export type ReviewedGuidanceStatus = ReviewedComponentGuidance["status"];
export type ReviewedGuidanceEvidenceRef = z.infer<
	typeof ReviewedGuidanceEvidenceRefSchema
>;
export type ReviewedGuidanceStatement = z.infer<
	typeof ReviewedGuidanceStatementSchema
>;
export type ReviewedComponentGuidance = z.infer<
	typeof ReviewedComponentGuidanceSchema
>;
export type ComponentInfo = z.infer<typeof ComponentInfoSchema>;
export type TokenSnapshot = z.infer<typeof TokenSnapshotSchema>;
export type UpstreamSource = z.infer<typeof UpstreamSourceSchema>;
export type RegistryManifest = z.infer<typeof RegistryManifestSchema>;
