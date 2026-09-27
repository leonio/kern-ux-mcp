// R0 spike (throwaway): is the stdio 2026 tools/list latency first-call only?
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

for (const pin of [undefined, "2026-07-28"]) {
	const client = new Client(
		{ name: "latency", version: "0" },
		pin ? { versionNegotiation: { mode: { pin } } } : {},
	);
	const t0 = performance.now();
	await client.connect(
		new StdioClientTransport({
			command: process.execPath,
			args: process.env.SPIKE_ENTRY
				? [process.env.SPIKE_ENTRY]
				: ["--import", "tsx", "spike/r0/stdio.ts"],
			stderr: "inherit",
		}),
	);
	const times: number[] = [Math.round(performance.now() - t0)];
	let last: unknown;
	for (let i = 0; i < 4; i++) {
		const t = performance.now();
		last = await client.listTools();
		times.push(Math.round(performance.now() - t));
	}
	for (let i = 0; i < 3; i++) {
		const t = performance.now();
		await client.callTool({ name: "get_button", arguments: { label: "x" } });
		times.push(Math.round(performance.now() - t));
	}
	const l = last as Record<string, unknown>;
	console.log(
		pin ?? "legacy",
		"connect, list×4, call×3 (ms):",
		times.join(", "),
		{
			ttlMs: l.ttlMs,
			cacheScope: l.cacheScope,
		},
	);
	await client.close();
}
process.exit(0);
