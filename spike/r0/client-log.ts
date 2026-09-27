// R0 spike (throwaway): record which client connected, over which era, to a log file
// (clients often hide server stderr). Default: <tmpdir>/kern-r0-clients.log
import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const CLIENT_LOG =
	process.env.KERN_SPIKE_LOG ?? join(tmpdir(), "kern-r0-clients.log");

export function logClient(entry: Record<string, unknown>) {
	try {
		appendFileSync(
			CLIENT_LOG,
			`${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`,
		);
	} catch {
		// diagnostics only
	}
}

/** Summarise one JSON-RPC message: method, era hints and client identity. */
export function describeMessage(msg: unknown): Record<string, unknown> {
	const m = msg as {
		method?: string;
		params?: {
			protocolVersion?: string;
			clientInfo?: unknown;
			capabilities?: unknown;
			_meta?: Record<string, unknown>;
		};
	};
	const meta = m.params?._meta ?? {};
	return {
		method: m.method,
		protocolVersion:
			m.params?.protocolVersion ??
			meta["io.modelcontextprotocol/protocolVersion"],
		clientInfo:
			m.params?.clientInfo ?? meta["io.modelcontextprotocol/clientInfo"],
		capabilities:
			m.params?.capabilities ??
			meta["io.modelcontextprotocol/clientCapabilities"],
	};
}

/** Tap stdin (a second 'data' listener; the SDK transport still gets every chunk). */
export function tapStdin(transport: "stdio") {
	let buffer = "";
	let seen = 0;
	process.stdin.on("data", (chunk: Buffer) => {
		if (seen >= 3) return;
		buffer += chunk.toString("utf8");
		let nl = buffer.indexOf("\n");
		while (nl >= 0 && seen < 3) {
			const line = buffer.slice(0, nl).trim();
			buffer = buffer.slice(nl + 1);
			nl = buffer.indexOf("\n");
			if (!line) continue;
			seen++;
			try {
				logClient({ transport, ...describeMessage(JSON.parse(line)) });
			} catch {
				logClient({ transport, unparsable: line.slice(0, 200) });
			}
		}
	});
}
