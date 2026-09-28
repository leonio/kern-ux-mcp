#!/usr/bin/env node

import { createKernServer, getCatalog } from "@leonio/kern-ux-core";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import pkg from "../package.json" with { type: "json" };

try {
	// Build the tool catalog up front, so a broken registry fails at startup
	// rather than on the first request.
	getCatalog();
} catch (err) {
	console.error("Fatal error starting Kern UX MCP server", err);
	process.exit(1);
}

// One server instance per connection, for 2026-07-28 and 2025-era clients alike.
serveStdio(() => createKernServer({ version: pkg.version }), {
	onerror: (err) => {
		console.error("Kern UX MCP server error", err);
	},
});
