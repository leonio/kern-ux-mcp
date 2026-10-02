import { describe, expect, it } from "vitest";

import type { Scenario } from "./scenarios.js";
import { aggregate, parseTranscript, summarizeRun } from "./transcript.js";

const scenario: Scenario = {
	id: "demo",
	prompt: "…",
	expectTools: [["validate_html"], ["get_card", "render_composition"]],
	expectHtml: ["kern-btn", "<form"],
};

const line = (event: object) => JSON.stringify(event);
const usage = (input: number, cacheCreate: number, cacheRead: number) => ({
	input_tokens: input,
	cache_creation_input_tokens: cacheCreate,
	cache_read_input_tokens: cacheRead,
	output_tokens: 5,
});

// The shape Claude Code writes with --output-format stream-json: one event per
// content block, tool results in user events, a result event at the end.
const transcript = [
	line({ type: "rate_limit_event" }),
	line({
		type: "system",
		subtype: "init",
		tools: ["mcp__kern__get_button", "mcp__kern__validate_html", "Bash"],
		mcp_servers: [{ name: "kern", status: "connected" }],
	}),
	line({
		type: "assistant",
		message: { content: [{ type: "thinking" }], usage: usage(10, 70_000, 0) },
	}),
	line({
		type: "assistant",
		message: {
			content: [
				{
					type: "tool_use",
					id: "t1",
					name: "mcp__kern__get_button",
					input: {},
				},
			],
			usage: usage(10, 70_000, 0),
		},
	}),
	line({
		type: "user",
		message: {
			content: [
				{
					type: "tool_result",
					tool_use_id: "t1",
					is_error: true,
					content: [
						{
							type: "text",
							text: "Input validation error: Invalid arguments for tool get_button:\n- label: …",
						},
					],
				},
			],
		},
	}),
	line({
		type: "assistant",
		message: {
			content: [
				{
					type: "tool_use",
					id: "t2",
					name: "mcp__kern__get_button",
					input: { label: "Senden" },
				},
			],
			usage: usage(8, 300, 70_000),
		},
	}),
	line({
		type: "user",
		message: {
			content: [
				{
					type: "tool_result",
					tool_use_id: "t2",
					// The model may describe a long page instead of pasting it; the checks see the tool's HTML.
					content: '{"html":"<form>…</form>","warnings":[]}',
				},
			],
		},
	}),
	line({
		type: "assistant",
		message: {
			content: [
				{
					type: "tool_use",
					id: "t3",
					name: "mcp__kern__validate_html",
					input: {},
				},
			],
		},
	}),
	line({
		type: "user",
		message: {
			content: [
				{
					type: "tool_result",
					tool_use_id: "t3",
					is_error: true,
					content: "Strict validation failed for get_x",
				},
			],
		},
	}),
	"not json",
	line({
		type: "result",
		subtype: "success",
		is_error: false,
		num_turns: 4,
		total_cost_usd: 0.15,
		duration_ms: 6000,
		usage: usage(30, 70_300, 140_000),
		result: 'Here it is: <button class="kern-btn">Senden</button>',
	}),
].join("\n");

describe("summarizeRun", () => {
	const run = summarizeRun(parseTranscript(transcript), scenario);

	it("reads connection, tool calls, errors and retries", () => {
		expect(run.connected).toBe(true);
		expect(run.toolsListed).toBe(2);
		expect(run.calls).toEqual([
			{ tool: "get_button", error: "invalid-input" },
			{ tool: "get_button", error: null },
			{ tool: "validate_html", error: "strict" },
		]);
		expect(run.toolCalls).toBe(3);
		expect(run.errorResults).toBe(2);
		expect(run.invalidInputErrors).toBe(1);
		expect(run.retries).toBe(1);
	});

	it("reads turns, tokens, cost and time from the transcript", () => {
		expect(run.completed).toBe(true);
		expect(run.turns).toBe(4);
		expect(run.firstRequestTokens).toBe(70_010);
		expect(run.inputTokens).toBe(210_330);
		expect(run.outputTokens).toBe(5);
		expect(run.costUsd).toBe(0.15);
		expect(run.durationMs).toBe(6000);
	});

	it("checks the expected tools, and markup in the answer or the tools' HTML", () => {
		expect(run.checks).toEqual({
			passed: 3,
			total: 4,
			failed: ["called get_card or render_composition"],
		});
	});

	it("treats a missing result as not completed", () => {
		const cut = summarizeRun(
			parseTranscript(transcript.split("\n").slice(0, 5).join("\n")),
			scenario,
		);
		expect(cut.completed).toBe(false);
		expect(cut.turns).toBe(0);
	});
});

describe("aggregate", () => {
	it("sums runs and keeps the largest first request", () => {
		const run = summarizeRun(parseTranscript(transcript), scenario);
		const total = aggregate([
			run,
			{ ...run, firstRequestTokens: 60_000, completed: false },
		]);

		expect(total).toMatchObject({
			runs: 2,
			completed: 1,
			toolCalls: 6,
			errorResults: 4,
			retries: 2,
			checksPassed: 6,
			checksTotal: 8,
			firstRequestTokens: 70_010,
			costUsd: 0.3,
		});
	});
});
