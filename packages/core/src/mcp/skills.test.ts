import { type Client, ProtocolError } from "@modelcontextprotocol/client";
import {
	SKILLS_EXTENSION_ID,
	SkillsClient,
} from "@modelcontextprotocol/client/ext/skills";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { MCP_ERAS } from "../test-support/mcp.js";
import { getCatalog } from "./catalog.js";
import { catalogFiles } from "./skills.js";

/**
 * The skills over a real MCP client/server pair, on both protocol eras,
 * through the SDK's SkillsClient, which checks every file it reads against
 * the entry's size and digest, and SKILL.md's frontmatter against the entry's.
 */

const files = await catalogFiles(getCatalog().skills);
const FORMS = "skill://kern-ux-forms/SKILL.md";

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

	it("declares the Skills extension with directory reads", () => {
		expect(skills.supported).toBe(true);
		expect(client.getServerCapabilities()?.extensions).toEqual({
			[SKILLS_EXTENSION_ID]: { directoryRead: true },
		});
	});

	it("lists each skill with its frontmatter and files, cacheable for an hour on 2026-07-28 only", async () => {
		const listing = await skills.list();

		expect(listing.invalid).toEqual([]);
		expect(listing.skills.map((skill) => skill.uri)).toEqual([FORMS]);
		expect(listing.skills[0]?.frontmatter).toMatchObject({
			name: "kern-ux-forms",
			license: "EUPL-1.2",
		});
		expect(listing.skills[0]?.resources).toEqual(
			[
				FORMS,
				"skill://kern-ux-forms/references/forms-guide.md",
				"skill://kern-ux-forms/references/inputs.md",
				"skill://kern-ux-forms/references/steps.md",
			].map((uri) => ({
				uri,
				digest: expect.stringMatching(/^sha256:[\da-f]{64}$/),
				size: expect.any(Number),
			})),
		);
		if (era === "2026-07-28") {
			expect(listing).toMatchObject({ ttlMs: 3_600_000, cacheScope: "public" });
		} else {
			expect(listing.ttlMs).toBeUndefined();
			expect(listing.cacheScope).toBeUndefined();
		}
	});

	it("reads and verifies every file of a skill, as it was built", async () => {
		const { skill } = await skills.get(FORMS);
		const skillMd = await skills.read(skill);

		expect(skillMd).toMatchObject({
			verified: true,
			mimeType: "text/markdown",
		});
		expect(skillMd.body?.trimStart()).toMatch(/^# Build a KERN form\n/);
		for (const path of [
			"SKILL.md",
			"references/inputs.md",
			"references/steps.md",
			"references/forms-guide.md",
		]) {
			const file = await skills.read(skill, path);

			expect(file.verified, path).toBe(true);
			expect(file.text, path).toBe(files[`kern-ux-forms/${path}`]);
		}
	});

	it("lists a skill's folder", async () => {
		const { resources } = await skills.readDirectory("skill://kern-ux-forms");

		expect(resources.map((resource) => resource.uri)).toEqual([
			FORMS,
			"skill://kern-ux-forms/references",
		]);
	});

	it("rejects a skill it doesn't serve", async () => {
		await expect(
			skills.get("skill://kern-ux-nope/SKILL.md"),
		).rejects.toBeInstanceOf(ProtocolError);
	});
});
