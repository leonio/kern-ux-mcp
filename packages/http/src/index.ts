#!/usr/bin/env node

import type { AddressInfo } from "node:net";

import { getCatalog } from "@leonio/kern-ux-core";

import pkg from "../package.json" with { type: "json" };
import { ConfigError, type HttpConfig, loadConfig } from "./config.js";
import { createKernHttpServer, MCP_PATH } from "./server.js";

/** Below Docker's default 10 s stop timeout, so the drain finishes before SIGKILL. */
const DRAIN_TIMEOUT_MS = 8_000;

let config: HttpConfig;
try {
	config = loadConfig();
	// Build the tool catalog up front, so a broken registry fails at startup
	// rather than on the first request.
	getCatalog();
} catch (err) {
	if (err instanceof ConfigError) {
		console.error(`Kern UX MCP HTTP server: ${err.message}`);
	} else {
		console.error("Fatal error starting Kern UX MCP HTTP server", err);
	}
	process.exit(1);
}

const { server, drain } = createKernHttpServer(config, {
	version: pkg.version,
});

server.on("error", (err) => {
	console.error("Kern UX MCP HTTP server failed", err);
	process.exit(1);
});

server.listen(config.port, config.host, () => {
	const { address, port } = server.address() as AddressInfo;
	const host = address.includes(":") ? `[${address}]` : address;
	console.error(
		`Kern UX MCP server ${pkg.version} listening on http://${host}:${port}${MCP_PATH} (allowed hosts: ${config.allowedHosts.join(", ")}${config.authToken ? "; bearer token required" : ""})`,
	);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
	process.once(signal, () => {
		console.error(`${signal} received, draining connections`);
		void drain(DRAIN_TIMEOUT_MS).then(() => process.exit(0));
	});
}
