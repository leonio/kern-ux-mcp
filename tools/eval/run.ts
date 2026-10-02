/**
 * The R5 scripted baseline: runs each scenario through Claude Code in headless
 * mode, with a small model and the kern stdio server as its only tools, and
 * records tool calls, errors, retries, tokens and cost per run.
 *
 *   npm run eval -- --label baseline [--server <path/to/stdio/dist/index.js>]
 *                   [--runs 2] [--only contact-form,faq] [--model claude-haiku-4-5]
 *                   [--concurrency 2]
 *   npm run eval -- --label baseline --from-transcripts
 *                   (re-scores the saved transcripts, e.g. after changing the checks)
 *
 * It uses the Claude Code login of whoever runs it (no API key needed); each run
 * costs a few cents at Haiku rates. The summary goes to
 * docs/plan-v2/r5-eval/<label>.json, raw transcripts to tools/eval/.runs/<label>/.
 */
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SCENARIOS, type Scenario } from "./scenarios.js";
import {
	aggregate,
	parseTranscript,
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
		"Usage: npm run eval -- --label <name> [--server <path>] [--runs 2] [--only a,b] [--model claude-haiku-4-5] [--concurrency 2]",
	);
	process.exit(2);
}
const server = path.resolve(
	option("server", path.join(REPO_ROOT, "packages/stdio/dist/index.js")) ?? "",
);
const runs = Number(option("runs", "2"));
const model = option("model", "claude-haiku-4-5") ?? "claude-haiku-4-5";
const concurrency = Number(option("concurrency", "2"));
const only = option("only")?.split(",");
const scenarios = SCENARIOS.filter((s) => !only || only.includes(s.id));
const fromTranscripts = process.argv.includes("--from-transcripts");

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
		const dirty = execFileSync("git", ["-C", dir, "status", "--porcelain"], {
			encoding: "utf8",
		}).trim();
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

function runOnce(scenario: Scenario, attempt: number): Promise<RunSummary> {
	const args = [
		"-p",
		scenario.prompt,
		"--model",
		model,
		"--mcp-config",
		mcpConfig,
		"--strict-mcp-config",
		"--tools",
		"",
		"--allowedTools",
		"mcp__kern__*",
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
const reportDir = path.join(REPO_ROOT, "docs/plan-v2/r5-eval");
const reportPath = path.join(reportDir, `${label}.json`);
const describeRun = (summary: RunSummary, attempt: number) =>
	`${summary.scenario} #${attempt}: ${summary.completed ? "done" : "FAILED"}, ${summary.toolCalls} calls, ${summary.errorResults} errors, ${summary.retries} retries, checks ${summary.checks.passed}/${summary.checks.total}, $${summary.costUsd.toFixed(3)}`;

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
		`Eval "${label}": ${jobs.length} runs (${scenarios.length} scenarios × ${runs}) with ${model} against ${server}`,
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
	};
});
const total = aggregate(results);
// Re-scoring keeps what describes the original run.
const previous = fromTranscripts
	? (JSON.parse(await fs.readFile(reportPath, "utf8")) as Record<
			string,
			unknown
		>)
	: undefined;
const report = {
	label,
	date: previous?.date ?? new Date().toISOString(),
	...(previous ? { rescored: new Date().toISOString() } : {}),
	model: previous?.model ?? model,
	serverCommit: previous?.serverCommit ?? serverCommit(),
	runsPerScenario: previous?.runsPerScenario ?? runs,
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
	`Tokens: first request ${total.firstRequestTokens}, input ${total.inputTokens}, output ${total.outputTokens}; cost $${total.costUsd.toFixed(2)}; ${Math.round(total.durationMs / 1000)} s`,
);
console.log(
	`Summary: docs/plan-v2/r5-eval/${label}.json, transcripts: tools/eval/.runs/${label}/`,
);
