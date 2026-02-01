import fs from "node:fs/promises";
import path from "node:path";

import fg from "fast-glob";
import { getKernUxPlainRoot } from "../../src/ux/paths.js";
import type {
	ComponentCategory,
	ComponentInfo,
	ComponentStatus,
	ComponentStrategy,
	RegistryManifest,
	TokenSnapshot,
} from "../../src/ux/types.js";
import { loadValidatedGuidanceOverlay } from "./guidance-overlay.js";

const COMPONENTS_MD = "COMPONENTS.MD";
const CHEETSHEET_MD = "CHEETSHEET.MD";
const OUTPUT_PATH = path.resolve(process.cwd(), "src", "ux", "registry.json");

const ID_ALIASES: Record<string, string> = {
	description_list: "descriptionlist",
	input_group: "inputgroup",
	task_list: "tasklist",
};

const EXCLUDED_COMPONENT_IDS = new Set([
	"check",
	"checkboxlist", // merged into the checkbox tool
	"cssflex",
	"cssgrid",
	"gap",
	"input", // covered by inputtext, inputemail, inputdate, etc.
	"spacing",
	"stack",
	"utilityhelper",
]);

const LAYOUT_IDS = new Set([
	"grid",
	"fieldset",
	"divider",
	"kopfzeile",
	"descriptionlist",
]);

const TYPOGRAPHY_IDS = new Set([
	"heading",
	"body",
	"label",
	"link",
	"lists",
	"preline",
	"subline",
	"title",
]);

const INTERACTIVE_IDS = new Set([
	"button",
	"alert",
	"checkbox",
	"checkboxlist",
	"dialog",
	"radio",
	"select",
	"inputtext",
	"inputdate",
	"inputemail",
	"inputfile",
	"inputgroup",
	"inputnumber",
	"inputpassword",
	"inputtel",
	"inputurl",
	"loader",
	"badge",
	"textarea",
	"progress",
	"accordion",
	"card",
	"icon",
	"table",
	"summary",
	"dropdown",
	"tasklist",
]);

const PARAMETERIZED_INTERACTIVE_IDS = new Set([
	"button",
	"alert",
	"checkbox",
	"dialog",
	"radio",
	"select",
	"inputtext",
	"loader",
	"badge",
	"textarea",
	"progress",
	"accordion",
	"card",
	"icon",
	"table",
	"summary",
	"dropdown",
]);

type StoryExtract = {
	exportName: string;
	html: string;
};

type ComponentScratch = {
	id: string;
	title: string;
	status: ComponentStatus;
	storyFiles: string[];
	scssFiles: string[];
};

function titleToId(title: string) {
	return title
		.toLowerCase()
		.replace(/\([^)]*\)/g, "")
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

function normalizeComponentId(id: string) {
	return ID_ALIASES[id] ?? id;
}

function classifyComponent(id: string): {
	category: ComponentCategory;
	strategy: ComponentStrategy;
} {
	if (LAYOUT_IDS.has(id)) {
		return { category: "foundational", strategy: "layout" };
	}
	if (TYPOGRAPHY_IDS.has(id)) {
		return { category: "foundational", strategy: "typography" };
	}
	if (INTERACTIVE_IDS.has(id)) {
		return {
			category: "interactive",
			strategy: PARAMETERIZED_INTERACTIVE_IDS.has(id)
				? "interactive"
				: "fallback",
		};
	}

	return { category: "interactive", strategy: "fallback" };
}

async function extractTokenSnapshot(kernRoot: string): Promise<TokenSnapshot> {
	const tokenFiles = await fg(
		[
			"src/scss/**/*variables*.scss",
			"src/scss/**/_tokens*.scss",
			"src/scss/**/_theme*.scss",
			"src/scss/**/primitives/_colors.scss",
			"src/scss/**/primitives/_sizes.scss",
		],
		{ cwd: kernRoot, absolute: true },
	);

	if (tokenFiles.length === 0) {
		return { colors: [], spacing: [], rawVariables: [] };
	}

	const allVariableNames = new Set<string>();

	for (const filePath of tokenFiles) {
		const text = await fs.readFile(filePath, "utf8");

		// Match SCSS $variables
		for (const match of text.matchAll(/^\s*\$(?<name>[a-z0-9_-]+)\s*:/gim)) {
			const name = match.groups?.name?.trim();
			if (name) {
				allVariableNames.add(`$${name}`);
			}
		}

		// Match CSS custom properties (--kern-*)
		for (const match of text.matchAll(
			/^\s*(?<name>--kern[a-z0-9_-]*)\s*:/gim,
		)) {
			const name = match.groups?.name?.trim();
			if (name) {
				allVariableNames.add(name);
			}
		}
	}

	const rawVariables = [...allVariableNames].sort((a, b) => a.localeCompare(b));
	const colors = rawVariables.filter((name) =>
		/(color|palette|hue|brand|bg|background|darkblue|lightblue|red|green|turquoise|orange|violet|neutral|white|black)/i.test(
			name,
		),
	);
	const spacing = rawVariables.filter((name) =>
		/(space|spacing|gap|margin|padding|gutter|dimension|metric-space)/i.test(
			name,
		),
	);

	return { colors, spacing, rawVariables };
}

async function fileExists(filePath: string) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

function normalizeHtml(html: string) {
	return html.trim().replace(/\r\n/g, "\n");
}

async function extractStoryHtmlTemplates(
	storyFilePath: string,
): Promise<StoryExtract[]> {
	const text = await fs.readFile(storyFilePath, "utf8");
	const results: StoryExtract[] = [];

	const re =
		/export\s+const\s+(?<name>[A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*`(?<html>[\s\S]*?)`\s*;?/g;

	for (const match of text.matchAll(re)) {
		const exportName = match.groups?.name;
		const html = match.groups?.html;
		if (!exportName || !html) continue;
		if (!/<[a-z][\s\S]*>/i.test(html)) continue;

		results.push({
			exportName,
			html: normalizeHtml(html),
		});
	}

	return results;
}

function extractSection(
	markdown: string,
	componentId: string,
): { heading: string; content: string } | null {
	const normalizedId = componentId.toLowerCase().replace(/[_-]/g, "");

	const headingPattern = /^##\s+(.+?)(?:\s*\(experimentell\))?\s*$/gim;
	let sectionStart: { index: number; heading: string } | null = null;
	let sectionEnd: number | null = null;

	while (true) {
		const match = headingPattern.exec(markdown);
		if (match === null) {
			break;
		}

		const heading = match[1]?.trim() ?? "";
		const headingNormalized = heading.toLowerCase().replace(/[_\-\s]/g, "");

		if (
			headingNormalized === normalizedId ||
			headingNormalized.includes(normalizedId)
		) {
			sectionStart = {
				index: match.index + match[0].length,
				heading: match[0].trim(),
			};
		} else if (sectionStart && sectionEnd === null) {
			sectionEnd = match.index;
			break;
		}
	}

	if (!sectionStart) {
		return null;
	}

	const content = markdown
		.slice(sectionStart.index, sectionEnd ?? markdown.length)
		.trim();

	return { heading: sectionStart.heading, content };
}

function hasComponentLevelDeprecationNotice(
	scssText: string,
	componentId: string,
): boolean {
	const lines = scssText.split(/\r?\n/);
	const className = `kern-${componentId}`;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		const lower = line.toLowerCase();

		if (!lower.includes("deprecated") && !lower.includes("veraltet")) {
			continue;
		}

		// Ignore modifier-only notices such as "DEPRECATED: Die Klasse &--active ..."
		if (lower.includes("&--") || /\b--[a-z0-9-]+\b/.test(lower)) {
			continue;
		}

		if (
			/\b(component|komponente)\b/.test(lower) ||
			lower.includes(className) ||
			/deprecated\s*:\s*(this|die|the)\s+(component|komponente)/.test(lower) ||
			/(component|komponente).*\b(deprecated|veraltet)\b/.test(lower)
		) {
			return true;
		}
	}

	return false;
}

async function extractExperimentalIdsFromComponentsMd(kernRoot: string) {
	const mdPath = path.join(kernRoot, COMPONENTS_MD);
	const exists = await fileExists(mdPath);
	if (!exists) return new Set<string>();

	const text = await fs.readFile(mdPath, "utf8");
	const ids = new Set<string>();

	for (const match of text.matchAll(/^##\s+(.+?)\s*$/gm)) {
		const heading = match[1] ?? "";
		if (/\(experimentell\)/i.test(heading)) {
			ids.add(normalizeComponentId(titleToId(heading)));
			ids.add("dropdown");
		}
	}

	return ids;
}

async function buildManifest(): Promise<RegistryManifest> {
	const kernRoot = getKernUxPlainRoot();
	const guidanceOverlay = await loadValidatedGuidanceOverlay();

	const storyFiles = await fg(["stories/**/*.stories.js"], {
		cwd: kernRoot,
		absolute: true,
	});

	const scssComponentFiles = await fg(["src/scss/core/components/**/*.scss"], {
		cwd: kernRoot,
		absolute: true,
	});

	const componentsMdPath = path.join(kernRoot, COMPONENTS_MD);
	const cheetsheetPath = path.join(kernRoot, CHEETSHEET_MD);
	const [componentsExists, cheetsheetExists] = await Promise.all([
		fileExists(componentsMdPath),
		fileExists(cheetsheetPath),
	]);

	const [componentsMd, cheetsheetMd] = await Promise.all([
		componentsExists
			? fs.readFile(componentsMdPath, "utf8")
			: Promise.resolve(""),
		cheetsheetExists
			? fs.readFile(cheetsheetPath, "utf8")
			: Promise.resolve(""),
	]);

	const experimentalIds =
		await extractExperimentalIdsFromComponentsMd(kernRoot);
	const tokens = await extractTokenSnapshot(kernRoot);

	const byId = new Map<string, ComponentScratch>();
	const deprecatedIds = new Set<string>();

	for (const file of storyFiles) {
		const rel = path.relative(path.join(kernRoot, "stories"), file);
		const top = rel.split(path.sep)[0] ?? "";
		if (!top) continue;

		if (top.toLowerCase().endsWith(".stories.js")) {
			continue;
		}

		const id = normalizeComponentId(titleToId(top));
		if (EXCLUDED_COMPONENT_IDS.has(id)) continue;
		const current = byId.get(id) ?? {
			id,
			title: top,
			status: "stable" as const,
			storyFiles: [],
			scssFiles: [],
		};

		current.storyFiles.push(file);
		byId.set(id, current);
	}

	for (const file of scssComponentFiles) {
		const base = path
			.basename(file)
			.replace(/^_/, "")
			.replace(/\.scss$/, "");
		const id = normalizeComponentId(titleToId(base));
		if (EXCLUDED_COMPONENT_IDS.has(id)) continue;

		const current = byId.get(id) ?? {
			id,
			title: base,
			status: "stable" as const,
			storyFiles: [],
			scssFiles: [],
		};

		current.scssFiles.push(file);
		byId.set(id, current);

		const scssText = await fs.readFile(file, "utf8");
		if (hasComponentLevelDeprecationNotice(scssText, id)) {
			deprecatedIds.add(id);
			deprecatedIds.add(normalizeComponentId(base));
			deprecatedIds.add(normalizeComponentId(titleToId(base)));
		}
	}

	const components: ComponentInfo[] = [];
	const matchedOverlayIds = new Set<string>();

	for (const component of [...byId.values()].sort((a, b) =>
		a.id.localeCompare(b.id),
	)) {
		let status: ComponentStatus = "stable";
		if (experimentalIds.has(component.id)) {
			status = "experimental";
		}
		if (deprecatedIds.has(component.id)) {
			status = "deprecated";
		}

		const warnings: string[] = [];

		const storyExtracts: StoryExtract[] = [];
		for (const storyFile of component.storyFiles) {
			const extracts = await extractStoryHtmlTemplates(storyFile);
			storyExtracts.push(...extracts);
		}

		const bestTemplate =
			storyExtracts.find((item) =>
				/^(Primary|Default|DialogOpen|AlertInfo)$/i.test(item.exportName),
			) ?? storyExtracts[0];

		if (!bestTemplate) {
			warnings.push(
				`No canonical story template extracted for ${component.id}.`,
			);
		}

		const docsSections = [
			componentsMd
				? {
						source: COMPONENTS_MD,
						section: extractSection(componentsMd, component.id),
					}
				: null,
			cheetsheetMd
				? {
						source: CHEETSHEET_MD,
						section: extractSection(cheetsheetMd, component.id),
					}
				: null,
		].filter(
			(
				entry,
			): entry is {
				source: string;
				section: { heading: string; content: string } | null;
			} => entry !== null,
		);

		const excerptParts: string[] = [];
		const componentDocsSections: Array<{
			source: string;
			heading: string;
			content: string;
		}> = [];

		for (const entry of docsSections) {
			if (!entry.section) continue;
			const content = entry.section.content.trim();
			excerptParts.push(
				`[${entry.source}] ${entry.section.heading}\n${content}`,
			);
			componentDocsSections.push({
				source: entry.source,
				heading: entry.section.heading,
				content,
			});
		}

		const classification = classifyComponent(component.id);
		const reviewedGuidance = guidanceOverlay.components[component.id];
		if (reviewedGuidance) {
			matchedOverlayIds.add(component.id);
		}

		const sources: { scss?: string[]; stories?: string[] } = {};
		if (component.scssFiles.length > 0) {
			sources.scss = component.scssFiles.map((f) =>
				path.relative(kernRoot, f).replace(/\\/g, "/"),
			);
		}
		if (component.storyFiles.length > 0) {
			sources.stories = component.storyFiles.map((f) =>
				path.relative(kernRoot, f).replace(/\\/g, "/"),
			);
		}

		components.push({
			id: component.id,
			title: component.title,
			status,
			category: classification.category,
			strategy: classification.strategy,
			docs:
				excerptParts.length > 0
					? {
							excerpt: excerptParts.join("\n\n").trim(),
							sections:
								componentDocsSections.length > 0
									? componentDocsSections
									: undefined,
						}
					: undefined,
			reviewedGuidance,
			sources: Object.keys(sources).length > 0 ? sources : undefined,
			htmlCanonical: bestTemplate?.html,
			warnings,
		});
	}

	const unknownOverlayIds = Object.keys(guidanceOverlay.components).filter(
		(componentId) => !matchedOverlayIds.has(componentId),
	);
	if (unknownOverlayIds.length > 0) {
		throw new Error(
			`Guidance overlay references unknown component ids: ${unknownOverlayIds.join(", ")}.`,
		);
	}

	return {
		manifestVersion: "1.0.0",
		generatedAt: new Date().toISOString(),
		sourceRoot: kernRoot,
		tokens,
		components,
	};
}

async function main() {
	const manifest = await buildManifest();
	await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
	await fs.writeFile(
		OUTPUT_PATH,
		`${JSON.stringify(manifest, null, 2)}\n`,
		"utf8",
	);

	console.log(
		`Generated registry manifest with ${manifest.components.length} components at ${OUTPUT_PATH}`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
