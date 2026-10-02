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

/** Reports written before a measurement existed lack it; the table shows "-". */
type Totals = Partial<Aggregate>;

type Report = {
	label: string;
	serverCommit: string;
	total: Totals;
	scenarios: Array<Totals & { id: string }>;
};

const ROWS: Array<[string, (a: Totals) => number | undefined]> = [
	["completed", (a) => a.completed],
	["tool calls", (a) => a.toolCalls],
	["error results", (a) => a.errorResults],
	["invalid input", (a) => a.invalidInputErrors],
	["retries", (a) => a.retries],
	["checks passed", (a) => a.checksPassed],
	["composition calls", (a) => a.compositionCalls],
	["composition errors", (a) => a.compositionErrors],
	["composition retries", (a) => a.compositionRetries],
	["block depth (max)", (a) => a.blockDepth],
	["block nodes (max)", (a) => a.blockNodes],
	["answer: verbatim", (a) => a.deliveredVerbatim],
	["answer: edited", (a) => a.deliveredEdited],
	["answer: described", (a) => a.deliveredDescribed],
	["hand-written", (a) => a.fallbacks],
	["strict-valid runs", (a) => a.strictValid],
	["first request tokens", (a) => a.firstRequestTokens],
	["input tokens", (a) => a.inputTokens],
	["output tokens", (a) => a.outputTokens],
	[
		"cost (USD)",
		(a) =>
			a.costUsd === undefined ? undefined : Math.round(a.costUsd * 100) / 100,
	],
];

/** A plain-text comparison of two reports. */
export function compareReports(before: Report, after: Report): string {
	const pad = (value: string | number | undefined, width: number) =>
		String(value ?? "-").padStart(width);
	const delta = (a: number | undefined, b: number | undefined) => {
		if (a === undefined || b === undefined) return "";
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
		`${"scenario".padEnd(22)}${pad("errors", 9)}${pad("retries", 9)}${pad("calls", 9)}${pad("checks", 9)}${pad("valid", 9)}`,
	];
	for (const scenario of after.scenarios) {
		const old = before.scenarios.find((s) => s.id === scenario.id);
		const show = (value: number | undefined) => value ?? "-";
		const pair = (pick: (a: Totals) => number | undefined) =>
			old
				? `${show(pick(old))}→${show(pick(scenario))}`
				: `→${show(pick(scenario))}`;
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
			)}${pad(
				pair((a) => a.strictValid),
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
