import { type Client, ProtocolError } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MCP_ERAS } from "../test-support/mcp.js";

/**
 * The prompts over a real MCP client/server pair, on both protocol eras:
 * capabilities, the list, a get, argument completion, cache fields and the
 * invalid-params errors. What each prompt says is in the prompts' own tests.
 */

const FORM_ARGS = {
	purpose: "Kontaktformular des Bürgerbüros",
	fields: "Name, E-Mail, Nachricht",
};

/** Arguments that get each prompt. */
const SAMPLE_ARGS: Readonly<Record<string, Record<string, string>>> = {
	create_input_form: FORM_ARGS,
	create_page_layout: { purpose: "Startseite des Bürgerservice Musterstadt" },
};

describe.each(MCP_ERAS)("MCP prompts over $era", ({ era, connect }) => {
	let client: Client;

	beforeAll(async () => {
		client = await connect();
	});

	afterAll(async () => {
		await client?.close();
	});

	it("declares prompts without list-changed notifications", () => {
		expect(client.getServerCapabilities()?.prompts).toEqual({
			listChanged: false,
		});
	});

	it("lists each prompt with a title, a description and its arguments", async () => {
		const { prompts } = await client.listPrompts();

		// An optional argument ends in "?".
		expect(
			prompts.map((prompt) => ({
				name: prompt.name,
				title: prompt.title,
				arguments: prompt.arguments?.map(
					(argument) => `${argument.name}${argument.required ? "" : "?"}`,
				),
			})),
		).toEqual([
			{
				name: "create_input_form",
				title: "Create a KERN form",
				arguments: ["purpose", "fields", "steps?", "locale?"],
			},
			{
				name: "create_page_layout",
				title: "Create a KERN page",
				arguments: ["purpose", "sections?", "locale?"],
			},
		]);
		for (const prompt of prompts) {
			expect(prompt.description, prompt.name).toMatch(/\S/);
			for (const argument of prompt.arguments ?? []) {
				expect(argument.description, argument.name).toMatch(/\S/);
			}
			expect(
				prompt.arguments?.find((argument) => argument.name === "locale")
					?.description,
			).toContain("de (the default) or en");
		}
	});

	it("marks the list cacheable for an hour on 2026-07-28 only", async () => {
		const result = (await client.listPrompts()) as {
			ttlMs?: number;
			cacheScope?: string;
		};

		if (era === "2026-07-28") {
			expect(result).toMatchObject({ ttlMs: 3_600_000, cacheScope: "public" });
		} else {
			expect(result.ttlMs).toBeUndefined();
			expect(result.cacheScope).toBeUndefined();
		}
	});

	it("gets the guide as resources/read serves it, the card links, then the workflow", async () => {
		const result = await client.getPrompt({
			name: "create_input_form",
			arguments: FORM_ARGS,
		});
		const guide = await client.readResource({ uri: "kern://guides/forms" });

		expect(result.messages.every((message) => message.role === "user")).toBe(
			true,
		);
		expect(result.messages[0]?.content).toEqual({
			type: "resource",
			resource: guide.contents[0],
		});
		expect(result.messages[1]?.content).toEqual({
			type: "resource_link",
			uri: "kern://components/inputtext",
			name: "inputtext",
			title: "KERN Input Text",
			mimeType: "text/markdown",
		});
		expect(result.messages.at(-1)?.content).toEqual({
			type: "text",
			text: expect.stringContaining("Kontaktformular des Bürgerbüros"),
		});
	});

	it.each(Object.entries(SAMPLE_ARGS))(
		"links only cards that read (%s)",
		async (name, args) => {
			const result = await client.getPrompt({ name, arguments: args });
			const links = result.messages.flatMap(({ content }) =>
				content.type === "resource_link" ? [content.uri] : [],
			);

			expect(links.length).toBeGreaterThan(0);
			for (const uri of links) {
				const card = await client.readResource({ uri });
				expect(card.contents[0], uri).toMatchObject({
					text: expect.stringMatching(/^# KERN /),
				});
			}
		},
	);

	it.each(Object.keys(SAMPLE_ARGS))(
		"completes the locale (%s)",
		async (name) => {
			const complete = (value: string) =>
				client.complete({
					ref: { type: "ref/prompt", name },
					argument: { name: "locale", value },
				});

			expect((await complete("")).completion.values).toEqual(["de", "en"]);
			expect((await complete("e")).completion.values).toEqual(["en"]);
		},
	);

	it.each([
		["a missing argument", { purpose: "Kontakt" }, /fields/],
		["an unknown locale", { ...FORM_ARGS, locale: "fr" }, /de or en/],
	])("rejects %s with -32602", async (_, args, message) => {
		const get = client.getPrompt({
			name: "create_input_form",
			arguments: args,
		});

		await expect(get).rejects.toBeInstanceOf(ProtocolError);
		await expect(get).rejects.toMatchObject({ code: -32602, message });
	});

	it("rejects an unknown prompt with -32602", async () => {
		await expect(
			client.getPrompt({ name: "create_wizard_form" }),
		).rejects.toMatchObject({ code: -32602 });
	});
});
