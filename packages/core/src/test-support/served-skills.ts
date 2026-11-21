import type { Client } from "@modelcontextprotocol/client";
import { SkillsClient } from "@modelcontextprotocol/client/ext/skills";
import { expect } from "vitest";

import { SKILL_FILES } from "../skills/files.generated.js";

/**
 * What a host sees of the skills on a connected client, for the e2e tests of
 * the built servers: the extension, the instructions naming each skill, and
 * every file of skills/ read through SkillsClient, which checks its digest.
 * Test-only.
 */
export async function expectSkillsServed(client: Client): Promise<void> {
	const skills = new SkillsClient(client);
	expect(skills.supported).toBe(true);

	const { skills: entries } = await skills.list();
	const served = new Map<string, string>();
	for (const skill of entries) {
		expect(client.getInstructions()).toContain(skill.uri);
		for (const file of skill.resources === "dynamic" ? [] : skill.resources) {
			const read = await skills.read(skill, file.uri);
			expect(read.verified).toBe(true);
			served.set(
				file.uri.slice("skill://".length),
				new TextDecoder().decode(read.bytes),
			);
		}
	}
	expect(Object.fromEntries([...served].sort())).toEqual(
		Object.fromEntries(Object.entries(SKILL_FILES).sort()),
	);
}
