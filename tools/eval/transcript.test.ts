import { describe, expect, it } from "vitest";

import type { Scenario } from "./scenarios.js";
import {
	aggregate,
	blockShape,
	htmlInAnswer,
	parseTranscript,
	summarizeRun,
} from "./transcript.js";

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

describe("what reached the user", () => {
	type Call = { tool: string; input?: object; html?: string; error?: string };

	/** A transcript with the given kern calls and final answer. */
	const runOf = (calls: Call[], answer: string, check: Scenario = scenario) =>
		summarizeRun(
			parseTranscript(
				[
					...calls.flatMap((call, index) => [
						line({
							type: "assistant",
							message: {
								content: [
									{
										type: "tool_use",
										id: `c${index}`,
										name: `mcp__kern__${call.tool}`,
										input: call.input ?? {},
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
										tool_use_id: `c${index}`,
										is_error: call.error !== undefined,
										content:
											call.error ?? JSON.stringify({ html: call.html ?? "" }),
									},
								],
							},
						}),
					]),
					line({ type: "result", subtype: "success", result: answer }),
				].join("\n"),
			),
			check,
		);

	const card = '<div class="kern-card"><p class="kern-body">A</p></div>';

	it("measures the nesting of render_composition and render_page input", () => {
		const blocks = {
			contentBlocks: [
				{
					kind: "section",
					section: {
						contentBlocks: [
							{
								kind: "grid",
								grid: {
									columnsContent: [
										[
											{
												kind: "card",
												card: { contentBlocks: [{ kind: "badge" }] },
											},
										],
										[{ kind: "text" }],
									],
								},
							},
						],
					},
				},
			],
		};
		const run = runOf(
			[
				{
					tool: "render_composition",
					input: blocks,
					error: "Invalid arguments",
				},
				{ tool: "render_composition", input: blocks, html: card },
				{ tool: "get_badge", input: { kind: "x" }, html: "<span></span>" },
			],
			"Done.",
		);

		expect(blockShape(blocks)).toEqual({ depth: 4, nodes: 5 });
		expect(run).toMatchObject({
			compositionCalls: 2,
			compositionErrors: 1,
			compositionRetries: 1,
			blockDepth: 4,
			blockNodes: 5,
		});
	});

	it("tells a pasted result from an edited, a described and a hand-written one", () => {
		const tools = [{ tool: "get_card", html: card }];

		expect(
			runOf(tools, `Here:\n\`\`\`html\n<main>\n  ${card}\n</main>\n\`\`\``),
		).toMatchObject({ delivery: "verbatim", fallback: false });
		expect(
			runOf(
				tools,
				'<main><div class="kern-card"><p class="kern-body">B</p></div></main>',
			),
		).toMatchObject({ delivery: "edited", fallback: false });
		expect(runOf(tools, "I built a card with the text A.")).toMatchObject({
			delivery: "described",
			fallback: false,
		});
		expect(
			runOf(
				[],
				'<div class="kern-grid"><div class="kern-box"><p>B</p></div></div>',
			),
		).toMatchObject({ delivery: "edited", fallback: true });
		expect(runOf([], "No HTML here.")).toMatchObject({
			delivery: "none",
			strictErrors: null,
		});
	});

	it("checks structure and validates the delivered HTML", () => {
		const nested: Scenario = {
			id: "nested",
			prompt: "…",
			expectStructure: [
				{ selector: ".kern-card", min: 2 },
				{
					selector: ".kern-card .kern-card",
					max: 0,
					label: "no card in a card",
				},
			],
		};
		const twoCards = runOf(
			[{ tool: "get_card", html: card + card }],
			"Done.",
			nested,
		);
		const cardInCard = runOf(
			[],
			`<div class="kern-card">${card}</div><img src="a.png">`,
			nested,
		);

		expect(twoCards.checks).toEqual({ passed: 2, total: 2, failed: [] });
		expect(twoCards.strictErrors).toBe(0);
		expect(cardInCard.checks.failed).toEqual([
			"structure: no card in a card (1)",
		]);
		expect(cardInCard.strictErrors).toBeGreaterThan(0);
	});

	it("finds the HTML in an answer", () => {
		expect(htmlInAnswer("Use `<details>` for this.")).toBeUndefined();
		expect(
			htmlInAnswer("Added `<caption>`, `<thead>` and `<tbody>`."),
		).toBeUndefined();
		expect(
			htmlInAnswer("```css\n.a{}\n```\n```html\n<a><b><i>x</i></b></a>\n```"),
		).toBe("<a><b><i>x</i></b></a>\n");
		expect(htmlInAnswer("Result: <p><b>x</b><i>y</i></p> done")).toBe(
			"<p><b>x</b><i>y</i></p>",
		);
	});
});
