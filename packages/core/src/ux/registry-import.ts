import {
	type RegistryManifest,
	RegistryManifestSchema,
} from "./registry.schema.js";
import { COMPONENT_TOOL_IDS } from "./tool-builders/component-tools.js";

/**
 * What `npm run registry:import` found in a candidate registry.json, compared
 * with the current one. Build-time only: the server never loads this module.
 */
export type RegistryImportReport = {
	/** Contract violations as "path: message". Any of them stops the import. */
	issues: string[];
	/** Components that have a tool but are missing; the server wouldn't start. */
	missingToolComponents: string[];
	/** Keys the contract doesn't know, with how often each occurs. Accepted, not read. */
	unknownKeys: Array<{ key: string; count: number }>;
	/** Components without a tool: documented by get_component_docs only. */
	documentedOnly: string[];
	changes: {
		manifestVersion?: [from: string, to: string];
		upstream?: [from: string, to: string];
		tokens?: string;
		components: [from: number, to: number];
		added: string[];
		removed: string[];
		changed: Array<{ id: string; fields: string[] }>;
	};
};

/** Whether the candidate can replace the current registry. */
export function isRegistryImportable(report: RegistryImportReport): boolean {
	return (
		report.issues.length === 0 && report.missingToolComponents.length === 0
	);
}

export function checkRegistryImport(
	candidate: unknown,
	current: unknown,
): RegistryImportReport {
	const parsed = RegistryManifestSchema.safeParse(candidate);
	if (!parsed.success) {
		return {
			issues: parsed.error.issues.map(
				(issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
			),
			missingToolComponents: [],
			unknownKeys: [],
			documentedOnly: [],
			changes: { components: [0, 0], added: [], removed: [], changed: [] },
		};
	}

	const next = parsed.data;
	// The current file is compared as it is; it fits the contract (a test says so).
	const previous = current as RegistryManifest;
	const nextIds = new Set(next.components.map((c) => c.id));
	const previousById = new Map(previous.components.map((c) => [c.id, c]));

	const unknown = new Map<string, number>();
	collectUnknownKeys(candidate, next, "", unknown);

	return {
		issues: [],
		missingToolComponents: COMPONENT_TOOL_IDS.filter((id) => !nextIds.has(id)),
		unknownKeys: [...unknown]
			.map(([key, count]) => ({ key, count }))
			.sort((x, y) => x.key.localeCompare(y.key)),
		documentedOnly: next.components
			.map((c) => c.id)
			.filter((id) => !COMPONENT_TOOL_IDS.includes(id))
			.sort(),
		changes: {
			manifestVersion: changed(previous.manifestVersion, next.manifestVersion),
			upstream: changed(
				describeUpstream(previous.upstream),
				describeUpstream(next.upstream),
			),
			tokens: describeTokenChange(previous.tokens, next.tokens),
			components: [previous.components.length, next.components.length],
			added: [...nextIds].filter((id) => !previousById.has(id)).sort(),
			removed: [...previousById.keys()].filter((id) => !nextIds.has(id)).sort(),
			changed: next.components
				.flatMap((component) => {
					const before = previousById.get(component.id);
					if (!before) return [];
					const fields = [
						...new Set([...Object.keys(before), ...Object.keys(component)]),
					]
						.filter(
							(field) =>
								stableJson(before[field as keyof typeof before]) !==
								stableJson(component[field as keyof typeof component]),
						)
						.sort();
					return fields.length > 0 ? [{ id: component.id, fields }] : [];
				})
				.sort((a, b) => a.id.localeCompare(b.id)),
		},
	};
}

export function formatRegistryImportReport(
	report: RegistryImportReport,
): string {
	if (report.issues.length > 0) {
		return [
			`The registry doesn't fit the contract (${report.issues.length} ${report.issues.length === 1 ? "issue" : "issues"}):`,
			...report.issues.map((issue) => `  ${issue}`),
		].join("\n");
	}

	const { changes } = report;
	const lines = ["The registry fits the contract."];
	if (report.missingToolComponents.length > 0) {
		lines.push(
			`Missing components that have a tool (the server wouldn't start): ${report.missingToolComponents.join(", ")}`,
		);
	}
	if (changes.manifestVersion) {
		lines.push(`manifestVersion: ${changes.manifestVersion.join(" -> ")}`);
	}
	if (changes.upstream) {
		lines.push(`upstream: ${changes.upstream.join(" -> ")}`);
	}
	lines.push(`components: ${changes.components.join(" -> ")}`);
	if (changes.added.length > 0) {
		lines.push(`  added: ${changes.added.join(", ")}`);
	}
	if (changes.removed.length > 0) {
		lines.push(`  removed: ${changes.removed.join(", ")}`);
	}
	for (const { id, fields } of changes.changed) {
		lines.push(`  changed: ${id} (${fields.join(", ")})`);
	}
	if (changes.tokens) {
		lines.push(`tokens: ${changes.tokens}`);
	}
	if (report.documentedOnly.length > 0) {
		lines.push(`documented only, no tool: ${report.documentedOnly.join(", ")}`);
	}
	if (report.unknownKeys.length > 0) {
		lines.push(
			`unknown keys (accepted, not read): ${report.unknownKeys
				.map(({ key, count }) => (count > 1 ? `${key} (${count})` : key))
				.join(", ")}`,
		);
	}
	return lines.join("\n");
}

function changed(from: string, to: string): [string, string] | undefined {
	return from === to ? undefined : [from, to];
}

function describeUpstream(upstream: RegistryManifest["upstream"]) {
	return `${upstream.package}@${upstream.version}${upstream.commit ? ` (${upstream.commit})` : ""}`;
}

function describeTokenChange(
	before: RegistryManifest["tokens"],
	after: RegistryManifest["tokens"],
) {
	const parts = (["colors", "spacing", "rawVariables"] as const).flatMap(
		(group) => {
			const was = new Set(before[group]);
			const is = new Set(after[group]);
			const added = [...is].filter((name) => !was.has(name)).length;
			const removed = [...was].filter((name) => !is.has(name)).length;
			return added || removed ? [`${group} +${added} -${removed}`] : [];
		},
	);
	return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * Records the keys of `raw` that parsing dropped, as paths with "[]" for array
 * items ("components[].summary"), counting repeats.
 */
function collectUnknownKeys(
	raw: unknown,
	parsed: unknown,
	path: string,
	found: Map<string, number>,
) {
	if (Array.isArray(raw) && Array.isArray(parsed)) {
		raw.forEach((item, index) => {
			collectUnknownKeys(item, parsed[index], `${path}[]`, found);
		});
		return;
	}
	if (!isRecord(raw) || !isRecord(parsed)) return;
	for (const key of Object.keys(raw)) {
		const keyPath = path ? `${path}.${key}` : key;
		if (Object.hasOwn(parsed, key)) {
			collectUnknownKeys(raw[key], parsed[key], keyPath, found);
		} else {
			found.set(keyPath, (found.get(keyPath) ?? 0) + 1);
		}
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** JSON with sorted object keys, so key order alone doesn't count as a change. */
function stableJson(value: unknown): string {
	return JSON.stringify(value, (_key, item: unknown) =>
		isRecord(item)
			? Object.fromEntries(
					Object.keys(item)
						.sort()
						.map((key) => [key, item[key]]),
				)
			: item,
	);
}
