/**
 * The R5 scripted baseline: runs each scenario through Claude Code in headless
 * mode, with a small model and the kern stdio server as its only tools, and
 * records tool calls, errors, retries, tokens and cost per run.
 *
 *   npm run eval -- --label baseline [--suite base|nested|resources|prompts]
 *                   [--server <path/to/stdio/dist/index.js>] [--runs 3]
 *                   [--only contact-form,faq] [--model claude-haiku-4-5] [--concurrency 2]
 *                   [--resources] [--without-prompts]
 *   npm run eval -- --label baseline --from-transcripts
 *                   (re-scores the saved transcripts, e.g. after changing the checks)
 *
 * The base suite is the ten R5 scenarios; nested is four layouts that need the
 * recursive block union; resources is two tasks a card or guide should help
 * with; prompts is tasks of the others asked through our MCP prompts
 * (scenarios.ts). --resources turns on Claude Code's tools for listing and
 * reading MCP resources; run a suite with and without it to compare. The
 * prompts suite renders each prompt from the server under test (prompt-text.ts)
 * and sends that text; --without-prompts sends the tasks' own text instead.
 *
 * It uses the Claude Code login of whoever runs it (no API key needed); each run
 * costs a few cents at Haiku rates. The summary goes to
 * docs/plan-v2/evals/<label>.json, raw transcripts to tools/eval/.runs/<label>/.
 */
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

import { promptText } from "./prompt-text.js";
import { type Scenario, SUITES } from "./scenarios.js";
import {
	aggregate,
	parseTranscript,
	RESOURCE_TOOLS,
	type RunSummary,
	summarizeRun,
} from "./transcript.js";

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const RUN_TIMEOUT_MS = 6 * 60_000;

// Like a plain MCP client: no coding instructions, only the task and the tools.
const SYSTEM_PROMPT =
	"You build web page markup with the KERN UX design system. Use the kern tools to render components instead of writing KERN markup by hand. When you're done, reply with the final HTML.";

function option(name: string, fallback?: string): string | undefined {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 ? process.argv[index + 1] : fallback;
}

const label = option("label");
if (!label || !/^[\w.-]+$/.test(label)) {
	console.error(
		"Usage: npm run eval -- --label <name> [--suite base|nested|resources|prompts] [--server <path>] [--runs 3] [--only a,b] [--model claude-haiku-4-5] [--concurrency 2] [--resources] [--without-prompts]",
	);
	process.exit(2);
}
const fromTranscripts = process.argv.includes("--from-transcripts");
const reportDir = path.join(REPO_ROOT, "docs/plan-v2/evals");
const reportPath = path.join(reportDir, `${label}.json`);
// Re-scoring keeps what describes the original run, including its suite.
const previous = fromTranscripts
	? (JSON.parse(await fs.readFile(reportPath, "utf8")) as Record<
			string,
			unknown
		>)
	: undefined;
const suite =
	option("suite") ??
	(typeof previous?.suite === "string" ? previous.suite : "base");
const suiteScenarios = SUITES[suite];
if (!suiteScenarios) {
	console.error(
		`Unknown suite "${suite}". Suites: ${Object.keys(SUITES).join(", ")}.`,
	);
	process.exit(2);
}
const server = path.resolve(
	option("server", path.join(REPO_ROOT, "packages/stdio/dist/index.js")) ?? "",
);
// The baseline and every comparison since run each scenario three times.
const runs = Number(option("runs", "3"));
const model = option("model", "claude-haiku-4-5") ?? "claude-haiku-4-5";
const concurrency = Number(option("concurrency", "2"));
const only = option("only")?.split(",");
// Claude Code's tools for MCP resources, so the model can list and read them.
const withResources =
	process.argv.includes("--resources") || previous?.resources === true;
const scenarios = suiteScenarios.filter((s) => !only || only.includes(s.id));
// The prompts suite sends each task through its MCP prompt, unless told not to.
const withPrompts =
	!process.argv.includes("--without-prompts") &&
	previous?.mcpPrompts !== false &&
	scenarios.some((s) => s.mcpPrompt);

if (!fromTranscripts) {
	try {
		await fs.access(server);
	} catch {
		console.error(`No server at ${server}. Build it first (npm run build).`);
		process.exit(1);
	}
}

function serverCommit(): string {
	try {
		const dir = path.dirname(server);
		const sha = execFileSync(
			"git",
			["-C", dir, "rev-parse", "--short", "HEAD"],
			{
				encoding: "utf8",
			},
		).trim();
		// The reports this harness writes don't change the server.
		const dirty = execFileSync(
			"git",
			[
				"-C",
				dir,
				"status",
				"--porcelain",
				"--",
				":/",
				":(top,exclude)docs/plan-v2/evals",
			],
			{ encoding: "utf8" },
		).trim();
		return dirty ? `${sha}+dirty` : sha;
	} catch {
		return "unknown";
	}
}

// An empty working directory, so no project instructions or settings leak in.
const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `kern-eval-${label}-`));
const mcpConfig = path.join(workDir, "mcp.json");
await fs.writeFile(
	mcpConfig,
	JSON.stringify({
		mcpServers: { kern: { command: process.execPath, args: [server] } },
	}),
);
const rawDir = path.join(REPO_ROOT, "tools/eval/.runs", label);
await fs.mkdir(rawDir, { recursive: true });

const resourceTools = [RESOURCE_TOOLS.list, RESOURCE_TOOLS.read];

/**
 * Each scenario's MCP prompt, rendered once by the server under test, as the
 * text the runs send. The text goes next to the transcripts for reading.
 */
async function renderPrompts(): Promise<Map<string, string>> {
	const texts = new Map<string, string>();
	if (!withPrompts || fromTranscripts) return texts;
	const client = new Client({ name: "kern-eval", version: "0.0.0" });
	await client.connect(
		new StdioClientTransport({
			command: process.execPath,
			args: [server],
			stderr: "inherit",
		}),
	);
	try {
		for (const scenario of scenarios) {
			if (!scenario.mcpPrompt) continue;
			const { messages } = await client.getPrompt(scenario.mcpPrompt);
			const text = promptText(messages);
			texts.set(scenario.id, text);
			await fs.writeFile(path.join(rawDir, `${scenario.id}.prompt.md`), text);
		}
	} finally {
		await client.close();
	}
	return texts;
}

const promptTexts = await renderPrompts();

function runOnce(scenario: Scenario, attempt: number): Promise<RunSummary> {
	const args = [
		"-p",
		promptTexts.get(scenario.id) ?? scenario.prompt,
		"--model",
		model,
		"--mcp-config",
		mcpConfig,
		"--strict-mcp-config",
		"--tools",
		withResources ? resourceTools.join(",") : "",
		"--allowedTools",
		["mcp__kern__*", ...(withResources ? resourceTools : [])].join(","),
		"--system-prompt",
		SYSTEM_PROMPT,
		"--setting-sources",
		"project",
		"--output-format",
		"stream-json",
		"--verbose",
		"--no-session-persistence",
		"--disable-slash-commands",
	];
	return new Promise((resolve) => {
		const child = spawn(process.env.CLAUDE_BIN ?? "claude", args, {
			cwd: workDir,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let out = "";
		let err = "";
		child.stdout.on("data", (chunk) => {
			out += chunk;
		});
		child.stderr.on("data", (chunk) => {
			err += chunk;
		});
		const timer = setTimeout(() => child.kill(), RUN_TIMEOUT_MS);
		child.on("close", async (code) => {
			clearTimeout(timer);
			await fs.writeFile(
				path.join(rawDir, `${scenario.id}-${attempt}.jsonl`),
				out,
			);
			if (err.trim()) {
				await fs.writeFile(
					path.join(rawDir, `${scenario.id}-${attempt}.err`),
					err,
				);
			}
			const summary = summarizeRun(parseTranscript(out), scenario);
			if (code !== 0 && summary.completed) summary.completed = false;
			resolve(summary);
		});
	});
}

const results: RunSummary[] = [];
const describeRun = (summary: RunSummary, attempt: number) =>
	`${summary.scenario} #${attempt}: ${summary.completed ? "done" : "FAILED"}, ${summary.toolCalls} calls, ${summary.errorResults} errors, ${summary.retries} retries, checks ${summary.checks.passed}/${summary.checks.total}, ${summary.delivery}${summary.fallback ? " (hand-written)" : ""}, strict errors ${summary.strictErrors ?? "-"}, ${summary.resourceReads.length > 0 ? `read ${summary.resourceReads.join(" ")}, ` : ""}$${summary.costUsd.toFixed(3)}`;

if (fromTranscripts) {
	const files = await fs.readdir(rawDir);
	for (const scenario of scenarios) {
		const own = files
			.filter((file) => new RegExp(`^${scenario.id}-\\d+\\.jsonl$`).test(file))
			.sort();
		for (const [index, file] of own.entries()) {
			const text = await fs.readFile(path.join(rawDir, file), "utf8");
			const summary = summarizeRun(parseTranscript(text), scenario);
			results.push(summary);
			console.log(describeRun(summary, index + 1));
		}
	}
} else {
	const jobs = scenarios.flatMap((scenario) =>
		Array.from({ length: runs }, (_, i) => ({ scenario, attempt: i + 1 })),
	);
	let next = 0;
	const worker = async () => {
		while (next < jobs.length) {
			const job = jobs[next++];
			const summary = await runOnce(job.scenario, job.attempt);
			results.push(summary);
			console.log(describeRun(summary, job.attempt));
		}
	};
	console.log(
		`Eval "${label}": ${jobs.length} runs (${scenarios.length} scenarios × ${runs}) with ${model} against ${server}${withResources ? ", with the resource tools" : ""}${withPrompts ? ", through the MCP prompts" : ""}`,
	);
	await Promise.all(Array.from({ length: concurrency }, worker));
}

const byScenario = scenarios.map((scenario) => {
	const own = results.filter((r) => r.scenario === scenario.id);
	return {
		id: scenario.id,
		...aggregate(own),
		failedChecks: own.flatMap((r) => r.checks.failed),
		calls: own.map((r) =>
			r.calls.map((c) => (c.error ? `${c.tool}!${c.error}` : c.tool)),
		),
		...(withResources
			? { resourceReads: own.map((r) => r.resourceReads) }
			: {}),
		...(withPrompts && scenario.mcpPrompt
			? { mcpPrompt: scenario.mcpPrompt.name }
			: {}),
	};
});
const total = aggregate(results);
const report = {
	label,
	suite,
	date: previous?.date ?? new Date().toISOString(),
	...(previous ? { rescored: new Date().toISOString() } : {}),
	model: previous?.model ?? model,
	serverCommit: previous?.serverCommit ?? serverCommit(),
	runsPerScenario: previous?.runsPerScenario ?? runs,
	resources: withResources,
	mcpPrompts: withPrompts,
	systemPrompt: previous?.systemPrompt ?? SYSTEM_PROMPT,
	total,
	scenarios: byScenario,
};
await fs.mkdir(reportDir, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, "\t")}\n`);

console.log(
	`\nTotal: ${total.completed}/${total.runs} completed, ${total.toolCalls} calls, ${total.errorResults} error results (${total.invalidInputErrors} invalid input), ${total.retries} retries, checks ${total.checksPassed}/${total.checksTotal}`,
);
console.log(
	`Answers: ${total.deliveredVerbatim} verbatim, ${total.deliveredEdited} edited, ${total.deliveredDescribed} described, ${total.fallbacks} hand-written; ${total.strictValid}/${total.runs} strict-valid. Composition: ${total.compositionCalls} calls, ${total.compositionErrors} errors, depth ${total.blockDepth}, ${total.blockNodes} blocks at most`,
);
if (withResources) {
	console.log(
		`Resources: ${total.resourceLists} lists, ${total.resourceReads} reads`,
	);
}
console.log(
	`Tokens: first request ${total.firstRequestTokens}, input ${total.inputTokens}, output ${total.outputTokens}; cost $${total.costUsd.toFixed(2)}; ${Math.round(total.durationMs / 1000)} s`,
);
console.log(
	`Summary: docs/plan-v2/evals/${label}.json, transcripts: tools/eval/.runs/${label}/`,
);
