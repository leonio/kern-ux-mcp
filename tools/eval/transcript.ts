/**
 * Turns a Claude Code `--output-format stream-json` transcript into the
 * measurements the R5 baseline compares: kern tool calls, error results,
 * retries, turns, tokens, cost and the scenario's completion checks, plus what
 * reached the user: whether the answer carries the tools' HTML, whether the model
 * wrote KERN markup by hand, and how that HTML validates.
 */
import { parse } from "node-html-parser";

import { validateHtmlStrict } from "../../packages/core/src/ux/validate.js";
import type { Scenario } from "./scenarios.js";

const KERN_PREFIX = "mcp__kern__";

/** The tools that take the whole recursive block union. */
const COMPOSITION_TOOLS: ReadonlySet<string> = new Set([
	"render_composition",
	"render_page",
]);

/**
 * How the built HTML reached the user: the answer contains the largest tool
 * result as is (verbatim), contains other HTML (edited), only describes it
 * (described), or no HTML exists at all (none).
 */
export type Delivery = "verbatim" | "edited" | "described" | "none";

export type ToolCall = {
	tool: string;
	/**
	 * null until its result arrives (or if it never does). "unparsable": the
	 * client rejected input that wasn't JSON, so the server never saw the call.
	 */
	error:
		| null
		| "invalid-input"
		| "unparsable"
		| "strict"
		| "unknown-tool"
		| "other";
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
	/** Calls, error results and retries on render_composition and render_page */
	compositionCalls: number;
	compositionErrors: number;
	compositionRetries: number;
	/** The deepest block nesting and the most blocks in one render_composition or render_page call */
	blockDepth: number;
	blockNodes: number;
	delivery: Delivery;
	/** The answer's KERN markup is mostly hand-written: most of its class attributes appear in no tool result */
	fallback: boolean;
	/** Errors validate_html finds in the delivered HTML; null when there is none */
	strictErrors: number | null;
	/** Calls to Claude Code's ListMcpResourcesTool (with --resources) */
	resourceLists: number;
	/** The URIs read with Claude Code's ReadMcpResourceTool, in order */
	resourceReads: string[];
	finalText: string;
};

/** Claude Code's tools for MCP resources, which --resources turns on. */
export const RESOURCE_TOOLS = {
	list: "ListMcpResourcesTool",
	read: "ReadMcpResourceTool",
} as const;

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
	input?: unknown;
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

/** The `html` of a kern tool result (its JSON text block), if it has one. */
function htmlOf(text: string): string | undefined {
	try {
		const parsed = JSON.parse(text) as { html?: unknown };
		return typeof parsed?.html === "string" ? parsed.html : undefined;
	} catch {
		return undefined;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Nesting depth and count of block nodes (objects with a `kind`) in a tool input. */
export function blockShape(
	value: unknown,
	depth = 0,
): { depth: number; nodes: number } {
	const children = Array.isArray(value)
		? value
		: isRecord(value)
			? Object.values(value)
			: [];
	const isBlock = isRecord(value) && typeof value.kind === "string";
	const level = isBlock ? depth + 1 : depth;
	return children.reduce<{ depth: number; nodes: number }>(
		(shape, child) => {
			const inner = blockShape(child, level);
			return {
				depth: Math.max(shape.depth, inner.depth),
				nodes: shape.nodes + inner.nodes,
			};
		},
		{ depth: isBlock ? level : 0, nodes: isBlock ? 1 : 0 },
	);
}

const TAG = /<[a-zA-Z][^>]*>/g;

/**
 * The HTML in a final answer: its fenced code blocks that contain tags, or else
 * the span from the first tag to the last, leaving out tags named in inline code
 * (`<caption>`). Fewer than three tags is prose.
 */
export function htmlInAnswer(text: string): string | undefined {
	const fenced = [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)]
		.map((match) => match[1] ?? "")
		.filter((block) => (block.match(TAG) ?? []).length >= 3);
	const prose = text.replace(/`[^`\n]*`/g, "");
	const html =
		fenced.length > 0
			? fenced.join("\n")
			: prose.slice(
					Math.max(0, prose.search(/<[a-zA-Z!]/)),
					prose.lastIndexOf(">") + 1,
				);
	return (html.match(TAG) ?? []).length >= 3 ? html : undefined;
}

const normalizeHtml = (html: string) =>
	html
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/\s+/g, " ")
		.replace(/> </g, "><")
		.trim();

const classAttributes = (html: string) =>
	new Set(
		[...html.matchAll(/class="([^"]*)"/g)]
			.map((match) => (match[1] ?? "").trim().replace(/\s+/g, " "))
			.filter((value) => value.length > 0),
	);

/** Verbatim when the answer holds the last render, or else the largest tool HTML. */
function deliveryOf(
	answerHtml: string | undefined,
	toolHtml: string[],
	lastRender: string | undefined,
): Delivery {
	if (!answerHtml) return toolHtml.length > 0 ? "described" : "none";
	const largest = toolHtml.reduce((a, b) => (b.length > a.length ? b : a), "");
	const answer = normalizeHtml(answerHtml);
	return [lastRender, largest].some(
		(html) => html && answer.includes(normalizeHtml(html)),
	)
		? "verbatim"
		: "edited";
}

function isFallback(answerHtml: string | undefined, toolHtml: string[]) {
	if (!answerHtml) return false;
	const own = classAttributes(answerHtml);
	if (own.size === 0) return false;
	const fromTools = classAttributes(toolHtml.join("\n"));
	const handWritten = [...own].filter((value) => !fromTools.has(value));
	return handWritten.length / own.size > 0.5;
}

/** The scenario's structure checks that the delivered HTML fails. */
function failedStructure(scenario: Scenario, html: string | undefined) {
	const root = html ? parse(html) : undefined;
	return (scenario.expectStructure ?? []).flatMap((check) => {
		const count = root ? root.querySelectorAll(check.selector).length : 0;
		const ok =
			root !== undefined &&
			(check.min === undefined || count >= check.min) &&
			(check.max === undefined || count <= check.max);
		return ok ? [] : [`structure: ${check.label ?? check.selector} (${count})`];
	});
}

function classifyError(text: string): NonNullable<ToolCall["error"]> {
	if (text.includes("could not be parsed as JSON")) return "unparsable";
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
	const shape = { depth: 0, nodes: 0 };
	// The HTML the kern tools returned: a model may describe a long page instead
	// of pasting it, so the checks look at what was built as well as the answer.
	const toolHtml: string[] = [];
	// The last render_composition or render_page result: a model that renders
	// again answers with the later render, which can be the smaller one.
	let lastRender: string | undefined;
	// Resource tool calls by id: a list, or a read of a URI.
	const resourceCalls = new Map<string, { read: boolean; uri: string }>();
	for (const event of events) {
		for (const block of event.message?.content ?? []) {
			if (
				event.type === "assistant" &&
				block.type === "tool_use" &&
				block.id &&
				(block.name === RESOURCE_TOOLS.list ||
					block.name === RESOURCE_TOOLS.read)
			) {
				const uri = (block.input as { uri?: unknown } | undefined)?.uri;
				resourceCalls.set(block.id, {
					read: block.name === RESOURCE_TOOLS.read,
					uri: typeof uri === "string" ? uri : "",
				});
			}
			if (
				event.type === "assistant" &&
				block.type === "tool_use" &&
				block.id &&
				block.name?.startsWith(KERN_PREFIX) &&
				!calls.has(block.id)
			) {
				const tool = block.name.slice(KERN_PREFIX.length);
				calls.set(block.id, { tool, error: null });
				if (COMPOSITION_TOOLS.has(tool)) {
					const inner = blockShape(block.input);
					shape.depth = Math.max(shape.depth, inner.depth);
					shape.nodes = Math.max(shape.nodes, inner.nodes);
				}
			}
			if (
				event.type === "user" &&
				block.type === "tool_result" &&
				block.tool_use_id
			) {
				const call = calls.get(block.tool_use_id);
				if (call && block.is_error) {
					call.error = classifyError(resultText(block.content));
				} else if (call) {
					const html = htmlOf(resultText(block.content));
					if (html) toolHtml.push(html);
					if (html && COMPOSITION_TOOLS.has(call.tool)) lastRender = html;
				}
			}
		}
	}
	const ordered = [...calls.values()];

	let retries = 0;
	let compositionRetries = 0;
	const lastErrored = new Map<string, boolean>();
	for (const call of ordered) {
		if (lastErrored.get(call.tool)) {
			retries += 1;
			if (COMPOSITION_TOOLS.has(call.tool)) compositionRetries += 1;
		}
		lastErrored.set(call.tool, call.error !== null);
	}
	const composition = ordered.filter((c) => COMPOSITION_TOOLS.has(c.tool));

	const finalText = result?.result ?? "";
	const built = [finalText, ...toolHtml].join("\n");
	const answerHtml = htmlInAnswer(finalText);
	// What the user gets: the answer's HTML, or what the tools built if it only describes it.
	const delivered =
		answerHtml ?? (toolHtml.length > 0 ? toolHtml.join("\n") : undefined);
	const failed = [
		...(scenario.expectTools ?? [])
			.filter(
				(group) => !group.some((tool) => ordered.some((c) => c.tool === tool)),
			)
			.map((group) => `called ${group.join(" or ")}`),
		...(scenario.expectHtml ?? []).filter((marker) => !built.includes(marker)),
		...failedStructure(scenario, delivered),
	];
	const total =
		(scenario.expectTools?.length ?? 0) +
		(scenario.expectHtml?.length ?? 0) +
		(scenario.expectStructure?.length ?? 0);

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
		compositionCalls: composition.length,
		compositionErrors: composition.filter((c) => c.error !== null).length,
		compositionRetries,
		blockDepth: shape.depth,
		blockNodes: shape.nodes,
		delivery: deliveryOf(answerHtml, toolHtml, lastRender),
		fallback: isFallback(answerHtml, toolHtml),
		strictErrors: delivered
			? validateHtmlStrict(delivered).issues.filter(
					(issue) => issue.severity === "error",
				).length
			: null,
		resourceLists: [...resourceCalls.values()].filter((call) => !call.read)
			.length,
		resourceReads: [...resourceCalls.values()]
			.filter((call) => call.read)
			.map((call) => call.uri),
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
	compositionCalls: number;
	compositionErrors: number;
	compositionRetries: number;
	/** Maximum over the runs */
	blockDepth: number;
	blockNodes: number;
	deliveredVerbatim: number;
	deliveredEdited: number;
	deliveredDescribed: number;
	fallbacks: number;
	/** Runs whose delivered HTML has no validate_html errors */
	strictValid: number;
	/** Calls to Claude Code's resource tools: lists, and reads */
	resourceLists: number;
	resourceReads: number;
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
		compositionCalls: sum((r) => r.compositionCalls),
		compositionErrors: sum((r) => r.compositionErrors),
		compositionRetries: sum((r) => r.compositionRetries),
		blockDepth: Math.max(0, ...runs.map((r) => r.blockDepth)),
		blockNodes: Math.max(0, ...runs.map((r) => r.blockNodes)),
		deliveredVerbatim: runs.filter((r) => r.delivery === "verbatim").length,
		deliveredEdited: runs.filter((r) => r.delivery === "edited").length,
		deliveredDescribed: runs.filter((r) => r.delivery === "described").length,
		fallbacks: runs.filter((r) => r.fallback).length,
		strictValid: runs.filter((r) => r.strictErrors === 0).length,
		resourceLists: sum((r) => r.resourceLists),
		resourceReads: sum((r) => r.resourceReads.length),
		firstRequestTokens: Math.max(0, ...runs.map((r) => r.firstRequestTokens)),
		inputTokens: sum((r) => r.inputTokens),
		outputTokens: sum((r) => r.outputTokens),
		costUsd: sum((r) => r.costUsd),
		durationMs: sum((r) => r.durationMs),
	};
}
