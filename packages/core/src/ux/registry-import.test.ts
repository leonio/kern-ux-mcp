import { describe, expect, it } from "vitest";

import checkedIn from "./registry.json" with { type: "json" };
import type { RegistryManifest } from "./registry.schema.js";
import {
	checkRegistryImport,
	formatRegistryImportReport,
	isRegistryImportable,
} from "./registry-import.js";

type Candidate = RegistryManifest & Record<string, unknown>;

/** A copy of the checked-in registry, changed by `edit`. */
const candidate = (edit: (registry: Candidate) => void = () => {}) => {
	const copy = structuredClone(checkedIn) as unknown as Candidate;
	edit(copy);
	return copy;
};

describe("checkRegistryImport", () => {
	it("finds nothing to change in the current registry", () => {
		const report = checkRegistryImport(candidate(), checkedIn);

		expect(isRegistryImportable(report)).toBe(true);
		expect(report.changes).toEqual({
			components: [44, 44],
			added: [],
			removed: [],
			changed: [],
		});
		expect(report.unknownKeys).toEqual([]);
		expect(report.documentedOnly).toEqual(["index"]);
		expect(formatRegistryImportReport(report)).toBe(
			[
				"The registry fits the contract.",
				"components: 44 -> 44",
				"documented only, no tool: index",
			].join("\n"),
		);
	});

	it("reports added, removed and changed components, and new versions", () => {
		const report = checkRegistryImport(
			candidate((registry) => {
				registry.manifestVersion = "1.1.0";
				registry.upstream = {
					package: "@kern-ux/native",
					version: "2.9.0",
					commit: "abc1234",
				};
				registry.components = registry.components.filter(
					(c) => c.id !== "index",
				);
				registry.components.push({
					id: "tabs",
					title: "Tabs",
					status: "experimental",
				});
				const button = registry.components.find((c) => c.id === "button");
				if (button) {
					button.htmlCanonical = '<button class="kern-btn">Senden</button>';
					button.title = "Button";
				}
				registry.tokens.colors = [
					...registry.tokens.colors.slice(1),
					"--kern-color-new",
					"--kern-color-newer",
				];
			}),
			checkedIn,
		);

		expect(isRegistryImportable(report)).toBe(true);
		expect(report.changes).toEqual({
			manifestVersion: ["1.0.0", "1.1.0"],
			upstream: [
				"@kern-ux/native@2.8.2 (cf2a17b)",
				"@kern-ux/native@2.9.0 (abc1234)",
			],
			tokens: "colors +2 -1",
			components: [44, 44],
			added: ["tabs"],
			removed: ["index"],
			changed: [{ id: "button", fields: ["htmlCanonical"] }],
		});
		expect(report.documentedOnly).toEqual(["tabs"]);
		expect(formatRegistryImportReport(report)).toContain(
			[
				"manifestVersion: 1.0.0 -> 1.1.0",
				"upstream: @kern-ux/native@2.8.2 (cf2a17b) -> @kern-ux/native@2.9.0 (abc1234)",
				"components: 44 -> 44",
				"  added: tabs",
				"  removed: index",
				"  changed: button (htmlCanonical)",
				"tokens: colors +2 -1",
			].join("\n"),
		);
	});

	it("doesn't count reordered keys as a change", () => {
		const report = checkRegistryImport(
			candidate((registry) => {
				const kopfzeile = registry.components.find((c) => c.id === "kopfzeile");
				if (kopfzeile?.docs) {
					const { excerpt, sections } = kopfzeile.docs;
					kopfzeile.docs = { sections, excerpt };
				}
			}),
			checkedIn,
		);

		expect(report.changes.changed).toEqual([]);
	});

	it("lists unknown keys once per path, with a count", () => {
		const report = checkRegistryImport(
			candidate((registry) => {
				registry.generator = { name: "kern-ux-scraper" };
				for (const component of registry.components) {
					Object.assign(component, { summary: { en: "One sentence." } });
				}
			}),
			checkedIn,
		);

		expect(isRegistryImportable(report)).toBe(true);
		expect(report.unknownKeys).toEqual([
			{ key: "components[].summary", count: 44 },
			{ key: "generator", count: 1 },
		]);
		expect(formatRegistryImportReport(report)).toContain(
			"unknown keys (accepted, not read): components[].summary (44), generator",
		);
	});

	it("stops when a component that has a tool is missing", () => {
		const report = checkRegistryImport(
			candidate((registry) => {
				registry.components = registry.components.filter(
					(c) => c.id !== "button" && c.id !== "grid",
				);
			}),
			checkedIn,
		);

		expect(isRegistryImportable(report)).toBe(false);
		expect(report.missingToolComponents).toEqual(["button", "grid"]);
		expect(formatRegistryImportReport(report)).toContain(
			"Missing components that have a tool (the server wouldn't start): button, grid",
		);
	});

	it("stops at contract issues and lists them", () => {
		const report = checkRegistryImport(
			candidate((registry) => {
				registry.manifestVersion = "2.0.0";
				Object.assign(registry.upstream, { version: undefined });
			}),
			checkedIn,
		);

		expect(isRegistryImportable(report)).toBe(false);
		expect(report.issues).toEqual([
			"manifestVersion: Invalid string: must match pattern /^1\\.\\d+\\.\\d+$/",
			"upstream.version: Invalid input: expected string, received undefined",
		]);
		expect(formatRegistryImportReport(report)).toMatch(
			/^The registry doesn't fit the contract \(2 issues\):\n {2}manifestVersion: /,
		);
	});

	it("reports a candidate that isn't an object at the root", () => {
		const report = checkRegistryImport([], checkedIn);

		expect(report.issues).toEqual([
			"(root): Invalid input: expected object, received array",
		]);
		expect(formatRegistryImportReport(report)).toMatch(/\(1 issue\):/);
	});
});
