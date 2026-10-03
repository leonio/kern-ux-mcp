import type {
	ComponentInfo,
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

/** Names models reach for that KERN spells differently (Material Symbols, Font Awesome). */
const ICON_NAME_ALIASES: Readonly<Record<string, IconName>> = {
	"arrow-left": "arrow-back",
	"arrow-right": "arrow-forward",
	bin: "delete",
	calendar: "calendar-today",
	cancel: "close",
	copy: "content-copy",
	email: "mail",
	error: "danger",
	"external-link": "open-in-new",
	eye: "visibility",
	pencil: "edit",
	plus: "add",
	question: "question-mark",
	refresh: "autorenew",
	remove: "delete",
	trash: "delete",
	upload: "drive-folder-upload",
};

/**
 * Up to three valid icon names close to an unknown one: its hyphenated spelling
 * (arrow_forward → arrow-forward), a known alias (trash → delete), or the names
 * that share the most words with it.
 */
export function suggestIconNames(name: string): IconName[] {
	const spelled = name
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, "-");
	if (isValidIconName(spelled)) {
		return [spelled];
	}
	const alias = ICON_NAME_ALIASES[spelled];
	if (alias) {
		return [alias];
	}
	const words = spelled.split("-").filter((word) => word.length > 2);
	const shared = (icon: IconName) =>
		icon.split("-").filter((part) => words.includes(part)).length;
	const best = Math.max(0, ...VALID_ICON_NAMES.map(shared));
	return best === 0
		? []
		: VALID_ICON_NAMES.filter((icon) => shared(icon) === best).slice(0, 3);
}

/** The validation message for an unknown icon name. */
export function iconNameHint(input: unknown): string {
	const suggestions = typeof input === "string" ? suggestIconNames(input) : [];
	const didYouMean =
		suggestions.length > 0 ? ` Did you mean ${suggestions.join(", ")}?` : "";
	return `Unknown icon name.${didYouMean} list_icons has every valid name.`;
}
