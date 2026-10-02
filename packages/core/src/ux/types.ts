import type {
	ComponentInfo,
	ReviewedComponentGuidance,
	TokenSnapshot,
	UpstreamSource,
} from "./registry.schema.js";

export type Locale = "de" | "en";

// The registry types derive from the contract in registry.schema.ts.
export type {
	ComponentCategory,
	ComponentDocs,
	ComponentInfo,
	ComponentStatus,
	ComponentStrategy,
	GuidanceEvidenceKind,
	GuidanceSection,
	RegistryManifest,
	ReviewedComponentGuidance,
	ReviewedGuidanceEvidenceRef,
	ReviewedGuidanceStatement,
	ReviewedGuidanceStatus,
	TokenSnapshot,
	UpstreamSource,
} from "./registry.schema.js";

/** The retired guidance overlay (docs/guidance-overlay.json), read by tools/manifest. */
export type GuidanceOverlayManifest = {
	overlayVersion: string;
	generatedAt?: string;
	components: Record<string, ReviewedComponentGuidance>;
};

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
