import http from "node:http";
import type { AddressInfo } from "node:net";

import { createKernServer } from "@leonio/kern-ux-core";
import {
	Client,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadConfig } from "./config.js";
import { createKernHttpServer, type KernHttpServer } from "./server.js";

/**
 * End-to-end tests of the HTTP host on an ephemeral port: the MCP endpoint on
 * both protocol eras, the Host/Origin guards, bearer auth, rate limiting, CORS,
 * health probes and the SIGTERM drain.
 */

const VERSION = "0.0.0-http-test";
const ERAS = ["2025-11-25", "2026-07-28"] as const;

type Running = KernHttpServer & { port: number; url: string };

async function start(env: NodeJS.ProcessEnv = {}): Promise<Running> {
	const kern = createKernHttpServer(loadConfig(env), { version: VERSION });
	await new Promise<void>((resolve) =>
		kern.server.listen(0, "127.0.0.1", resolve),
	);
	const { port } = kern.server.address() as AddressInfo;
	return { ...kern, port, url: `http://127.0.0.1:${port}` };
}

async function connect(
	running: Running,
	era: (typeof ERAS)[number],
	headers: Record<string, string> = {},
): Promise<Client> {
	const client = new Client(
		{ name: "kern-http-test", version: "0.0.0" },
		{
			versionNegotiation: {
				mode: era === "2026-07-28" ? { pin: era } : "legacy",
			},
		},
	);
	await client.connect(
		new StreamableHTTPClientTransport(new URL(`${running.url}/mcp`), {
			requestInit: { headers },
		}),
	);
	return client;
}

type RawResponse = {
	status: number;
	headers: http.IncomingHttpHeaders;
	body: string;
};

/** A raw request, so tests can set Host and Origin freely. */
function request(
	running: { port: number },
	{
		method = "POST",
		path = "/mcp",
		headers = {},
		body,
	}: {
		method?: string;
		path?: string;
		headers?: Record<string, string>;
		body?: string;
	},
): Promise<RawResponse> {
	return new Promise((resolve, reject) => {
		const req = http.request(
			{
				host: "127.0.0.1",
				port: running.port,
				method,
				path,
				headers,
				agent: false,
			},
			(res) => {
				let text = "";
				res.setEncoding("utf8");
				res.on("data", (chunk: string) => {
					text += chunk;
				});
				res.on("end", () =>
					resolve({
						status: res.statusCode ?? 0,
						headers: res.headers,
						body: text,
					}),
				);
			},
		);
		req.on("error", reject);
		req.end(body);
	});
}

const INITIALIZE = JSON.stringify({
	jsonrpc: "2.0",
	id: 1,
	method: "initialize",
	params: {
		protocolVersion: "2025-11-25",
		capabilities: {},
		clientInfo: { name: "raw", version: "0" },
	},
});
const MCP_HEADERS = {
	"Content-Type": "application/json",
	Accept: "application/json, text/event-stream",
};

function textOf(result: Awaited<ReturnType<Client["callTool"]>>): string {
	const [content] = result.content as Array<{ type: string; text?: string }>;
	return content?.text ?? "";
}

describe.each(ERAS)("MCP over HTTP on %s", (era) => {
	let running: Running;
	let client: Client;

	beforeAll(async () => {
		running = await start();
		client = await connect(running, era);
	});

	afterAll(async () => {
		await client?.close();
		await running?.drain(1_000);
	});

	it("negotiates the era and reports the host version", () => {
		expect(client.getNegotiatedProtocolVersion()).toBe(era);
		expect(client.getServerVersion()).toMatchObject({
			name: "kern-ux",
			version: VERSION,
		});
	});

	it("lists every tool and calls one", async () => {
		const { tools } = await client.listTools();
		expect(tools.length).toBeGreaterThanOrEqual(54);

		const result = await client.callTool({
			name: "get_button",
			arguments: { label: "Senden" },
		});
		expect(result.isError).toBeFalsy();
		expect(textOf(result)).toContain("Senden");
	});

	it("keeps 20 parallel calls apart (one server instance per request)", async () => {
		const labels = Array.from({ length: 20 }, (_, i) => `Knopf ${i}`);
		const results = await Promise.all(
			labels.map((label) =>
				client.callTool({ name: "get_button", arguments: { label } }),
			),
		);
		results.forEach((result, i) => {
			expect(result.isError).toBeFalsy();
			expect(textOf(result)).toContain(`Knopf ${i}<`);
		});
	});

	it("returns isError results for invalid input", async () => {
		const result = await client.callTool({
			name: "get_button",
			arguments: { label: "OK", variant: "rainbow" },
		});
		expect(result.isError).toBe(true);
		expect(textOf(result)).toContain("Input validation error");
	});
});

describe("health probes and routing", () => {
	let running: Running;

	beforeAll(async () => {
		running = await start();
	});

	afterAll(async () => {
		await running?.drain(1_000);
	});

	it("answers /healthz and /readyz without checking Host, for orchestrator probes", async () => {
		const health = await request(running, {
			method: "GET",
			path: "/healthz",
			headers: { Host: "10.1.2.3:3000" },
		});
		expect(health).toMatchObject({ status: 200, body: "ok\n" });

		const ready = await request(running, {
			method: "GET",
			path: "/readyz",
			headers: { Host: "10.1.2.3:3000" },
		});
		expect(ready).toMatchObject({ status: 200, body: "ready\n" });
	});

	it("answers 404 outside /mcp and the probes", async () => {
		const response = await request(running, { method: "GET", path: "/" });
		expect(response.status).toBe(404);
		expect(response.body).toContain("/mcp");
	});

	it("rejects a foreign Host with 403 (DNS rebinding)", async () => {
		const response = await request(running, {
			headers: { ...MCP_HEADERS, Host: "evil.example:3000" },
			body: INITIALIZE,
		});
		expect(response.status).toBe(403);
		expect(JSON.parse(response.body)).toMatchObject({
			error: { code: -32000, message: expect.stringContaining("evil.example") },
		});
	});

	it("rejects a foreign Origin with 403", async () => {
		const response = await request(running, {
			headers: { ...MCP_HEADERS, Origin: "https://evil.example" },
			body: INITIALIZE,
		});
		expect(response.status).toBe(403);
	});

	it("serves a loopback Origin", async () => {
		const response = await request(running, {
			headers: { ...MCP_HEADERS, Origin: "http://localhost:5173" },
			body: INITIALIZE,
		});
		expect(response.status).toBe(200);
		expect(response.headers["access-control-allow-origin"]).toBeUndefined();
	});
});

describe("bearer token (KERN_AUTH_TOKEN)", () => {
	const token = "test-token-0123456789";
	let running: Running;

	beforeAll(async () => {
		running = await start({ KERN_AUTH_TOKEN: token });
	});

	afterAll(async () => {
		await running?.drain(1_000);
	});

	it("answers 401 with a Bearer challenge when the token is missing", async () => {
		const response = await request(running, {
			headers: MCP_HEADERS,
			body: INITIALIZE,
		});
		expect(response.status).toBe(401);
		expect(response.headers["www-authenticate"]).toBe(
			'Bearer realm="kern-ux-mcp"',
		);
		expect(JSON.parse(response.body)).toMatchObject({ error: "invalid_token" });
	});

	it.each([
		"Bearer wrong-token",
		`Basic ${token}`,
		`Bearer ${token}x`,
		"Bearer",
	])("answers 401 for Authorization: %s", async (authorization) => {
		const response = await request(running, {
			headers: { ...MCP_HEADERS, Authorization: authorization },
			body: INITIALIZE,
		});
		expect(response.status).toBe(401);
		expect(response.headers["www-authenticate"]).toContain(
			'error="invalid_token"',
		);
	});

	it("serves clients that send the token", async () => {
		const client = await connect(running, "2026-07-28", {
			Authorization: `Bearer ${token}`,
		});
		expect((await client.listTools()).tools.length).toBeGreaterThanOrEqual(54);
		await client.close();
	});

	it("leaves the probes open", async () => {
		expect(
			(await request(running, { method: "GET", path: "/healthz" })).status,
		).toBe(200);
	});
});

describe("rate limit (KERN_RATE_LIMIT)", () => {
	let running: Running;

	beforeAll(async () => {
		running = await start({ KERN_RATE_LIMIT: "2" });
	});

	afterAll(async () => {
		await running?.drain(1_000);
	});

	it("answers 429 with Retry-After once a client exceeds its budget", async () => {
		const statuses: number[] = [];
		for (let i = 0; i < 2; i++) {
			statuses.push(
				(await request(running, { headers: MCP_HEADERS, body: INITIALIZE }))
					.status,
			);
		}
		const limited = await request(running, {
			headers: MCP_HEADERS,
			body: INITIALIZE,
		});

		expect(statuses).toEqual([200, 200]);
		expect(limited.status).toBe(429);
		expect(Number(limited.headers["retry-after"])).toBeGreaterThanOrEqual(1);
		expect(JSON.parse(limited.body)).toMatchObject({
			error: { message: expect.stringContaining("Rate limit") },
		});
	});

	it("doesn't count the probes", async () => {
		expect(
			(await request(running, { method: "GET", path: "/readyz" })).status,
		).toBe(200);
	});
});

describe("CORS (KERN_CORS_ORIGINS)", () => {
	const origin = "https://app.example";
	let running: Running;

	beforeAll(async () => {
		running = await start({ KERN_CORS_ORIGINS: origin });
	});

	afterAll(async () => {
		await running?.drain(1_000);
	});

	it("answers preflights from a listed origin", async () => {
		const response = await request(running, {
			method: "OPTIONS",
			headers: {
				Origin: origin,
				"Access-Control-Request-Method": "POST",
				"Access-Control-Request-Headers":
					"content-type, mcp-protocol-version, authorization",
			},
		});
		expect(response.status).toBe(204);
		expect(response.headers).toMatchObject({
			"access-control-allow-origin": origin,
			"access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
			"access-control-allow-headers":
				"content-type, mcp-protocol-version, authorization",
			vary: "Origin",
		});
	});

	it("adds CORS headers to responses for a listed origin", async () => {
		const response = await request(running, {
			headers: { ...MCP_HEADERS, Origin: origin },
			body: INITIALIZE,
		});
		expect(response.status).toBe(200);
		expect(response.headers["access-control-allow-origin"]).toBe(origin);
		expect(response.headers["access-control-expose-headers"]).toContain(
			"Mcp-Protocol-Version",
		);
	});

	it("rejects other origins before CORS applies", async () => {
		const response = await request(running, {
			method: "OPTIONS",
			headers: {
				Origin: "https://evil.example",
				"Access-Control-Request-Method": "POST",
			},
		});
		expect(response.status).toBe(403);
		expect(response.headers["access-control-allow-origin"]).toBeUndefined();
	});

	it("answers preflights without CORS headers for allowed non-CORS origins", async () => {
		const loopback = await start();
		const response = await request(loopback, {
			method: "OPTIONS",
			headers: {
				Origin: "http://localhost:5173",
				"Access-Control-Request-Method": "POST",
			},
		});
		await loopback.drain(1_000);

		expect(response.status).toBe(204);
		expect(response.headers["access-control-allow-origin"]).toBeUndefined();
	});
});

describe("drain (SIGTERM)", () => {
	// A keep-alive client, as MCP clients are: the connection stays open after each response.
	const keepAlive = new http.Agent({ keepAlive: true });
	afterAll(() => keepAlive.destroy());

	/** Sends the headers and half the body, so the request is in flight until `finish` runs. */
	function halfSentRequest(running: Running) {
		const received = new Promise<void>((resolve) =>
			running.server.once("request", () => resolve()),
		);
		let finish = () => {};
		const response = new Promise<RawResponse>((resolve, reject) => {
			const req = http.request(
				{
					host: "127.0.0.1",
					port: running.port,
					method: "POST",
					path: "/mcp",
					headers: {
						...MCP_HEADERS,
						"Content-Length": Buffer.byteLength(INITIALIZE),
					},
					agent: keepAlive,
				},
				(res) => {
					let text = "";
					res.on("data", (chunk: Buffer) => {
						text += chunk.toString();
					});
					res.on("end", () =>
						resolve({
							status: res.statusCode ?? 0,
							headers: res.headers,
							body: text,
						}),
					);
				},
			);
			req.on("error", reject);
			req.write(INITIALIZE.slice(0, 20));
			finish = () => req.end(INITIALIZE.slice(20));
		});
		return { received, response, finish: () => finish() };
	}

	it("lets in-flight requests finish, then stops listening", async () => {
		const running = await start();
		const inFlight = halfSentRequest(running);
		await inFlight.received;

		const started = performance.now();
		const drained = running.drain(5_000);
		inFlight.finish();

		const response = await inFlight.response;
		expect(response.status).toBe(200);
		await drained;
		// Well under Node's 5 s keep-alive timeout: the idle connection was closed right away.
		expect(performance.now() - started).toBeLessThan(2_000);
		expect(running.server.listening).toBe(false);
	});

	it("closes requests still open after the timeout", async () => {
		const running = await start();
		const inFlight = halfSentRequest(running);
		await inFlight.received;

		const started = performance.now();
		await running.drain(50);

		expect(performance.now() - started).toBeLessThan(2_000);
		await expect(inFlight.response).rejects.toThrow();
	});

	it("reports not ready while draining", async () => {
		const running = await start();
		const inFlight = halfSentRequest(running);
		await inFlight.received;

		const drained = running.drain(5_000);
		// The draining server accepts no new connections, so a second listener
		// hands it the probe, as a kept-alive connection would.
		const relay = http.createServer((req, res) =>
			running.server.emit("request", req, res),
		);
		await new Promise<void>((resolve) => relay.listen(0, "127.0.0.1", resolve));
		const ready = await request(
			{ port: (relay.address() as AddressInfo).port },
			{ method: "GET", path: "/readyz" },
		);
		relay.close();
		inFlight.finish();
		await inFlight.response;
		await drained;

		expect(ready).toMatchObject({ status: 503, body: "draining\n" });
	});
});

describe("per-request server factory", () => {
	it("stays within a few milliseconds per request", () => {
		createKernServer({ version: VERSION });
		const runs = 30;
		const started = performance.now();
		for (let i = 0; i < runs; i++) createKernServer({ version: VERSION });
		const meanMs = (performance.now() - started) / runs;

		expect(meanMs).toBeLessThan(5);
	});
});
