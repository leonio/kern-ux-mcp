import { type ChildProcess, spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	Client,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import domainListing from "../../core/src/ux/__snapshots__/tools-list.json" with {
	type: "json",
};

/**
 * The built HTTP server as a separate process, on both protocol eras. Run with
 * `npm run test:e2e` after `npm run build`. Targets:
 * - by default, the npm bundle and the standalone (container) bundle
 * - with KERN_E2E_INSTALL_DIR, the kern-ux-mcp-http bin of the package
 *   installed there from its npm tarball (CI's packed-install check)
 * - with KERN_E2E_HTTP_URL, a server that is already running, such as the
 *   container in CI (no process to stop, so no SIGTERM check)
 */

type Running = { url: URL; process?: ChildProcess };
type Target = { name: string; start: () => Promise<Running> };

const PACKAGE_DIR = fileURLToPath(new URL("..", import.meta.url));
const installDir = process.env.KERN_E2E_INSTALL_DIR;
const externalUrl = process.env.KERN_E2E_HTTP_URL;

/** Starts the server on an ephemeral port and waits for its "listening on" line. */
function spawnServer(command: string, args: string[]): Promise<Running> {
	const child = spawn(command, args, {
		env: { ...process.env, HOST: "127.0.0.1", PORT: "0" },
		stdio: ["ignore", "inherit", "pipe"],
	});
	return new Promise((resolve, reject) => {
		let log = "";
		child.stderr?.on("data", (chunk: Buffer) => {
			log += chunk.toString();
			const match = /listening on (http:\/\/\S+)/.exec(log);
			if (match?.[1]) resolve({ url: new URL(match[1]), process: child });
		});
		child.on("exit", (code) =>
			reject(new Error(`server exited with ${code} before listening:\n${log}`)),
		);
	});
}

const TARGETS: Target[] = externalUrl
	? [
			{
				name: "running server",
				start: async () => ({ url: new URL(externalUrl) }),
			},
		]
	: installDir
		? [
				{
					name: "installed package",
					// The bin; on Windows the package's entry, since .cmd bin shims need a shell.
					start: () =>
						process.platform === "win32"
							? spawnServer(process.execPath, [
									path.join(
										installDir,
										"node_modules",
										"@leonio",
										"kern-ux-mcp-http",
										"dist",
										"index.js",
									),
								])
							: spawnServer(
									path.join(
										installDir,
										"node_modules",
										".bin",
										"kern-ux-mcp-http",
									),
									[],
								),
				},
			]
		: [
				{
					name: "npm bundle",
					start: () =>
						spawnServer(process.execPath, [
							path.join(PACKAGE_DIR, "dist", "index.js"),
						]),
				},
				{
					name: "standalone bundle (container)",
					start: () =>
						spawnServer(process.execPath, [
							path.join(PACKAGE_DIR, "standalone", "index.js"),
						]),
				},
			];

function status(url: URL, path: string, headers: Record<string, string> = {}) {
	return new Promise<number>((resolve, reject) => {
		const req = http.request(
			{
				host: url.hostname,
				port: url.port,
				path,
				method: path === "/mcp" ? "POST" : "GET",
				headers,
				agent: false,
			},
			(res) => {
				res.resume();
				resolve(res.statusCode ?? 0);
			},
		);
		req.on("error", reject);
		req.end();
	});
}

describe.each(TARGETS)("http: $name", ({ start }) => {
	let running: Running;

	beforeAll(async () => {
		running = await start();
	});

	afterAll(() => {
		running?.process?.kill();
	});

	it.each(["2025-11-25", "2026-07-28"] as const)(
		"lists the tools and calls one on %s",
		async (era) => {
			const client = new Client(
				{ name: "kern-e2e", version: "0.0.0" },
				{
					versionNegotiation: {
						mode: era === "2026-07-28" ? { pin: era } : "legacy",
					},
				},
			);
			await client.connect(new StreamableHTTPClientTransport(running.url));
			expect(client.getNegotiatedProtocolVersion()).toBe(era);

			const { tools } = await client.listTools();
			expect(tools.map((tool) => tool.name)).toEqual(
				domainListing.map((tool) => tool.name),
			);
			const result = await client.callTool({
				name: "get_button",
				arguments: { label: "Absenden" },
			});
			expect(result.structuredContent).toMatchObject({
				html: expect.stringContaining("Absenden"),
			});
			await client.close();
		},
	);

	it("answers the probes and rejects a foreign Host", async () => {
		expect(await status(running.url, "/healthz")).toBe(200);
		expect(await status(running.url, "/readyz")).toBe(200);
		expect(await status(running.url, "/mcp", { Host: "evil.example" })).toBe(
			403,
		);
	});

	// Windows has no SIGTERM: kill() ends the process outright.
	it.skipIf(process.platform === "win32" || externalUrl)(
		"drains and exits 0 on SIGTERM",
		async () => {
			const child = running.process as ChildProcess;
			const exited = new Promise<number | null>((resolve) =>
				child.once("exit", (code) => resolve(code)),
			);
			child.kill("SIGTERM");
			expect(await exited).toBe(0);
		},
	);
});
