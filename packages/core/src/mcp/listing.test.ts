import type { Client } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MCP_ERAS } from "../test-support/mcp.js";
import domainListing from "../ux/__snapshots__/tools-list.json" with {
	type: "json",
};
import { getCatalog } from "./catalog.js";
import { kernInputSchema } from "./kern-schema.js";

/**
 * The listing as clients receive it. packages/core/src/ux/__snapshots__/tools-list.json is
 * the domain contract (names, descriptions, JSON input schemas); these tests
 * check that SDK v2 delivers exactly that on both eras, and snapshot the raw
 * 2026-07-28 wire listing so SDK-added fields show up in review.
 *
 * Update the wire snapshot with `npx vitest run -u packages/core/src/mcp/listing.test.ts`.
 */

function deepFreeze<T>(value: T): T {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const child of Object.values(value)) {
			deepFreeze(child);
		}
	}
	return value;
}

beforeAll(() => {
	// The adapter hands the SDK the same memoised objects on every tools/list.
	// Frozen, any mutation by the SDK throws (ES modules run in strict mode).
	for (const tool of getCatalog().tools) {
		deepFreeze(
			kernInputSchema(tool)["~standard"].jsonSchema.input({
				target: "draft-2020-12",
			}),
		);
	}
});

describe.each(MCP_ERAS)("tools/list over $era", ({ era, connect }) => {
	let client: Client;

	beforeAll(async () => {
		client = await connect();
	});

	afterAll(async () => {
		await client?.close();
	});

	it("matches the domain listing tool for tool, ignoring key order", async () => {
		// JSON round-trip: the in-memory transport doesn't serialize, so it would
		// carry keys set to undefined (title, annotations, ...) that no wire has.
		const { tools } = JSON.parse(JSON.stringify(await client.listTools()));

		expect(tools.map((tool: { name: string }) => tool.name)).toEqual(
			domainListing.map((tool) => tool.name),
		);
		for (const expected of domainListing) {
			const actual = tools.find(
				(tool: { name: string }) => tool.name === expected.name,
			);
			expect(actual, expected.name).toEqual(expected);
		}
	});

	if (era === "2026-07-28") {
		it("matches the wire snapshot", async () => {
			const listing = JSON.parse(JSON.stringify(await client.listTools()));

			await expect(`${JSON.stringify(listing, null, 2)}\n`).toMatchFileSnapshot(
				"__snapshots__/mcp-tools-list.json",
			);
		});
	}
});
