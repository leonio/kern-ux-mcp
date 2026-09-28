/**
 * Packs the stdio server as an MCP Bundle (.mcpb) for Claude Desktop and other
 * MCPB hosts. It ships standalone/ (the fully inlined bundle, no node_modules),
 * so run it from packages/stdio after the build:
 *
 *   npm run build -w packages/stdio && npm run pack:mcpb -w packages/stdio
 *
 * mcpb-dist/bundle/ gets manifest.json (the mcpb/manifest.json template with the
 * package version and the static tools[] list, which is fixed per release),
 * server/ (the standalone bundle and its THIRD_PARTY_LICENSES.txt), LICENSE.md,
 * README.md, and mcpb/icon.png if there is one. `mcpb validate` and `mcpb pack`
 * then write mcpb-dist/kern-ux-mcp-<version>.mcpb.
 */
import { execFileSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCatalog } from "@leonio/kern-ux-core";

/**
 * Pinned, and run through npm exec rather than installed: its interactive
 * `init` pulls in packages with audit advisories that would otherwise sit in
 * the lockfile, and pack/validate don't need them.
 */
const MCPB_CLI = "@anthropic-ai/mcpb@2.1.2";
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

const packageDir = process.cwd();
const pkg = JSON.parse(
	readFileSync(path.join(packageDir, "package.json"), "utf8"),
) as { version: string };
const standalone = path.join(packageDir, "standalone");
const npmCli = process.env.npm_execpath;

if (!existsSync(path.join(standalone, "index.js"))) {
	console.error(
		"standalone/index.js is missing. Build first: npm run build -w packages/stdio",
	);
	process.exit(1);
}
if (!npmCli) {
	console.error("Run this through npm: npm run pack:mcpb -w packages/stdio");
	process.exit(1);
}

/** The first sentence of a tool description: the manifest's list is for display. */
function summary(description: string): string {
	const first = description.split(/(?<=[.!?])\s/)[0]?.trim() ?? description;
	return first.length <= 200 ? first : `${first.slice(0, 199)}…`;
}

function mcpb(...args: string[]): void {
	execFileSync(
		process.execPath,
		[
			npmCli as string,
			"exec",
			"--yes",
			`--package=${MCPB_CLI}`,
			"--",
			"mcpb",
			...args,
		],
		{ stdio: "inherit" },
	);
}

const outDir = path.join(packageDir, "mcpb-dist");
const bundleDir = path.join(outDir, "bundle");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(bundleDir, { recursive: true });

const manifest = JSON.parse(
	readFileSync(path.join(packageDir, "mcpb", "manifest.json"), "utf8"),
) as Record<string, unknown>;
manifest.version = pkg.version;
manifest.tools = getCatalog().tools.map((tool) => ({
	name: tool.name,
	description: summary(tool.description),
}));

const icon = path.join(packageDir, "mcpb", "icon.png");
if (existsSync(icon)) {
	cpSync(icon, path.join(bundleDir, "icon.png"));
	manifest.icon = "icon.png";
}

writeFileSync(
	path.join(bundleDir, "manifest.json"),
	`${JSON.stringify(manifest, null, "\t")}\n`,
);
cpSync(standalone, path.join(bundleDir, "server"), { recursive: true });
for (const file of ["LICENSE.md", "README.md"]) {
	cpSync(path.join(REPO_ROOT, file), path.join(bundleDir, file));
}

const output = path.join(outDir, `kern-ux-mcp-${pkg.version}.mcpb`);
mcpb("validate", path.join(bundleDir, "manifest.json"));
mcpb("pack", bundleDir, output);
console.log(`Packed ${path.relative(packageDir, output)}`);
