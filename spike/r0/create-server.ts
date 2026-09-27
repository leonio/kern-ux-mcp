// R0 spike (throwaway): the 52 legacy ToolDefs registered on SDK v2 McpServer.
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
	loadRegistryFromManifest,
	validateRegistryAgainstToolNames,
} from "../../src/ux/registry.js";
import type { ToolDef } from "../../src/ux/tool-builders/shared.js";
import { createTools } from "../../src/ux/tools.js";
import { type HeaderMode, kernInputSchema } from "./kern-schema.js";

type Catalog = { tools: ToolDef[] };

let catalogPromise: Promise<Catalog> | undefined;

/** Memoised at module scope, like the planned getCatalog(). */
export function getCatalog(): Promise<Catalog> {
	catalogPromise ??= (async () => {
		const registry = await loadRegistryFromManifest();
		const registryTools = createTools(registry);
		validateRegistryAgainstToolNames(registry, registryTools.listToolNames());
		const tools = registryTools
			.listToolNames()
			.map((name) => registryTools.getTool(name) as ToolDef);
		return { tools };
	})();
	return catalogPromise;
}

const schemaCache = new Map<string, ReturnType<typeof kernInputSchema>>();

export function createKernServer(
	catalog: Catalog,
	opts: { headerMode?: HeaderMode } = {},
): McpServer {
	const server = new McpServer(
		{ name: "kern-ux", version: "0.0.0-spike" },
		{ capabilities: { tools: {} } },
	);
	const headerMode = opts.headerMode ?? "strip";

	for (const tool of catalog.tools) {
		const key = `${headerMode}:${tool.name}`;
		let inputSchema = schemaCache.get(key);
		if (!inputSchema) {
			inputSchema = kernInputSchema(tool, headerMode);
			schemaCache.set(key, inputSchema);
		}
		server.registerTool(
			tool.name,
			{ description: tool.description, inputSchema },
			async (args: unknown) => {
				const result = await tool.handler(args);
				const out = tool.outputSchema.safeParse(result);
				if (!out.success) {
					throw new Error(
						`Tool ${tool.name} returned invalid output: ${out.error.toString()}`,
					);
				}
				return {
					content: [
						{ type: "text" as const, text: JSON.stringify(out.data, null, 2) },
					],
				};
			},
		);
	}
	if (process.env.KERN_SPIKE_COMPAT === "1") registerCompatProbes(server);
	return server;
}

// ---------------------------------------------------------------------------
// Client-compat probes (KERN_SPIKE_COMPAT=1). Each echoes its arguments, so the
// tester can see whether the client accepted the schema and what the model sent.
// KERN_SPIKE_PAD=N adds N no-op tools to find tool-count limits.

function rawSchema(json: Record<string, unknown>) {
	return {
		"~standard": {
			version: 1,
			vendor: "kern-ux-probe",
			validate: (value: unknown) => ({ value }),
			jsonSchema: { input: () => json, output: () => json },
		},
	} as unknown as ReturnType<typeof kernInputSchema>;
}

const TREE_NODE = {
	type: "object",
	properties: {
		label: { type: "string" },
		children: { type: "array", items: { $ref: "#/$defs/node" } },
	},
	required: ["label"],
};

export const COMPAT_PROBES: Record<
	string,
	{ description: string; schema: Record<string, unknown> }
> = {
	probe_defs_ref: {
		description:
			"Diagnostic probe (2020-12 $defs + recursive $ref). Call it with a tree at least 3 levels deep, e.g. root 'A' with child 'B' which has child 'C'. Echoes the arguments.",
		schema: {
			$schema: "https://json-schema.org/draft/2020-12/schema",
			type: "object",
			properties: { root: { $ref: "#/$defs/node" } },
			required: ["root"],
			$defs: { node: TREE_NODE },
		},
	},
	probe_definitions_ref: {
		description:
			"Diagnostic probe (draft-07 definitions + recursive $ref). Call it with a tree at least 3 levels deep. Echoes the arguments.",
		schema: {
			$schema: "http://json-schema.org/draft-07/schema#",
			type: "object",
			properties: { root: { $ref: "#/definitions/node" } },
			required: ["root"],
			definitions: {
				node: JSON.parse(
					JSON.stringify(TREE_NODE).replace(
						"#/$defs/node",
						"#/definitions/node",
					),
				),
			},
		},
	},
	probe_anyof_root: {
		description:
			"Diagnostic probe (anyOf root, two object branches). Call it once with mode 'email' and an address. Echoes the arguments.",
		schema: {
			type: "object",
			anyOf: [
				{
					type: "object",
					properties: { mode: { const: "email" }, address: { type: "string" } },
					required: ["mode", "address"],
				},
				{
					type: "object",
					properties: { mode: { const: "phone" }, number: { type: "string" } },
					required: ["mode", "number"],
				},
			],
		},
	},
};

function registerCompatProbes(server: McpServer) {
	const echo = async (args: unknown) => ({
		content: [
			{ type: "text" as const, text: `received: ${JSON.stringify(args)}` },
		],
	});
	for (const [name, probe] of Object.entries(COMPAT_PROBES)) {
		server.registerTool(
			name,
			{ description: probe.description, inputSchema: rawSchema(probe.schema) },
			echo,
		);
	}
	server.registerPrompt(
		"probe_prompt",
		{
			title: "KERN probe prompt",
			description: "Diagnostic probe: does this client surface MCP prompts?",
			argsSchema: { topic: z.string().describe("Anything") },
		},
		async ({ topic }) => ({
			messages: [
				{
					role: "user",
					content: {
						type: "text",
						text: `KERN probe prompt received topic: ${topic}. Reply "probe prompt OK".`,
					},
				},
			],
		}),
	);
	server.registerResource(
		"probe_resource",
		"kern://probe/hello",
		{
			title: "KERN probe resource",
			description: "Diagnostic probe: does this client surface MCP resources?",
			mimeType: "text/markdown",
		},
		async (uri) => ({
			contents: [
				{
					uri: uri.href,
					mimeType: "text/markdown",
					text: "# KERN probe resource\n\nIf you can read this, resources work.",
				},
			],
		}),
	);
	const pad = Number(process.env.KERN_SPIKE_PAD ?? 0);
	for (let i = 1; i <= pad; i++) {
		const name = `probe_pad_${String(i).padStart(3, "0")}`;
		server.registerTool(
			name,
			{
				description: `Diagnostic padding tool ${i}. Only call it when asked for ${name}.`,
				inputSchema: rawSchema({ type: "object", properties: {} }),
			},
			echo,
		);
	}
}
