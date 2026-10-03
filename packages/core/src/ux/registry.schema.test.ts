import { describe, expect, it } from "vitest";
import { registryFromManifest } from "./registry.js";
import checkedIn from "./registry.json" with { type: "json" };
import {
	type RegistryManifest,
	RegistryManifestSchema,
} from "./registry.schema.js";

const manifest = (
	overrides: Partial<RegistryManifest> = {},
): RegistryManifest => ({
	manifestVersion: "1.0.0",
	generatedAt: "2026-10-02T08:00:00.000Z",
	upstream: { package: "@kern-ux/native", version: "2.8.2", commit: "cf2a17b" },
	tokens: { colors: [], spacing: [], rawVariables: [] },
	components: [
		{ id: "button", title: "Button", status: "stable" },
		{ id: "dropdown", title: "Dropdown", status: "experimental" },
	],
	...overrides,
});

const issuePaths = (input: unknown) => {
	const result = RegistryManifestSchema.safeParse(input);
	return result.success
		? []
		: result.error.issues.map((issue) => issue.path.join("."));
};

describe("RegistryManifestSchema", () => {
	it("accepts a minimal manifest", () => {
		expect(RegistryManifestSchema.safeParse(manifest()).success).toBe(true);
	});

	it("accepts the fields the server no longer reads", () => {
		const result = RegistryManifestSchema.safeParse(
			manifest({
				components: [
					{
						id: "heading",
						title: "Heading",
						status: "stable",
						category: "foundational",
						strategy: "typography",
						warnings: ["No canonical story template extracted for heading."],
					},
				],
			}),
		);

		expect(result.success).toBe(true);
	});

	it("accepts unknown keys and strips them", () => {
		const input = {
			...manifest(),
			generator: { name: "kern-ux-scraper" },
			components: [
				{
					id: "button",
					title: "Button",
					status: "stable",
					summary: { en: "…" },
				},
			],
		};
		const result = RegistryManifestSchema.parse(input);

		expect(result).not.toHaveProperty("generator");
		expect(result.components[0]).not.toHaveProperty("summary");
	});

	it.each([
		["another major version", { manifestVersion: "2.0.0" }, "manifestVersion"],
		[
			"a version that isn't semver",
			{ manifestVersion: "1" },
			"manifestVersion",
		],
		["a date that isn't ISO 8601", { generatedAt: "yesterday" }, "generatedAt"],
		[
			"an upstream without a version",
			{ upstream: { package: "@kern-ux/native", version: "" } },
			"upstream.version",
		],
	])("rejects %s", (_label, overrides, path) => {
		expect(
			issuePaths(manifest(overrides as Partial<RegistryManifest>)),
		).toEqual([path]);
	});

	it("rejects component IDs that can't be tool names", () => {
		expect(
			issuePaths(
				manifest({
					components: [
						{ id: "Input Text", title: "Input Text", status: "stable" },
					],
				}),
			),
		).toEqual(["components.0.id"]);
	});

	it("rejects duplicate component IDs at the duplicate", () => {
		expect(
			issuePaths(
				manifest({
					components: [
						{ id: "button", title: "Button", status: "stable" },
						{ id: "link", title: "Link", status: "stable" },
						{ id: "button", title: "Button 2", status: "stable" },
					],
				}),
			),
		).toEqual(["components.2.id"]);
	});
});

describe("registryFromManifest", () => {
	it("sorts and indexes the components", () => {
		const registry = registryFromManifest(manifest());

		expect(registry.components.map((c) => c.id)).toEqual([
			"button",
			"dropdown",
		]);
		expect(registry.byId.get("dropdown")?.status).toBe("experimental");
		expect(registry.upstream?.version).toBe("2.8.2");
	});

	it("refuses another contract major", () => {
		expect(() =>
			registryFromManifest(manifest({ manifestVersion: "2.0.0" })),
		).toThrow(
			"registry.json has manifestVersion 2.0.0, but this server reads contract major 1.",
		);
	});

	it("refuses a manifest without components", () => {
		expect(() => registryFromManifest({ manifestVersion: "1.0.0" })).toThrow(
			'expected keys "manifestVersion" and "components"',
		);
	});
});

describe("the checked-in registry.json", () => {
	it("fits the contract", () => {
		const result = RegistryManifestSchema.safeParse(checkedIn);
		const issues = result.success
			? []
			: result.error.issues.map(
					(issue) => `${issue.path.join(".")}: ${issue.message}`,
				);

		expect(issues).toEqual([]);
	});
});
