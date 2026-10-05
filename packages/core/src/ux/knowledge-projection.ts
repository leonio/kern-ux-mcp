import type {
	BundleAccessibilityCriterion,
	BundleClasses,
	BundleComponent,
	BundleExample,
	BundleFoundation,
	BundleIcons,
	BundleIndex,
	BundleKnowledge,
} from "./knowledge-bundle.js";
import {
	findBundleExample,
	findBundleSections,
	type KnowledgeBundleFiles,
} from "./knowledge-import.js";
import {
	type BundleSectionRange,
	componentIdFromKernId,
	FALLBACK_EXAMPLES,
	GUIDE_FOUNDATIONS,
	TOOLS_FROM_SECTIONS,
	TOOLS_WITHOUT_BUNDLE_COMPONENT,
} from "./knowledge-map.js";
import type {
	AccessibilityCriterion,
	ComponentInfo,
	ComponentKnowledge,
	FoundationInfo,
	RegistryManifest,
	TokenSnapshot,
} from "./registry.schema.js";

/** The registry contract version knowledge:import writes. */
export const REGISTRY_MANIFEST_VERSION = "2.1.0";

/**
 * registry.json from a checked bundle (checkKnowledgeBundle) and the code-owned
 * map: our component IDs, the bundle's English text as it is, accessibility per
 * criterion, the picked example for each fallback tool, the icon names and the
 * known kern-* classes. It selects; it doesn't rewrite. The tokens are carried over from the current registry until
 * the bundle has them. Build-time only.
 */
export function projectRegistry(
	files: KnowledgeBundleFiles,
	tokens: TokenSnapshot,
): RegistryManifest {
	const index = files.get("index.json") as BundleIndex;
	const plain = index.sources.find((source) => source.id === "kern-ux-plain");

	const components = index.components
		.map((entry) => files.get(entry.file) as BundleComponent)
		.filter(
			(component) =>
				!Object.hasOwn(
					TOOLS_FROM_SECTIONS,
					componentIdFromKernId(component.id),
				),
		)
		.map(projectComponent);
	for (const [id, title] of Object.entries(TOOLS_WITHOUT_BUNDLE_COMPONENT)) {
		components.push({ id, title, status: "stable" });
	}
	for (const [id, range] of Object.entries(TOOLS_FROM_SECTIONS)) {
		components.push(projectSections(files, id, range));
	}

	for (const [toolId, ref] of Object.entries(FALLBACK_EXAMPLES)) {
		const component = components.find(({ id }) => id === toolId);
		const example = findBundleExample(files, ref);
		if (!component || !example) {
			throw new Error(
				`get_${toolId}'s example ${ref.example} isn't in ${ref.document}; run checkKnowledgeBundle first.`,
			);
		}
		component.htmlCanonical = example.html.markup;
		component.sources ??= [example.html.source.path];
	}

	return {
		manifestVersion: REGISTRY_MANIFEST_VERSION,
		generatedAt: index.generatedAt,
		upstream: compact({
			package: plain?.package ?? "@kern-ux/native",
			version: plain?.version ?? index.kernVersion,
			commit: plain?.commit,
			bundleVersion: index.bundleVersion,
		}),
		tokens,
		icons: (files.get("foundations/icons.json") as BundleIcons).icons.map(
			(icon) => icon.name,
		),
		classes: projectClasses(files),
		components: components.sort((a, b) => a.id.localeCompare(b.id)),
		foundations: GUIDE_FOUNDATIONS.map((id) =>
			projectFoundation(
				files.get(`foundations/${id}.json`) as BundleFoundation,
			),
		),
	};
}

/**
 * A foundations page the guides quote: its English text, sections by ID. The
 * utilities page has no title, so its ID stands in.
 */
function projectFoundation(
	page: Omit<BundleFoundation, "title"> &
		Partial<Pick<BundleFoundation, "title">>,
): FoundationInfo {
	return compact({
		id: page.id,
		title: page.title?.en ?? page.id.charAt(0).toUpperCase() + page.id.slice(1),
		url: page.links.docs,
		summary: page.docs?.summary?.en ?? page.knowledge?.summary?.en,
		knowledge: projectKnowledge(page.knowledge),
		sections: (page.docs?.sections ?? []).map((section) =>
			compact({
				id: section.id,
				heading: section.heading,
				url: section.url,
				summary: section.summary?.en,
			}),
		),
	});
}

const BREAKPOINTS = ["sm", "md", "lg", "xl", "xxl"] as const;

/**
 * The kern-* classes validate_html knows: those kern-ux-plain's SCSS defines,
 * plus those KERN's own examples use (some aren't in the SCSS, such as
 * kern-accordion-group). A base with all five breakpoint variants is listed
 * once under responsive instead of six times, which keeps the list a third of
 * its size without accepting invented variants.
 */
function projectClasses(files: KnowledgeBundleFiles): {
	exact: string[];
	responsive: string[];
} {
	const known = new Set(
		(files.get("foundations/classes.json") as BundleClasses).classes.map(
			(entry) => entry.class,
		),
	);
	for (const document of files.values()) {
		const examples = (document as { examples?: BundleExample[] }).examples;
		for (const example of Array.isArray(examples) ? examples : []) {
			for (const [, value] of example.html.markup.matchAll(
				/class="([^"]*)"/g,
			)) {
				for (const name of value.split(/\s+/)) {
					if (name.startsWith("kern-")) known.add(name);
				}
			}
		}
	}

	const responsive = [...known].filter((base) =>
		BREAKPOINTS.every((breakpoint) => known.has(`${base}-${breakpoint}`)),
	);
	const bases = new Set(responsive);
	const exact = [...known].filter((name) => {
		const match = /^(.*)-(?:sm|md|lg|xl|xxl)$/.exec(name);
		return !match || !bases.has(match[1]);
	});
	return { exact: exact.sort(), responsive: responsive.sort() };
}

function projectComponent(component: BundleComponent): ComponentInfo {
	const synonyms = [
		...new Set([...component.synonyms.de, ...(component.synonyms.en ?? [])]),
	];
	return compact({
		id: componentIdFromKernId(component.id),
		kernId: component.id,
		title: component.title.en,
		titleDe:
			component.title.de && component.title.de !== component.title.en
				? component.title.de
				: undefined,
		status: component.status,
		group: component.group,
		synonyms: synonyms.length > 0 ? synonyms : undefined,
		links: compact({ ...component.links }),
		summary: component.knowledge?.summary?.en,
		knowledge: projectKnowledge(component.knowledge),
		docs: component.docs && {
			url: component.docs.url,
			...compact({ summary: component.docs.summary?.en }),
			sections: component.docs.sections.map((section) =>
				compact({
					heading: section.heading,
					url: section.url,
					summary: section.summary?.en,
				}),
			),
		},
		accessibility: projectAccessibility(component.accessibility ?? []),
		sources: component.implementations.html?.sources,
	});
}

/**
 * A tool's entry from a run of a foundations document's sections: the first
 * section gives the link and the docs summary, the rest are the docs sections.
 * A section summary can be longer than a component's, so there's no summary.
 */
function projectSections(
	files: KnowledgeBundleFiles,
	id: string,
	range: BundleSectionRange & { title: string },
): ComponentInfo {
	const sections = findBundleSections(files, range);
	if (!sections) {
		throw new Error(
			`get_${id}'s sections ${range.from} to ${range.to} aren't in ${range.document}; run checkKnowledgeBundle first.`,
		);
	}
	const [first, ...rest] = sections;
	return compact({
		id,
		title: range.title,
		status: "stable",
		links: { docs: first.url },
		docs: {
			url: first.url,
			...compact({ summary: first.summary?.en }),
			sections: rest.map((section) =>
				compact({
					heading: section.heading,
					url: section.url,
					summary: section.summary?.en,
				}),
			),
		},
	});
}

function projectKnowledge(
	knowledge: BundleKnowledge | undefined,
): ComponentKnowledge | undefined {
	if (!knowledge) return undefined;
	const texts = (items: Array<{ en: string }> | undefined) =>
		items && items.length > 0 ? items.map((item) => item.en) : undefined;

	const projected = compact({
		whenToUse: texts(knowledge.whenToUse),
		whenNotToUse:
			knowledge.whenNotToUse && knowledge.whenNotToUse.length > 0
				? knowledge.whenNotToUse.map((item) =>
						compact({
							text: item.en,
							useInstead:
								item.useInstead && componentIdFromKernId(item.useInstead),
						}),
					)
				: undefined,
		dos: texts(knowledge.dos),
		donts: texts(knowledge.donts),
		contentGuidelines: texts(knowledge.contentGuidelines),
		similar:
			knowledge.similar && knowledge.similar.length > 0
				? knowledge.similar.map((item) =>
						compact({
							id: item.id && componentIdFromKernId(item.id),
							name: item.name,
							difference: item.difference?.en,
						}),
					)
				: undefined,
	});
	return Object.keys(projected).length > 0 ? projected : undefined;
}

/** From the least to the most that needs an author's attention. */
const STATUS_ORDER: readonly AccessibilityCriterion["status"][] = [
	"passed",
	"unknown",
	"implementation-dependent",
	"failed",
];

/**
 * One entry per criterion. The docs list some criteria more than once, with
 * different dates and sometimes different results; the strictest result wins.
 */
function projectAccessibility(
	criteria: readonly BundleAccessibilityCriterion[],
): AccessibilityCriterion[] | undefined {
	const byKey = new Map<string, AccessibilityCriterion>();
	for (const entry of criteria) {
		const key = entry.criterion ?? entry.slug;
		const seen = byKey.get(key);
		if (!seen) {
			byKey.set(
				key,
				compact({
					criterion: entry.criterion,
					slug: entry.slug,
					level: entry.level || undefined,
					status: entry.status,
				}),
			);
		} else if (
			STATUS_ORDER.indexOf(entry.status) > STATUS_ORDER.indexOf(seen.status)
		) {
			seen.status = entry.status;
		}
	}
	const projected = [...byKey.values()].sort(compareCriteria);
	return projected.length > 0 ? projected : undefined;
}

/** WCAG numbers in numeric order (1.4.3 before 1.4.11), then the rest by slug. */
function compareCriteria(
	a: AccessibilityCriterion,
	b: AccessibilityCriterion,
): number {
	if (a.criterion && b.criterion) {
		const x = a.criterion.split(".").map(Number);
		const y = b.criterion.split(".").map(Number);
		for (let i = 0; i < Math.max(x.length, y.length); i++) {
			const difference = (x[i] ?? 0) - (y[i] ?? 0);
			if (difference !== 0) return difference;
		}
		return 0;
	}
	if (a.criterion) return -1;
	if (b.criterion) return 1;
	return a.slug.localeCompare(b.slug);
}

/** The object without its undefined values, so the JSON has no empty keys. */
function compact<T extends object>(value: T): T {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => item !== undefined),
	) as T;
}
