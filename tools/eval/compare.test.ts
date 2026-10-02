import { describe, expect, it } from "vitest";

import { compareReports } from "./compare.js";
import type { Aggregate } from "./transcript.js";

const aggregate = (overrides: Partial<Aggregate> = {}): Aggregate => ({
	runs: 3,
	completed: 3,
	toolCalls: 6,
	errorResults: 1,
	invalidInputErrors: 1,
	retries: 1,
	turns: 9,
	checksPassed: 9,
	checksTotal: 9,
	firstRequestTokens: 70_000,
	inputTokens: 500_000,
	outputTokens: 6_000,
	costUsd: 0.1,
	durationMs: 60_000,
	...overrides,
});

describe("compareReports", () => {
	const before = {
		label: "baseline",
		serverCommit: "aaa1111",
		total: aggregate(),
		scenarios: [{ id: "faq", ...aggregate() }],
	};
	const after = {
		label: "option-b",
		serverCommit: "bbb2222",
		total: aggregate({
			firstRequestTokens: 55_000,
			errorResults: 0,
			costUsd: 0.08,
		}),
		scenarios: [
			{ id: "faq", ...aggregate({ errorResults: 0, retries: 0 }) },
			{ id: "new", ...aggregate({ toolCalls: 2 }) },
		],
	};
	const table = compareReports(before, after);

	it("shows totals with their change", () => {
		expect(table).toMatch(/first request tokens\s+70000\s+55000\s+-15000/);
		expect(table).toMatch(/error results\s+1\s+0\s+-1/);
		expect(table).toMatch(/cost \(USD\)\s+0\.1\s+0\.08\s+-0\.02/);
		expect(table).toMatch(/completed\s+3\s+3 *\n/);
	});

	it("pairs each scenario's numbers, before and after", () => {
		expect(table).toMatch(/faq\s+1→0\s+1→0\s+6→6\s+9→9/);
		expect(table).toMatch(/new\s+→1\s+→1\s+→2\s+→9/);
	});
});
