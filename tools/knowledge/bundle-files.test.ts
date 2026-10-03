import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
	checkKnowledgeBundle,
	staleToolHints,
} from "../../packages/core/src/ux/knowledge-import.js";
import { projectRegistry } from "../../packages/core/src/ux/knowledge-projection.js";
import {
	checkAgainstPackerSchema,
	PACKER_SCHEMA_FILE,
	packerSchemaDef,
	readBundleDir,
} from "./bundle-files.js";

const KNOWLEDGE = fileURLToPath(new URL("../../knowledge/", import.meta.url));
const REGISTRY = fileURLToPath(
	new URL("../../packages/core/src/ux/registry.json", import.meta.url),
);

describe("packerSchemaDef", () => {
	it.each([
		["index.json", "index"],
		["report.json", "report"],
		["components/button.json", "component"],
		["components/button.examples.json", "examplesFile"],
		["patterns/header.json", "pattern"],
		["foundations/icons.json", "icons"],
		["foundations/classes.json", "classes"],
		["foundations/utilities.json", "utilities"],
		["foundations/layout.json", "foundation"],
		[PACKER_SCHEMA_FILE, undefined],
	])("files %s under %s", (file, def) => {
		expect(packerSchemaDef(file)).toBe(def);
	});
});

describe("the checked-in knowledge/", async () => {
	const { json } = await readBundleDir(KNOWLEDGE);

	it("is read with paths relative to its root", () => {
		expect(json.has("index.json")).toBe(true);
		expect(json.has("components/button.json")).toBe(true);
	});

	it("fits the packer's schema that ships with it", () => {
		expect(checkAgainstPackerSchema(json)).toEqual([]);
	});

	it("passes the checks this repo makes", () => {
		expect(checkKnowledgeBundle(json)).toEqual([]);
	});

	it("still has the text every tool hint was written from (the tool-hints skill)", () => {
		expect(staleToolHints(json)).toEqual([]);
	});

	it("is what registry.json was generated from (npm run knowledge:import)", () => {
		const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));

		expect(projectRegistry(json, registry.tokens)).toEqual(registry);
	});

	it("reports a document the packer's schema rejects", () => {
		const broken = new Map(json);
		broken.set("components/badge.json", {
			...(json.get("components/badge.json") as object),
			status: "beta",
		});

		expect(checkAgainstPackerSchema(broken)).toEqual([
			"components/badge.json/status: must be equal to one of the allowed values",
		]);
	});

	it("needs the packer's schema", () => {
		const withoutSchema = new Map(json);
		withoutSchema.delete(PACKER_SCHEMA_FILE);

		expect(checkAgainstPackerSchema(withoutSchema)).toEqual([
			`${PACKER_SCHEMA_FILE} is missing: a bundle carries the schema it was written against.`,
		]);
	});
});
