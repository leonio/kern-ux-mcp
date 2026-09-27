// R0 spike (throwaway): exercise the v2 server over every transport × protocol era
// and record listing equality, error texts and timings to spike/r0/results/.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import {
	Client,
	InMemoryTransport,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { createKernServer, getCatalog } from "./create-server.js";
import { conversionCalls } from "./kern-schema.js";

const MODERN = "2026-07-28";
const snapshot = JSON.parse(
	readFileSync("src/ux/__snapshots__/tools-list.json", "utf8"),
) as Array<{ name: string; description: string; inputSchema: unknown }>;
const outDir = "spike/r0/results";
mkdirSync(outDir, { recursive: true });

const catalog = await getCatalog();

type Setup = { id: string; connect: () => Promise<Client> };

function newClient(pin?: string) {
	return new Client(
		{ name: "kern-r0-probe", version: "0.0.0" },
		pin ? { versionNegotiation: { mode: { pin } } } : {},
	);
}

const handler = createMcpHandler(() => createKernServer(catalog));
const fetchViaHandler = (input: string | URL | Request, init?: RequestInit) =>
	handler.fetch(new Request(input, init));

function httpSetup(id: string, pin?: string): Setup {
	return {
		id,
		connect: async () => {
			const client = newClient(pin);
			await client.connect(
				new StreamableHTTPClientTransport(new URL("http://localhost/mcp"), {
					fetch: fetchViaHandler,
				}),
			);
			return client;
		},
	};
}

function stdioSetup(id: string, pin?: string): Setup {
	return {
		id,
		connect: async () => {
			const client = newClient(pin);
			await client.connect(
				new StdioClientTransport({
					command: process.execPath,
					args: ["--import", "tsx", "spike/r0/stdio.ts"],
					stderr: "inherit",
				}),
			);
			return client;
		},
	};
}

const setups: Setup[] = [
	{
		id: "inmemory-legacy",
		connect: async () => {
			const [ct, st] = InMemoryTransport.createLinkedPair();
			const client = newClient();
			await Promise.all([
				createKernServer(catalog).connect(st),
				client.connect(ct),
			]);
			return client;
		},
	},
	httpSetup("http-legacy"),
	httpSetup("http-2026", MODERN),
	stdioSetup("stdio-legacy"),
	stdioSetup("stdio-2026", MODERN),
];

function firstDiff(a: unknown, b: unknown, path = "$"): string | undefined {
	if (isDeepStrictEqual(a, b)) return undefined;
	if (typeof a !== "object" || typeof b !== "object" || !a || !b)
		return `${path}: ${JSON.stringify(a)?.slice(0, 120)} !== ${JSON.stringify(b)?.slice(0, 120)}`;
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const k of keys) {
		const d = firstDiff(
			(a as Record<string, unknown>)[k],
			(b as Record<string, unknown>)[k],
			`${path}.${k}`,
		);
		if (d) return d;
	}
	return `${path}: differs`;
}

async function capture(fn: () => Promise<unknown>) {
	try {
		return { ok: true, value: await fn() };
	} catch (err) {
		const e = err as { code?: unknown; message?: string; name?: string };
		return { ok: false, name: e.name, code: e.code, message: e.message };
	}
}

const summary: Record<string, unknown> = {};

for (const setup of setups) {
	const t0 = performance.now();
	const client = await setup.connect();
	const connectMs = performance.now() - t0;
	const version = client.getNegotiatedProtocolVersion?.();

	const t1 = performance.now();
	const listed = await client.listTools();
	const listMs = performance.now() - t1;
	const wire = listed.tools;

	const perTool = snapshot.map((expected) => {
		const actual = wire.find((t) => t.name === expected.name);
		return {
			name: expected.name,
			present: !!actual,
			descriptionEqual: actual?.description === expected.description,
			schemaEqual: isDeepStrictEqual(actual?.inputSchema, expected.inputSchema),
			diff: actual
				? firstDiff(actual.inputSchema, expected.inputSchema)
				: "missing",
			wireKeyOrder: actual ? Object.keys(actual.inputSchema).slice(0, 3) : [],
		};
	});
	const extraWireKeys = [
		...new Set(wire.flatMap((t) => Object.keys(t))),
	].filter((k) => !["name", "description", "inputSchema"].includes(k));

	const calls = {
		valid: await capture(() =>
			client.callTool({ name: "get_button", arguments: { label: "Weiter" } }),
		),
		normalized: await capture(() =>
			client.callTool({ name: "get_inputtext", arguments: {} }),
		),
		invalid: await capture(() =>
			client.callTool({
				name: "get_button",
				arguments: { label: "OK", variant: "rainbow" },
			}),
		),
		invalidComposition: await capture(() =>
			client.callTool({
				name: "render_composition",
				arguments: { contentBlocks: [{ kind: "nope" }] },
			}),
		),
		strictFailure: await capture(() =>
			client.callTool({
				name: "render_composition",
				arguments: {
					strict: true,
					contentBlocks: [{ kind: "html", html: "<img src='a.png'>" }],
				},
			}),
		),
		unknownTool: await capture(() =>
			client.callTool({ name: "get_does_not_exist", arguments: {} }),
		),
	};

	summary[setup.id] = {
		negotiatedVersion: version,
		connectMs: Math.round(connectMs),
		listMs: Math.round(listMs),
		toolCount: wire.length,
		allPresent: perTool.every((t) => t.present),
		allDescriptionsEqual: perTool.every((t) => t.descriptionEqual),
		allSchemasDeepEqual: perTool.every((t) => t.schemaEqual),
		schemaMismatches: perTool.filter((t) => !t.schemaEqual),
		wireKeyOrderSample: perTool[0]?.wireKeyOrder,
		extraWireToolKeys: extraWireKeys,
		listResultKeys: Object.keys(listed),
		calls,
	};
	writeFileSync(
		`${outDir}/${setup.id}.tools-list.json`,
		`${JSON.stringify(wire, null, 2)}\n`,
	);
	await client.close();
}

// Per-request factory cost (what every HTTP request pays).
const N = 200;
const tf = performance.now();
for (let i = 0; i < N; i++) createKernServer(catalog);
summary.factoryMsPerCall = +((performance.now() - tf) / N).toFixed(3);
summary.schemaConversionCalls = conversionCalls.count;
summary.schemaConversionTargets = [...conversionCalls.targets];

writeFileSync(
	`${outDir}/summary.json`,
	`${JSON.stringify(summary, null, 2)}\n`,
);
console.log(JSON.stringify(summary, null, 2).slice(0, 20000));
process.exit(0);
