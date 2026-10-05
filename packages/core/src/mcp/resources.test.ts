import { type Client, ProtocolError } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MCP_ERAS } from "../test-support/mcp.js";
import { loadRegistryFromManifest } from "../ux/registry.js";

/**
 * The resources over a real MCP client/server pair, on both protocol eras:
 * capabilities, list, templates, read, completion, cache fields and the
 * not-found error.
 */

const componentIds = loadRegistryFromManifest()
	.components.map((component) => component.id)
	.sort();

describe.each(MCP_ERAS)("MCP resources over $era", ({ era, connect }) => {
	let client: Client;

	beforeAll(async () => {
		client = await connect();
	});

	afterAll(async () => {
		await client?.close();
	});

	it("declares resources without list-changed notifications, and completions", () => {
		expect(client.getServerCapabilities()).toMatchObject({
			resources: { listChanged: false },
			completions: {},
		});
	});

	it("lists a card per component, with a title, Markdown type and size", async () => {
		const { resources } = await client.listResources();

		expect(resources.map((resource) => resource.uri)).toEqual(
			componentIds.map((id) => `kern://components/${id}`),
		);
		expect(resources.find((resource) => resource.name === "button")).toEqual({
			uri: "kern://components/button",
			name: "button",
			title: "KERN Button",
			description: expect.stringMatching(/\S/),
			mimeType: "text/markdown",
			size: expect.any(Number),
		});
	});

	it("lists the card template", async () => {
		const { resourceTemplates } = await client.listResourceTemplates();

		expect(resourceTemplates).toEqual([
			expect.objectContaining({
				name: "component-cards",
				uriTemplate: "kern://components/{id}",
				title: "KERN component cards",
				mimeType: "text/markdown",
			}),
		]);
	});

	it("reads a card as Markdown, cacheable for an hour on 2026-07-28 only", async () => {
		const result = (await client.readResource({
			uri: "kern://components/button",
		})) as Awaited<ReturnType<Client["readResource"]>> & {
			ttlMs?: number;
			cacheScope?: string;
		};

		expect(result.contents).toEqual([
			{
				uri: "kern://components/button",
				mimeType: "text/markdown",
				text: expect.stringMatching(/^# KERN Button\n/),
			},
		]);
		if (era === "2026-07-28") {
			expect(result).toMatchObject({ ttlMs: 3_600_000, cacheScope: "public" });
		} else {
			expect(result.ttlMs).toBeUndefined();
			expect(result.cacheScope).toBeUndefined();
		}
	});

	it.each([
		"kern://components/nope",
		"kern://components/input-text",
		"kern://guides/nope",
	])("rejects %s with -32602 and the URI", async (uri) => {
		const read = client.readResource({ uri });

		await expect(read).rejects.toBeInstanceOf(ProtocolError);
		await expect(read).rejects.toMatchObject({ code: -32602, data: { uri } });
	});

	it("completes the component ID", async () => {
		const result = await client.complete({
			ref: { type: "ref/resource", uri: "kern://components/{id}" },
			argument: { name: "id", value: "input" },
		});

		expect(result.completion.values).toEqual(
			componentIds.filter((id) => id.startsWith("input")),
		);
	});
});
