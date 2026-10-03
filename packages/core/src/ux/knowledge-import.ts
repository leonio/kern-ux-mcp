import {
	type BundleComponent,
	type BundleComponentStatus,
	type BundleExample,
	type BundleExamplesFile,
	type BundleIndex,
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
