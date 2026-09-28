import { createHash, timingSafeEqual } from "node:crypto";
import http, { type IncomingMessage, type ServerResponse } from "node:http";

import { createKernServer, debugLog } from "@leonio/kern-ux-core";
import {
	hostHeaderValidation,
	originValidation,
	toNodeHandler,
} from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";

import type { HttpConfig } from "./config.js";
import { RateLimiter } from "./rate-limit.js";

export const MCP_PATH = "/mcp";

export type KernHttpServer = {
	server: http.Server;
	/**
	 * Stops accepting connections, lets in-flight requests finish, and resolves
	 * once they have. After `timeoutMs` the remaining connections are closed.
	 * /readyz answers 503 from the moment draining starts.
	 */
	drain: (timeoutMs: number) => Promise<void>;
};

const CORS_ALLOW_METHODS = "GET, POST, DELETE, OPTIONS";
const CORS_EXPOSE_HEADERS =
	"Mcp-Session-Id, Mcp-Protocol-Version, WWW-Authenticate";

/** The JSON-RPC error body the SDK's own HTTP guards use (see hostHeaderValidation). */
function sendJsonRpcError(
	res: ServerResponse,
	status: number,
	message: string,
	headers: Record<string, string> = {},
): void {
	res.writeHead(status, { ...headers, "Content-Type": "application/json" });
	res.end(
		JSON.stringify({
			jsonrpc: "2.0",
			error: { code: -32000, message },
			id: null,
		}),
	);
}

function digest(value: string): Buffer {
	return createHash("sha256").update(value).digest();
}

/** Constant-time comparison of the bearer token (hashing first equalises the lengths). */
function hasBearerToken(req: IncomingMessage, expected: Buffer): boolean {
	const match = /^Bearer\s+(\S+)\s*$/i.exec(req.headers.authorization ?? "");
	return (
		match?.[1] !== undefined && timingSafeEqual(digest(match[1]), expected)
	);
}

function sendText(res: ServerResponse, status: number, text: string): void {
	res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
	res.end(`${text}\n`);
}

/**
 * The Streamable HTTP host: POST/GET/DELETE /mcp through the SDK handler (one
 * server instance per request, for 2026-07-28 and 2025-era clients alike),
 * plus /healthz (liveness) and /readyz (readiness). Order of checks on /mcp:
 * Host, Origin, CORS preflight, rate limit, bearer token.
 */
export function createKernHttpServer(
	config: HttpConfig,
	{ version }: { version: string },
): KernHttpServer {
	const mcpHandler = createMcpHandler(() => createKernServer({ version }), {
		// Also called for rejected requests, so only in debug logs.
		onerror: (err) => debugLog("http handler error", { message: err.message }),
	});
	const mcp = toNodeHandler(mcpHandler, {
		onerror: (err) => console.error("Kern UX MCP HTTP error", err),
	});
	const validateHost = hostHeaderValidation(config.allowedHosts);
	const validateOrigin = originValidation(config.allowedOrigins);
	const corsOrigins = new Set(config.corsOrigins);
	const limiter = config.rateLimitPerMinute
		? new RateLimiter(config.rateLimitPerMinute)
		: undefined;
	const expectedToken = config.authToken ? digest(config.authToken) : undefined;
	let draining = false;

	function applyCors(req: IncomingMessage, res: ServerResponse): void {
		if (corsOrigins.size === 0) return;
		res.setHeader("Vary", "Origin");
		const origin = req.headers.origin;
		if (origin && corsOrigins.has(origin)) {
			res.setHeader("Access-Control-Allow-Origin", origin);
			res.setHeader("Access-Control-Expose-Headers", CORS_EXPOSE_HEADERS);
		}
	}

	function handleMcp(req: IncomingMessage, res: ServerResponse): void {
		if (!validateHost(req, res) || !validateOrigin(req, res)) return;
		applyCors(req, res);

		if (req.method === "OPTIONS") {
			if (res.hasHeader("Access-Control-Allow-Origin")) {
				res.setHeader("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);
				res.setHeader(
					"Access-Control-Allow-Headers",
					req.headers["access-control-request-headers"] ?? "Content-Type",
				);
				res.setHeader("Access-Control-Max-Age", "600");
			}
			res.writeHead(204).end();
			return;
		}

		const retryAfter =
			limiter?.take(req.socket.remoteAddress ?? "unknown") ?? 0;
		if (retryAfter > 0) {
			sendJsonRpcError(
				res,
				429,
				`Rate limit exceeded. Retry in ${retryAfter} s.`,
				{
					"Retry-After": String(retryAfter),
				},
			);
			return;
		}

		if (expectedToken && !hasBearerToken(req, expectedToken)) {
			const error = req.headers.authorization ? ', error="invalid_token"' : "";
			res.writeHead(401, {
				"Content-Type": "application/json",
				"WWW-Authenticate": `Bearer realm="kern-ux-mcp"${error}`,
			});
			res.end(
				JSON.stringify({
					error: "invalid_token",
					error_description:
						"This server requires Authorization: Bearer <KERN_AUTH_TOKEN>.",
				}),
			);
			return;
		}

		void mcp(req, res);
	}

	const server = http.createServer((req, res) => {
		const started = performance.now();
		const path = new URL(req.url ?? "/", "http://localhost").pathname;
		res.on("finish", () => {
			debugLog(
				`http ${req.method} ${path} ${res.statusCode} ${Math.round(performance.now() - started)}ms`,
			);
			// While draining, close keep-alive connections as soon as they go idle,
			// instead of waiting for the keep-alive timeout. (A Connection: close
			// header wouldn't do: the SDK's SSE responses set keep-alive themselves.)
			if (draining) setImmediate(() => server.closeIdleConnections());
		});

		// Probes skip the Host check: orchestrators call them by pod or container IP.
		if (path === "/healthz") {
			sendText(res, 200, "ok");
		} else if (path === "/readyz") {
			sendText(res, draining ? 503 : 200, draining ? "draining" : "ready");
		} else if (path === MCP_PATH) {
			handleMcp(req, res);
		} else {
			sendText(res, 404, "Not found. The MCP endpoint is /mcp.");
		}
	});

	let drained: Promise<void> | undefined;
	function drain(timeoutMs: number): Promise<void> {
		drained ??= new Promise<void>((resolve) => {
			draining = true;
			const timer = setTimeout(() => {
				void mcpHandler.close();
				server.closeAllConnections();
			}, timeoutMs);
			server.close(() => {
				clearTimeout(timer);
				void mcpHandler.close().then(resolve, resolve);
			});
			server.closeIdleConnections();
		});
		return drained;
	}

	return { server, drain };
}
