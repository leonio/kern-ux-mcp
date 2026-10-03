import {
	type BundleComponent,
	type BundleComponentStatus,
	type BundleExample,
	type BundleExamplesFile,
	type BundleIndex,
	type BundleReport,
	KNOWLEDGE_BUNDLE_MAJOR,
} from "./knowledge-bundle.js";
import {
	type BundleExampleRef,
	componentIdFromKernId,
	FALLBACK_EXAMPLES,
} from "./knowledge-map.js";
import { COMPONENT_TOOL_IDS } from "./tool-builders/component-tools.js";

/**
 * A bundle as read from disk: each JSON file by its path relative to the bundle
 * root, with forward slashes (components/button.json). Build-time only: the
 * server never loads this module.
 */
export type KnowledgeBundleFiles = ReadonlyMap<string, unknown>;

/** The statuses the tools know how to show; a new one needs code first. */
const KNOWN_STATUSES: readonly BundleComponentStatus[] = [
	"stable",
	"experimental",
	"deprecated",
	"docs-only",
];

/**
 * The checks only this repo can make, on a bundle that already validates
 * against the packer's own schema: the major version is one we read, the index
 * matches the files, every component tool finds its component, and the
 * examples picked for the fallback tools exist. Returns the problems found;
 * any of them stops an import.
 */
export function checkKnowledgeBundle(files: KnowledgeBundleFiles): string[] {
	const index = files.get("index.json") as BundleIndex | undefined;
	if (!index) return ["index.json is missing."];

	const problems: string[] = [];

	const major = Number(index.bundleVersion.split(".")[0]);
	if (major !== KNOWLEDGE_BUNDLE_MAJOR) {
		problems.push(
			`index.json has bundleVersion ${index.bundleVersion}, but this repo reads major ${KNOWLEDGE_BUNDLE_MAJOR}.`,
		);
	}

	for (const entry of [
		...index.components,
		...index.patterns,
		...index.foundations,
	]) {
		if (!files.has(entry.file)) {
			problems.push(
				`index.json lists ${entry.file}, which isn't in the bundle.`,
			);
		}
	}

	const kernIdsByComponentId = new Map<string, string[]>();
	for (const entry of index.components) {
		const component = files.get(entry.file) as BundleComponent | undefined;
		if (!component) continue;

		if (!KNOWN_STATUSES.includes(component.status)) {
			problems.push(
				`${entry.file} has status "${component.status}", which the tools don't know.`,
			);
		}

		const componentId = componentIdFromKernId(component.id);
		kernIdsByComponentId.set(componentId, [
			...(kernIdsByComponentId.get(componentId) ?? []),
			component.id,
		]);
	}

	for (const [componentId, kernIds] of kernIdsByComponentId) {
		if (kernIds.length > 1) {
			problems.push(
				`The KERN IDs ${kernIds.join(", ")} all map to ${componentId}.`,
			);
		}
	}

	for (const toolId of COMPONENT_TOOL_IDS) {
		const pick = fallbackExample(toolId);
		const fromOtherDocument =
			pick !== undefined && !pick.document.startsWith("components/");
		if (!kernIdsByComponentId.has(toolId) && !fromOtherDocument) {
			problems.push(`get_${toolId} has no component in the bundle.`);
		}
	}

	for (const [toolId, pick] of Object.entries(FALLBACK_EXAMPLES)) {
		if (!findBundleExample(files, pick)) {
			problems.push(
				`get_${toolId} returns the example ${pick.example}, which isn't in ${pick.document}.`,
			);
		}
	}

	return problems;
}

function fallbackExample(toolId: string): BundleExampleRef | undefined {
	return Object.hasOwn(FALLBACK_EXAMPLES, toolId)
		? FALLBACK_EXAMPLES[toolId as keyof typeof FALLBACK_EXAMPLES]
		: undefined;
}

/**
 * Finds an example by document and ID, including the examples a component
 * document moved to its components/<id>.examples.json.
 */
export function findBundleExample(
	files: KnowledgeBundleFiles,
	ref: BundleExampleRef,
): BundleExample | undefined {
	const document = files.get(ref.document) as
		| (Pick<BundleComponent, "examples" | "moreExamples"> & object)
		| undefined;
	if (!document) return undefined;

	const examples = [...(document.examples ?? [])];
	if (document.moreExamples) {
		const more = files.get(`components/${document.moreExamples.file}`) as
			| BundleExamplesFile
			| undefined;
		examples.push(...(more?.examples ?? []));
	}
	return examples.find((example) => example.id === ref.example);
}

/** What changed between the checked-in bundle and a new one. */
export type KnowledgeBundleDiff = {
	added: string[];
	removed: string[];
	/** Per changed file, what changed in it, down to two levels of keys. */
	changed: Array<{ file: string; changes: string[] }>;
};

/** Keys that change on every run, so a change in them says nothing. */
const IGNORED_KEYS: Readonly<Record<string, readonly string[]>> = {
	"index.json": ["generatedAt"],
};

export function diffKnowledgeBundles(
	previous: KnowledgeBundleFiles,
	next: KnowledgeBundleFiles,
): KnowledgeBundleDiff {
	const added = [...next.keys()].filter((file) => !previous.has(file)).sort();
	const removed = [...previous.keys()].filter((file) => !next.has(file)).sort();
	const changed = [...next.keys()]
		.filter((file) => previous.has(file))
		.sort()
		.flatMap((file) => {
			const ignored = IGNORED_KEYS[file] ?? [];
			const changes = describeChanges(
				withoutKeys(previous.get(file), ignored),
				withoutKeys(next.get(file), ignored),
				"",
				2,
			);
			return changes.length > 0 ? [{ file, changes }] : [];
		});
	return { added, removed, changed };
}

/** Two lines about the bundle: its version and size, and the packer's report. */
export function describeKnowledgeBundle(files: KnowledgeBundleFiles): string[] {
	const index = files.get("index.json") as BundleIndex | undefined;
	if (!index) return [];

	const lines = [
		`Bundle ${index.bundleVersion} (KERN ${index.kernVersion}): ${index.components.length} components, ${index.foundations.length} foundations, ${index.patterns.length} patterns.`,
	];
	const report = files.get("report.json") as BundleReport | undefined;
	if (report) {
		const count = (items: unknown[] | null | undefined) => items?.length ?? 0;
		lines.push(
			`Text: ${report.text.reviewed ?? 0} reviewed, ${count(report.text.stale)} stale, ${count(report.text.missing)} missing, ${count(report.text.problems)} problems. Drift: ${report.drift.length} items.`,
		);
	}
	return lines;
}

/**
 * What knowledge:import prints: the bundle, then either the problems that stop
 * the import or what changes compared with the checked-in bundle (`previous`,
 * undefined on the first import).
 */
export function formatKnowledgeImport(
	next: KnowledgeBundleFiles,
	previous: KnowledgeBundleFiles | undefined,
	problems: readonly string[],
): string {
	const lines = describeKnowledgeBundle(next);

	if (problems.length > 0) {
		lines.push(
			"",
			`The bundle can't be imported (${problems.length} ${problems.length === 1 ? "problem" : "problems"}):`,
			...problems.map((problem) => `  ${problem}`),
		);
		return lines.join("\n");
	}

	if (!previous) {
		lines.push("", `First import: ${next.size} files.`);
		return lines.join("\n");
	}

	const diff = diffKnowledgeBundles(previous, next);
	if (
		diff.added.length === 0 &&
		diff.removed.length === 0 &&
		diff.changed.length === 0
	) {
		lines.push("", "No changes.");
		return lines.join("\n");
	}

	lines.push("");
	if (diff.added.length > 0) lines.push(`Added: ${diff.added.join(", ")}`);
	if (diff.removed.length > 0) {
		lines.push(`Removed: ${diff.removed.join(", ")}`);
	}
	if (diff.changed.length > 0) {
		lines.push("Changed:");
		for (const { file, changes } of diff.changed) {
			lines.push(`  ${file}`, ...changes.map((change) => `    ${change}`));
		}
	}
	return lines.join("\n");
}

/**
 * Where two values differ, as key paths: "status: \"stable\" -> \"deprecated\""
 * for a scalar, "examples (8 -> 10 items)" for a list that grew, and the path
 * alone otherwise. Goes `depth` levels into objects.
 */
function describeChanges(
	before: unknown,
	after: unknown,
	path: string,
	depth: number,
): string[] {
	if (stableJson(before) === stableJson(after)) return [];
	if (before === undefined) return [`${path} (new)`];
	if (after === undefined) return [`${path} (gone)`];

	if (isRecord(before) && isRecord(after) && depth > 0) {
		const keys = [
			...new Set([...Object.keys(before), ...Object.keys(after)]),
		].sort();
		return keys.flatMap((key) =>
			describeChanges(
				before[key],
				after[key],
				path ? `${path}.${key}` : key,
				depth - 1,
			),
		);
	}
	if (Array.isArray(before) && Array.isArray(after)) {
		return [
			before.length === after.length
				? path
				: `${path} (${before.length} -> ${after.length} items)`,
		];
	}
	if (!isObject(before) && !isObject(after)) {
		return [`${path}: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`];
	}
	return [path];
}

function withoutKeys(value: unknown, keys: readonly string[]): unknown {
	if (keys.length === 0 || !isRecord(value)) return value;
	return Object.fromEntries(
		Object.entries(value).filter(([key]) => !keys.includes(key)),
	);
}

/** JSON with object keys sorted, so key order alone isn't a change. */
function stableJson(value: unknown): string {
	return JSON.stringify(value, (_key, item: unknown) =>
		isRecord(item)
			? Object.fromEntries(
					Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
				)
			: item,
	);
}

function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return isObject(value) && !Array.isArray(value);
}
