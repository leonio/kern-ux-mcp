/**
 * Compares two eval reports (docs/plan-v2/r5-eval/<label>.json) side by side:
 * the totals, then each scenario's errors, retries, calls and checks.
 *
 *   npm run eval:compare -- baseline option-b
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { Aggregate } from "./transcript.js";

type Report = {
	label: string;
	serverCommit: string;
	total: Aggregate;
	scenarios: Array<Aggregate & { id: string }>;
};

const ROWS: Array<[string, (a: Aggregate) => number]> = [
	["completed", (a) => a.completed],
	["tool calls", (a) => a.toolCalls],
	["error results", (a) => a.errorResults],
	["invalid input", (a) => a.invalidInputErrors],
	["retries", (a) => a.retries],
	["checks passed", (a) => a.checksPassed],
	["first request tokens", (a) => a.firstRequestTokens],
	["input tokens", (a) => a.inputTokens],
	["output tokens", (a) => a.outputTokens],
	["cost (USD)", (a) => Math.round(a.costUsd * 100) / 100],
];

/** A plain-text comparison of two reports. */
export function compareReports(before: Report, after: Report): string {
	const pad = (value: string | number, width: number) =>
		String(value).padStart(width);
	const delta = (a: number, b: number) => {
		const d = Math.round((b - a) * 100) / 100;
		return d === 0 ? "" : d > 0 ? `+${d}` : `${d}`;
	};
	const lines = [
		`${"".padEnd(22)}${pad(before.label, 12)}${pad(after.label, 12)}${pad("change", 10)}`,
		`${"server".padEnd(22)}${pad(before.serverCommit, 12)}${pad(after.serverCommit, 12)}`,
		...ROWS.map(
			([name, pick]) =>
				`${name.padEnd(22)}${pad(pick(before.total), 12)}${pad(pick(after.total), 12)}${pad(delta(pick(before.total), pick(after.total)), 10)}`,
		),
		"",
		`${"scenario".padEnd(22)}${pad("errors", 9)}${pad("retries", 9)}${pad("calls", 9)}${pad("checks", 9)}`,
	];
	for (const scenario of after.scenarios) {
		const old = before.scenarios.find((s) => s.id === scenario.id);
		const pair = (pick: (a: Aggregate) => number) =>
			old ? `${pick(old)}→${pick(scenario)}` : `→${pick(scenario)}`;
		lines.push(
			`${scenario.id.padEnd(22)}${pad(
				pair((a) => a.errorResults),
				9,
			)}${pad(
				pair((a) => a.retries),
				9,
			)}${pad(
				pair((a) => a.toolCalls),
				9,
			)}${pad(
				pair((a) => a.checksPassed),
				9,
			)}`,
		);
	}
	return lines.join("\n");
}

// Run as a script (not when a test imports compareReports).
if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	const [a, b] = process.argv.slice(2);
	if (!a || !b) {
		console.error(
			"Usage: npm run eval:compare -- <label-before> <label-after>",
		);
		process.exit(2);
	}
	const dir = fileURLToPath(
		new URL("../../docs/plan-v2/r5-eval/", import.meta.url),
	);
	const read = async (label: string) =>
		JSON.parse(
			await fs.readFile(path.join(dir, `${label}.json`), "utf8"),
		) as Report;
	console.log(compareReports(await read(a), await read(b)));
}
