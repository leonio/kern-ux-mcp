import type { Client } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { MCP_ERAS } from "../test-support/mcp.js";
import { readSkillFiles } from "../test-support/skills.js";
import { FIGMA_TOOLS } from "../ux/figma/tool.js";
import { getCatalog } from "./catalog.js";

/**
 * Every tool name and kern:// or skill:// URI the server writes, in the
 * instructions, the tool listing, the cards and the skills, is one it serves.
 * The names found go in a snapshot, so a new mention shows up in review; a tool's or card's mention
 * of itself is checked but left out of it.
 */

const TOOL_NAME = /\b(?:get|list|plan|render|validate)_[a-z][a-z_]*[a-z]\b/g;

/** Tools of Figma's MCP server, which plan_figma_design names. */
const FIGMA_TOOL_NAMES: ReadonlySet<string> = new Set(
	Object.values(FIGMA_TOOLS),
);
const KERN_URI = /kern:\/\/[a-z]+\/(?:\{[a-z]+\}|[a-z0-9-]+)/g;
const SKILL_URI = /skill:\/\/[a-z0-9-]+\/[A-Za-z0-9._/-]*[A-Za-z0-9_]/g;

describe("names in the server's text", () => {
	const { resources } = getCatalog();
	let client: Client;
	/** Each source's text and its own name or URI, by a name for the report. */
	const sources = new Map<string, { text: string; own?: string }>();
	let toolNames: Set<string>;
	let templates: Set<string>;

	beforeAll(async () => {
		const setup = MCP_ERAS[0];
		if (!setup) throw new Error("No MCP setup.");
		client = await setup.connect();

		sources.set("instructions", { text: client.getInstructions() ?? "" });
		const { tools } = await client.listTools();
		toolNames = new Set(tools.map((tool) => tool.name));
		for (const { name, ...listed } of tools) {
			sources.set(`tool ${name}`, { text: JSON.stringify(listed), own: name });
		}
		const { resourceTemplates } = await client.listResourceTemplates();
		templates = new Set(resourceTemplates.map((t) => t.uriTemplate));

		for (const resource of resources) {
			for (const entry of await resource.entries()) {
				sources.set(entry.uri, {
					text: (await resource.read(entry.value)) ?? "",
					own: entry.uri,
				});
			}
		}
		for (const file of await readSkillFiles()) {
			sources.set(`skills/${file.path}`, { text: file.text });
		}
	});

	afterAll(async () => {
		await client?.close();
	});

	/** Every match in every source; for the snapshot, without self-mentions. */
	const found = (pattern: RegExp, { withOwn = true } = {}) =>
		[
			...new Set(
				[...sources.values()].flatMap(({ text, own }) =>
					[...text.matchAll(pattern)]
						.map(([match]) => match)
						.filter((match) => withOwn || match !== own),
				),
			),
		].sort();

	it("reads every source", () => {
		expect(sources.size).toBeGreaterThan(50);
		for (const [source, { text }] of sources) {
			expect(text, source).toMatch(/\S/);
		}
	});

	it("names only tools the server lists", () => {
		const unknown = [...sources].flatMap(([source, { text }]) =>
			[...text.matchAll(TOOL_NAME)]
				.map(([name]) => name)
				.filter((name) => !toolNames.has(name) && !FIGMA_TOOL_NAMES.has(name))
				.map((name) => `${source}: ${name}`),
		);

		expect(unknown).toEqual([]);
	});

	it("links only resources that read, and templates the server lists", async () => {
		const broken: string[] = [];
		for (const uri of [...found(KERN_URI), ...found(SKILL_URI)]) {
			if (uri.includes("{")) {
				if (!templates.has(uri)) broken.push(uri);
				continue;
			}
			try {
				await client.readResource({ uri });
			} catch {
				broken.push(uri);
			}
		}

		expect(broken).toEqual([]);
	});

	it("records the names it found", async () => {
		await expect(
			`${JSON.stringify(
				{
					tools: found(TOOL_NAME, { withOwn: false }),
					uris: found(KERN_URI, { withOwn: false }),
					skillUris: found(SKILL_URI, { withOwn: false }),
				},
				null,
				"\t",
			)}\n`,
		).toMatchFileSnapshot("__snapshots__/names-in-text.json");
	});
});
