export type Locale = "de" | "en";

export type ComponentStatus = "stable" | "experimental" | "deprecated";

export type ComponentCategory = "interactive" | "foundational";

export type ComponentStrategy =
	| "interactive"
	| "layout"
	| "typography"
	| "fallback";

export type GuidanceSection = {
	source: string;
	heading: string;
	content: string;
};

export type ComponentDocs = {
	excerpt: string;
	sections?: GuidanceSection[];
};

export type GuidanceEvidenceKind =
	| "docs-snapshot"
	| "story"
	| "scss"
	| "schema"
	| "template"
	| "test"
	| "manual-review"
	| "other";

export type ReviewedGuidanceStatus = "draft" | "reviewed" | "approved";

export type ReviewedGuidanceEvidenceRef = {
	kind: GuidanceEvidenceKind;
	source: string;
	locator?: string;
	note?: LocalizedString;
};

export type ReviewedGuidanceStatement = {
	text: LocalizedString;
	confidence: "high" | "medium" | "low";
	evidence: ReviewedGuidanceEvidenceRef[];
};

export type ReviewedComponentGuidance = {
	status: ReviewedGuidanceStatus;
	summary: ReviewedGuidanceStatement;
	primaryUseCases: ReviewedGuidanceStatement[];
	antiUseCases: ReviewedGuidanceStatement[];
	requiredA11yPractices: ReviewedGuidanceStatement[];
	semanticInvariants: ReviewedGuidanceStatement[];
	compositionPatterns: ReviewedGuidanceStatement[];
	authoringNotes: ReviewedGuidanceStatement[];
	migrationNotes: ReviewedGuidanceStatement[];
};

export type GuidanceOverlayManifest = {
	overlayVersion: string;
	generatedAt?: string;
	components: Record<string, ReviewedComponentGuidance>;
};

export type ComponentInfo = {
	id: string;
	title: string;
	status: ComponentStatus;
	category: ComponentCategory;
	strategy: ComponentStrategy;
	docs?: ComponentDocs;
	reviewedGuidance?: ReviewedComponentGuidance;
	sources?: {
		scss?: string[];
		stories?: string[];
	};
	htmlCanonical?: string;
	warnings?: string[];
};

export type TokenSnapshot = {
	colors: string[];
	spacing: string[];
	rawVariables: string[];
};

export type Registry = {
	manifestVersion: string;
	generatedAt: string;
	tokens: TokenSnapshot;
	components: ComponentInfo[];
	byId: Map<string, ComponentInfo>;
};

export type RegistryManifest = {
	manifestVersion: string;
	generatedAt: string;
	sourceRoot: string;
	tokens: TokenSnapshot;
	components: ComponentInfo[];
};

export type ValidationIssue = {
	ruleId: string;
	severity: "error" | "warning";
	message: {
		en: string;
		de: string;
	};
	selectorHint?: string;
};

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

/** Valid icon names from the KERN UX icon inventory */
export const VALID_ICON_NAMES = [
	"add",
	"arrow-down",
	"arrow-up",
	"arrow-forward",
	"arrow-back",
	"autorenew",
	"calendar-today",
	"check",
	"checklist",
	"chevron-left",
	"chevron-right",
	"close",
	"content-copy",
	"danger",
	"delete",
	"download",
	"draft",
	"drive-folder-upload",
	"easy-language",
	"edit",
	"home",
	"help",
	"info",
	"keyboard-double-arrow-left",
	"keyboard-double-arrow-right",
	"logout",
	"mail",
	"more-vert",
	"open-in-new",
	"question-mark",
	"search",
	"sign-language",
	"success",
	"visibility",
	"visibility-off",
	"warning",
	"brightness-medium",
	"light-mode",
	"dark-mode",
] as const;

export type IconName = (typeof VALID_ICON_NAMES)[number];

/** Check if a string is a valid icon name */
export function isValidIconName(name: string): name is IconName {
	return VALID_ICON_NAMES.includes(name as IconName);
}
