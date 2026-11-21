import type { Client } from "@modelcontextprotocol/client";
import { SkillsClient } from "@modelcontextprotocol/client/ext/skills";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { SKILL_FILES } from "../skills/files.generated.js";
import { MCP_ERAS } from "../test-support/mcp.js";
import { RELEASE_CACHE_HINT } from "./cache-hint.js";

/**
 * The skills over a real MCP client/server pair, on both protocol eras, as a
 * host reads them (SEP-2640): the capability, skills/list and skills/get, and
 * every file checked against its digest by the SDK's SkillsClient.
 */

const SKILL_NAMES = [
	...new Set(Object.keys(SKILL_FILES).map((path) => path.split("/")[0])),
].sort();

describe.each(MCP_ERAS)("MCP skills over $era", ({ era, connect }) => {
	let client: Client;
	let skills: SkillsClient;

	beforeAll(async () => {
		client = await connect();
		skills = new SkillsClient(client);
	});

	afterAll(async () => {
		await client?.close();
	});

	it("declares the Skills extension", () => {
		expect(skills.supported).toBe(true);
		expect(
			client.getServerCapabilities()?.extensions?.[
				"io.modelcontextprotocol/skills"
			],
		).toBeDefined();
	});

	it("names each skill in its instructions, by name and by URI", () => {
		const instructions = client.getInstructions() ?? "";

		for (const name of SKILL_NAMES) {
			expect(instructions).toContain(`${name} for `);
			expect(instructions).toContain(`skill://${name}/SKILL.md`);
		}
	});

	it("lists each skill with its frontmatter and every file", async () => {
		const listing = await skills.list();

		expect(listing.invalid).toEqual([]);
		expect(listing.skills.map((skill) => skill.uri)).toEqual(
			SKILL_NAMES.map((name) => `skill://${name}/SKILL.md`),
		);
		for (const skill of listing.skills) {
			const name = skill.frontmatter.name;
			expect(skill.uri).toBe(`skill://${name}/SKILL.md`);
			expect(skill.resources).not.toBe("dynamic");
			const uris = (skill.resources === "dynamic" ? [] : skill.resources)
				.map((file) => file.uri)
				.sort();
			expect(uris).toEqual(
				Object.keys(SKILL_FILES)
					.filter((path) => path.startsWith(`${name}/`))
					.map((path) => `skill://${path}`)
					.sort(),
			);
		}
	});

	it("serves every file as skills/ has it, matching its digest", async () => {
		const { skills: entries } = await skills.list();

		for (const skill of entries) {
			for (const file of skill.resources === "dynamic" ? [] : skill.resources) {
				const read = await skills.read(skill, file.uri);
				expect(read.verified).toBe(true);
				expect(new TextDecoder().decode(read.bytes)).toBe(
					SKILL_FILES[file.uri.slice("skill://".length)],
				);
			}
		}
	});

	it("gets one skill by its SKILL.md URI", async () => {
		const { skill } = await skills.get("skill://kern-forms/SKILL.md");

		expect(skill.frontmatter).toMatchObject({
			name: "kern-forms",
			license: "EUPL-1.2",
		});
	});

	it(
		era === "2026-07-28"
			? "caches like the lists: an hour, public"
			: "sends no cache fields before 2026-07-28",
		async () => {
			const listing = await skills.list();
			const got = await skills.get("skill://kern-review/SKILL.md");
			const expected =
				era === "2026-07-28"
					? { ...RELEASE_CACHE_HINT }
					: { ttlMs: undefined, cacheScope: undefined };

			expect({
				ttlMs: listing.ttlMs,
				cacheScope: listing.cacheScope,
			}).toEqual(expected);
			expect({ ttlMs: got.ttlMs, cacheScope: got.cacheScope }).toEqual(
				expected,
			);
		},
	);
});
