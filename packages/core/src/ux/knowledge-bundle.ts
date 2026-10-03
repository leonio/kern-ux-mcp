/**
 * Types for the parts of the KERN knowledge bundle this repo reads. The packer
 * (kern-ux-knowledge-packer) owns the bundle and its schema, which ships inside
 * the bundle as schema/knowledge-bundle.schema.json; knowledge:import validates
 * against that. These types mirror only the fields we read, and the packer
 * knows nothing about them. Build-time only: the server reads registry.json,
 * which the import derives from the bundle.
 */

/** The bundle's major version this repo reads. A new major can rename or drop fields. */
export const KNOWLEDGE_BUNDLE_MAJOR = 0;

/** English text written from the docs. The packer caps its length per field. */
export type BundleText = { en: string };

export type BundleProvenance = {
	origin: "generated" | "reviewed" | "pending";
	reviewed: boolean;
	stale?: boolean;
	/** The hash of the source the text was written from. Text this repo derives from it records the hash. */
	inputHash: string;
};

/** Per text path, e.g. knowledge.summary. */
export type BundleProvenanceMap = Record<string, BundleProvenance>;

export type BundleLinks = {
	docs?: string;
	figma?: string;
	source?: string;
};

export type BundleDocsDigest = {
	url: string;
	/** At most 500 characters. */
	summary?: BundleText;
	sections: Array<{
		id: string;
		/** The docs page's heading, in German. */
		heading: string;
		url: string;
		/** At most 300 characters. */
		summary?: BundleText;
	}>;
};

export type BundleKnowledge = {
	/** At most 160 characters. */
	summary?: BundleText;
	/** Each item at most 200 characters, as in the lists below. */
	whenToUse?: BundleText[];
	whenNotToUse?: Array<BundleText & { useInstead?: string }>;
	dos?: BundleText[];
	donts?: BundleText[];
	contentGuidelines?: BundleText[];
	/** A component in the bundle (id) or one KERN doesn't have (name, e.g. Tooltip). */
	similar?: Array<{ id?: string; name?: string; difference?: BundleText }>;
};

export type BundleExample = {
	id: string;
	options?: Record<string, string | boolean>;
	states?: string[];
	html: {
		markup: string;
		source: { repo: string; path: string; export?: string };
	};
};

export type BundleComponentStatus =
	| "stable"
	| "experimental"
	| "deprecated"
	| "docs-only";

/**
 * One WCAG criterion the docs record for a component. The packer numbers
 * repeated criteria by position (info-and-relationships-2), so read them by
 * criterion, never by id.
 */
export type BundleAccessibilityCriterion = {
	id: string;
	criterion?: string;
	slug: string;
	level?: "A" | "AA" | "AAA" | "";
	status: "passed" | "implementation-dependent" | "failed" | "unknown";
	obligation?: BundleText;
};

export type BundleComponent = {
	/** KERN's ID, e.g. input-text. knowledge-map.ts turns it into ours. */
	id: string;
	title: { en: string; de: string };
	status: BundleComponentStatus;
	group: string;
	synonyms: { de: string[]; en?: string[] };
	links: BundleLinks & { docs: string };
	docs?: BundleDocsDigest;
	knowledge?: BundleKnowledge;
	accessibility?: BundleAccessibilityCriterion[];
	examples?: BundleExample[];
	/** Examples that didn't fit the document, in components/<file>. */
	moreExamples?: { file: string; count: number };
	implementations: {
		html?: {
			package: string;
			version: string;
			/** Relative to the kern-ux-plain root. */
			sources: string[];
		};
	};
	provenance?: BundleProvenanceMap;
};

export type BundleExamplesFile = {
	component: string;
	examples: BundleExample[];
};

/** A foundations docs page, e.g. foundations/layout.json. */
export type BundleFoundation = {
	id: string;
	title: { en: string; de: string };
	group?: string;
	status: "documented" | "missing";
	links: BundleLinks & { docs: string };
	docs?: BundleDocsDigest;
	knowledge?: BundleKnowledge;
	provenance?: BundleProvenanceMap;
};

export type BundleIcons = {
	id: "icons";
	kernVersion: string;
	class: string;
	pattern: string;
	icons: Array<{
		name: string;
		class: string;
		keywords?: string[];
		materialSymbol?: string;
	}>;
	docs?: BundleDocsDigest;
	knowledge?: BundleKnowledge;
};

/** foundations/classes.json: every kern-* class kern-ux-plain's SCSS defines. */
export type BundleClasses = {
	id: "classes";
	classes: Array<{ class: string; kind: string; owner: string }>;
};

export type BundleUtilities = {
	id: "utilities";
	kernVersion: string;
	examples: BundleExample[];
	docs?: BundleDocsDigest;
	knowledge?: BundleKnowledge;
};

export type BundlePattern = {
	id: string;
	title: { en: string; de: string };
	status: "stub" | "documented";
	links: BundleLinks;
	components?: string[];
	examples?: BundleExample[];
	docs?: BundleDocsDigest;
	knowledge?: BundleKnowledge;
};

/** report.json: what the packer couldn't account for. Only printed at import. */
export type BundleReport = {
	text: {
		reviewed?: number;
		stale?: unknown[] | null;
		missing?: unknown[] | null;
		problems?: unknown[] | null;
	};
	drift: unknown[];
};

export type BundleIndexEntry = {
	id: string;
	title: string;
	status?: string;
	group?: string;
	/** Relative to the bundle root, e.g. components/button.json. */
	file: string;
};

export type BundleIndex = {
	bundleVersion: string;
	generatedAt: string;
	/** The KERN release the bundle describes. */
	kernVersion: string;
	sources: Array<{
		id: string;
		package: string;
		version: string;
		license: string;
		repository?: string;
		commit?: string;
	}>;
	components: BundleIndexEntry[];
	patterns: BundleIndexEntry[];
	foundations: BundleIndexEntry[];
};
