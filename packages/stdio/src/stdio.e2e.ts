import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import domainListing from "../../core/src/ux/__snapshots__/tools-list.json" with {
	type: "json",
};
import pkg from "../package.json" with { type: "json" };

/**
 * The built stdio server, spawned as a child process the way MCP clients run
 * it, on both protocol eras. Run with `npm run test:e2e` after `npm run build`.
 *
 * With KERN_E2E_INSTALL_DIR set, it tests the kern-ux-mcp bin of the package
 * installed there from its npm tarball instead (CI's packed-install check).
 */

type Entry = { command: string; args: string[] };

const PACKAGE_DIR = fileURLToPath(new URL("..", import.meta.url));
const installDir = process.env.KERN_E2E_INSTALL_DIR;

function nodeEntry(file: string): Entry {
	return { command: process.execPath, args: [file] };
}

/** The installed bin; on Windows the package's entry, since .cmd bin shims need a shell. */
function installedEntry(dir: string): Entry {
	return process.platform === "win32"
		? nodeEntry(
				path.join(
					dir,
					"node_modules",
					"@leonio",
					"kern-ux-mcp",
					"dist",
					"index.js",
				),
			)
		: {
				command: path.join(dir, "node_modules", ".bin", "kern-ux-mcp"),
				args: [],
			};
}

const ENTRIES: Record<string, Entry> = installDir
	? { "installed package": installedEntry(installDir) }
	: {
			"npm bundle": nodeEntry(path.join(PACKAGE_DIR, "dist", "index.js")),
			"standalone bundle (MCPB)": nodeEntry(
				path.join(PACKAGE_DIR, "standalone", "index.js"),
			),
		};

const ERAS = ["2025-11-25", "2026-07-28"] as const;

const CASES = Object.entries(ENTRIES).flatMap(([name, entry]) =>
	ERAS.map((era) => ({ name, entry, era })),
);

describe.each(CASES)("stdio: $name on $era", ({ entry, era }) => {
	let client: Client;

	beforeAll(async () => {
		client = new Client(
			{ name: "kern-e2e", version: "0.0.0" },
			{
				versionNegotiation: {
					mode: era === "2026-07-28" ? { pin: era } : "legacy",
				},
			},
		);
		await client.connect(
			new StdioClientTransport({ ...entry, stderr: "inherit" }),
		);
	});

	afterAll(async () => {
		await client?.close();
	});

	it("negotiates the era and reports the package version", () => {
		expect(client.getNegotiatedProtocolVersion()).toBe(era);
		expect(client.getServerVersion()).toMatchObject({
			name: "kern-ux",
			version: pkg.version,
		});
	});

	it("lists the tools of the domain listing", async () => {
		const { tools } = await client.listTools();
		expect(tools.map((tool) => tool.name)).toEqual(
			domainListing.map((tool) => tool.name),
		);
	});

	it("renders a component and reports invalid input as isError", async () => {
		const ok = await client.callTool({
			name: "get_button",
			arguments: { label: "Absenden" },
		});
		expect(ok.isError).toBeFalsy();
		expect(ok.structuredContent).toMatchObject({
			html: expect.stringContaining("Absenden"),
		});

		const invalid = await client.callTool({
			name: "get_button",
			arguments: { label: "OK", variant: "rainbow" },
		});
		expect(invalid.isError).toBe(true);
	});
});
