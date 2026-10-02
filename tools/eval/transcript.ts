/**
 * Turns a Claude Code `--output-format stream-json` transcript into the
 * measurements the R5 baseline compares: kern tool calls, error results,
 * retries, turns, tokens, cost and the scenario's completion checks.
 */
import type { Scenario } from "./scenarios.js";

const KERN_PREFIX = "mcp__kern__";

export type ToolCall = {
	tool: string;
	/** null until its result arrives (or if it never does) */
	error: null | "invalid-input" | "strict" | "unknown-tool" | "other";
};

export type RunSummary = {
	scenario: string;
	completed: boolean;
	/** The server was connected and listed its tools. */
	connected: boolean;
	toolsListed: number;
	calls: ToolCall[];
	toolCalls: number;
	errorResults: number;
	invalidInputErrors: number;
	/** Calls to a tool whose previous call errored */
	retries: number;
	turns: number;
	/** Input tokens of the first request: system prompt, tool listing and task */
	firstRequestTokens: number;
	inputTokens: number;
	outputTokens: number;
	costUsd: number;
	durationMs: number;
	checks: { passed: number; total: number; failed: string[] };
	finalText: string;
};

type Usage = {
	input_tokens?: number;
	output_tokens?: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
};

type ContentBlock = {
	type: string;
	id?: string;
	name?: string;
	tool_use_id?: string;
	is_error?: boolean;
	content?: unknown;
	text?: string;
};

type StreamEvent = {
	type: string;
	subtype?: string;
	tools?: string[];
	mcp_servers?: Array<{ name: string; status: string }>;
	message?: { content?: ContentBlock[]; usage?: Usage };
	result?: string;
	num_turns?: number;
	total_cost_usd?: number;
	usage?: Usage;
	duration_ms?: number;
	is_error?: boolean;
};

/** Parses JSON lines, skipping any line that isn't JSON. */
export function parseTranscript(text: string): StreamEvent[] {
	return text
		.split(/\r?\n/)
		.filter((line) => line.trim().startsWith("{"))
		.flatMap((line) => {
			try {
				return [JSON.parse(line) as StreamEvent];
			} catch {
				return [];
			}
		});
}

const totalInput = (usage: Usage | undefined) =>
	(usage?.input_tokens ?? 0) +
	(usage?.cache_creation_input_tokens ?? 0) +
	(usage?.cache_read_input_tokens ?? 0);

function resultText(content: unknown): string {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return content
			.map((part) => (typeof part?.text === "string" ? part.text : ""))
			.join("\n");
	}
	return "";
}

function classifyError(text: string): NonNullable<ToolCall["error"]> {
	if (
		text.includes("Input validation error") ||
		text.includes("Invalid arguments")
	) {
		return "invalid-input";
	}
	if (text.includes("Strict validation failed")) return "strict";
	if (/Tool .* not found/.test(text)) return "unknown-tool";
	return "other";
}

export function summarizeRun(
	events: StreamEvent[],
	scenario: Scenario,
): RunSummary {
	const init = events.find((e) => e.type === "system" && e.subtype === "init");
	const kern = init?.mcp_servers?.find((server) => server.name === "kern");
	const result = events.find((e) => e.type === "result");
	const firstAssistant = events.find(
		(e) => e.type === "assistant" && e.message?.usage,
	);

	// Claude Code emits each content block as its own event; a tool_use id can repeat.
	const calls = new Map<string, ToolCall>();
	for (const event of events) {
		for (const block of event.message?.content ?? []) {
			if (
				event.type === "assistant" &&
				block.type === "tool_use" &&
				block.id &&
				block.name?.startsWith(KERN_PREFIX) &&
				!calls.has(block.id)
			) {
				calls.set(block.id, {
					tool: block.name.slice(KERN_PREFIX.length),
					error: null,
				});
			}
			if (
				event.type === "user" &&
				block.type === "tool_result" &&
				block.tool_use_id
			) {
				const call = calls.get(block.tool_use_id);
				if (call && block.is_error) {
					call.error = classifyError(resultText(block.content));
				}
			}
		}
	}
	const ordered = [...calls.values()];

	let retries = 0;
	const lastErrored = new Map<string, boolean>();
	for (const call of ordered) {
		if (lastErrored.get(call.tool)) retries += 1;
		lastErrored.set(call.tool, call.error !== null);
	}

	const finalText = result?.result ?? "";
	const failed = [
		...(scenario.expectTools ?? [])
			.filter(
				(group) => !group.some((tool) => ordered.some((c) => c.tool === tool)),
			)
			.map((group) => `called ${group.join(" or ")}`),
		...(scenario.expectHtml ?? []).filter(
			(marker) => !finalText.includes(marker),
		),
	];
	const total =
		(scenario.expectTools?.length ?? 0) + (scenario.expectHtml?.length ?? 0);

	return {
		scenario: scenario.id,
		completed: result?.subtype === "success" && result.is_error !== true,
		connected: kern?.status === "connected",
		toolsListed: (init?.tools ?? []).filter((t) => t.startsWith(KERN_PREFIX))
			.length,
		calls: ordered,
		toolCalls: ordered.length,
		errorResults: ordered.filter((c) => c.error !== null).length,
		invalidInputErrors: ordered.filter((c) => c.error === "invalid-input")
			.length,
		retries,
		turns: result?.num_turns ?? 0,
		firstRequestTokens: totalInput(firstAssistant?.message?.usage),
		inputTokens: totalInput(result?.usage),
		outputTokens: result?.usage?.output_tokens ?? 0,
		costUsd: result?.total_cost_usd ?? 0,
		durationMs: result?.duration_ms ?? 0,
		checks: { passed: total - failed.length, total, failed },
		finalText,
	};
}

export type Aggregate = {
	runs: number;
	completed: number;
	toolCalls: number;
	errorResults: number;
	invalidInputErrors: number;
	retries: number;
	turns: number;
	checksPassed: number;
	checksTotal: number;
	firstRequestTokens: number;
	inputTokens: number;
	outputTokens: number;
	costUsd: number;
	durationMs: number;
};

/** Sums the runs; firstRequestTokens is the maximum, since it's the same listing every time. */
export function aggregate(runs: readonly RunSummary[]): Aggregate {
	const sum = (pick: (run: RunSummary) => number) =>
		runs.reduce((total, run) => total + pick(run), 0);
	return {
		runs: runs.length,
		completed: runs.filter((run) => run.completed).length,
		toolCalls: sum((r) => r.toolCalls),
		errorResults: sum((r) => r.errorResults),
		invalidInputErrors: sum((r) => r.invalidInputErrors),
		retries: sum((r) => r.retries),
		turns: sum((r) => r.turns),
		checksPassed: sum((r) => r.checks.passed),
		checksTotal: sum((r) => r.checks.total),
		firstRequestTokens: Math.max(0, ...runs.map((r) => r.firstRequestTokens)),
		inputTokens: sum((r) => r.inputTokens),
		outputTokens: sum((r) => r.outputTokens),
		costUsd: sum((r) => r.costUsd),
		durationMs: sum((r) => r.durationMs),
	};
}
