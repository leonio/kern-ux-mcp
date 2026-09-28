import {
	Client,
	InMemoryTransport,
	StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { createMcpHandler } from "@modelcontextprotocol/server";

import { createKernServer } from "../mcp/create-server.js";

/** The version the tests pass as the host version. */
export const TEST_SERVER_VERSION = "0.0.0-test";

/**
 * MCP clients connected to createKernServer() on each protocol era. Test-only.
 * - 2025-11-25 through the in-memory transport (it only speaks the 2025 eras)
 * - 2026-07-28 through createMcpHandler().fetch, as the HTTP host will serve it
 */
export type McpEraSetup = {
	era: "2025-11-25" | "2026-07-28";
	connect: () => Promise<Client>;
};

const CLIENT_INFO = { name: "kern-ux-test", version: "0.0.0" };

export const MCP_ERAS: McpEraSetup[] = [
	{
		era: "2025-11-25",
		connect: async () => {
			const [clientTransport, serverTransport] =
				InMemoryTransport.createLinkedPair();
			const client = new Client(CLIENT_INFO);
			const server = createKernServer({ version: TEST_SERVER_VERSION });
			await Promise.all([
				server.connect(serverTransport),
				client.connect(clientTransport),
			]);
			return client;
		},
	},
	{
		era: "2026-07-28",
		connect: async () => {
			const handler = createMcpHandler(() =>
				createKernServer({ version: TEST_SERVER_VERSION }),
			);
			const client = new Client(CLIENT_INFO, {
				versionNegotiation: { mode: { pin: "2026-07-28" } },
			});
			await client.connect(
				new StreamableHTTPClientTransport(new URL("http://localhost/mcp"), {
					fetch: (input, init) => handler.fetch(new Request(input, init)),
				}),
			);
			return client;
		},
	},
];
