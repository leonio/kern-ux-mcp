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
	manifestVersion: "2.0.0",
	generatedAt: "2026-10-03T09:09:48Z",
	upstream: {
		package: "@kern-ux/native",
		version: "2.8.2",
		commit: "c098170a2a9657bc08d5adc1f8f9ae175aee1a64",
		bundleVersion: "0.2.0",
	},
	tokens: { colors: [], spacing: [], rawVariables: [] },
	icons: ["add", "arrow-down"],
	classes: { exact: ["kern-btn", "kern-flex"], responsive: ["kern-flex"] },
	components: [
		{ id: "button", kernId: "button", title: "Button", status: "stable" },
		{
			id: "dropdown",
			kernId: "dropdown",
			title: "Dropdown",
			status: "experimental",
		},
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
		expect(issuePaths(manifest())).toEqual([]);
	});

	it("accepts a docs-only component with the bundle's knowledge", () => {
		expect(
			issuePaths(
				manifest({
					components: [
						{
							id: "notificationbanner",
							kernId: "notification-banner",
							title: "Notification Banner",
							status: "docs-only",
							summary: "Shows a site-wide message above the page.",
							knowledge: {
								similar: [{ id: "alert" }, { name: "Toast" }],
								whenNotToUse: [
									{ text: "For one form field.", useInstead: "alert" },
								],
							},
							docs: {
								url: "https://www.kern-ux.de/komponenten/notification-banner",
								sections: [
									{
										heading: "Kurzbeschreibung",
										url: "https://www.kern-ux.de/komponenten/notification-banner#kurzbeschreibung",
									},
								],
							},
							accessibility: [
								{
									criterion: "4.1.3",
									slug: "status-messages",
									level: "AA",
									status: "implementation-dependent",
								},
							],
						},
					],
				}),
			),
		).toEqual([]);
	});

	it.each([
		["another major version", { manifestVersion: "1.0.0" }, "manifestVersion"],
		[
			"a version that isn't semver",
			{ manifestVersion: "2" },
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

	it("rejects KERN's hyphenated IDs: the registry uses ours", () => {
		expect(
			issuePaths(
				manifest({
					components: [
						{ id: "input-text", title: "Input Text", status: "stable" },
					],
				}),
			),
		).toEqual(["components.0.id"]);
	});

	it("rejects a summary longer than the bundle allows", () => {
		expect(
			issuePaths(
				manifest({
					components: [
						{
							id: "button",
							title: "Button",
							status: "stable",
							summary: "x".repeat(161),
						},
					],
				}),
			),
		).toEqual(["components.0.summary"]);
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
			registryFromManifest(manifest({ manifestVersion: "1.0.0" })),
		).toThrow(
			"registry.json has manifestVersion 1.0.0, but this server reads contract major 2.",
		);
	});

	it("refuses a manifest without components", () => {
		expect(() => registryFromManifest({ manifestVersion: "2.0.0" })).toThrow(
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
