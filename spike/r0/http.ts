// R0 spike (throwaway): Streamable HTTP entry for the tunnel tests (ChatGPT, Responses API).
//   KERN_ALLOWED_HOSTS=localhost,abc.trycloudflare.com PORT=3000 node spike/r0/mcpb-http/index.js
import http from "node:http";
import {
	hostHeaderValidation,
	toNodeHandler,
} from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { describeMessage, logClient } from "./client-log.js";
import { createKernServer, getCatalog } from "./create-server.js";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);
const allowed = (process.env.KERN_ALLOWED_HOSTS ?? "localhost,127.0.0.1,[::1]")
	.split(",")
	.map((h) => h.trim())
	.filter(Boolean);

const catalog = await getCatalog();
const validateHost = hostHeaderValidation(allowed);
const mcp = toNodeHandler(
	createMcpHandler(() => createKernServer(catalog), {
		onerror: (err) => process.stderr.write(`[kern-ux:http] ${err.message}\n`),
	}),
);

const server = http.createServer((req, res) => {
	const path = new URL(req.url ?? "/", "http://x").pathname;
	process.stderr.write(
		`[kern-ux:http] ${req.method} ${path} host=${req.headers.host} ua=${req.headers["user-agent"] ?? ""}\n`,
	);
	if (path === "/healthz") {
		res.writeHead(200, { "content-type": "text/plain" }).end("ok");
		return;
	}
	if (path !== "/mcp") {
		res.writeHead(404).end();
		return;
	}
	if (!validateHost(req, res)) return;
	if (req.method !== "POST") {
		void mcp(req, res);
		return;
	}
	const chunks: Buffer[] = [];
	req.on("data", (c: Buffer) => chunks.push(c));
	req.on("end", () => {
		let body: unknown;
		try {
			body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
		} catch {
			res.writeHead(400).end();
			return;
		}
		const mcpHeaders = Object.fromEntries(
			Object.entries(req.headers).filter(([k]) => k.startsWith("mcp-")),
		);
		for (const msg of Array.isArray(body) ? body : [body]) {
			const d = describeMessage(msg);
			if (d.method && d.method !== "tools/call") {
				logClient({
					transport: "http",
					ua: req.headers["user-agent"],
					mcpHeaders,
					...d,
				});
			}
		}
		void mcp(req, res, body);
	});
});

server.listen(port, host, () => {
	process.stderr.write(
		`[kern-ux:http] listening on http://${host}:${port}/mcp (allowed hosts: ${allowed.join(", ")})\n`,
	);
});
