import type {
	ComponentInfo,
	TokenSnapshot,
	UpstreamSource,
} from "./registry.schema.js";

export type Locale = "de" | "en";

// The registry types derive from the contract in registry.schema.ts.
export type {
	AccessibilityCriterion,
	ComponentDocs,
	ComponentInfo,
	ComponentKnowledge,
	ComponentStatus,
	RegistryManifest,
	TokenSnapshot,
	UpstreamSource,
} from "./registry.schema.js";

// The notes about our tools are code (tool-notes.ts).
export type {
	GuidanceEvidenceKind,
	ReviewedComponentGuidance,
	ReviewedGuidanceEvidenceRef,
	ReviewedGuidanceStatement,
	ReviewedGuidanceStatus,
} from "./tool-notes.js";

/** The loaded registry, with components sorted by ID and indexed. */
export type Registry = {
	manifestVersion: string;
	generatedAt: string;
	/** The KERN release the registry describes; the page shell loads its CSS. */
	upstream?: UpstreamSource;
	tokens: TokenSnapshot;
	components: ComponentInfo[];
	byId: Map<string, ComponentInfo>;
};

export type { ValidationIssue } from "./validate.schema.js";

/** Bilingual string for localized messages */
export type LocalizedString = {
	en: string;
	de: string;
};

/** Result from a template builder function */
export type BuildResult = {
	html: string;
	warnings: string[];
};
