/**
 * Bundles a host package (packages/stdio, packages/http) with esbuild into
 * dist/index.js. npm runs workspace scripts from the package directory, so the
 * package to build is the current working directory.
 *
 * @leonio/kern-ux-core is private and never published, so it's inlined, read
 * from its TypeScript source through the "@leonio/source" export condition.
 * Third-party packages stay external: they're real dependencies of the
 * published package, so users get their patches and the SBOM stays accurate.
 *
 * Usage: tsx ../../tools/build/bundle.ts [--watch]
 */
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { type BuildOptions, build, context } from "esbuild";

const packageDir = process.cwd();
const manifest = JSON.parse(
	readFileSync(path.join(packageDir, "package.json"), "utf8"),
) as { name: string; dependencies?: Record<string, string> };
const outdir = path.join(packageDir, "dist");

const options: BuildOptions = {
	entryPoints: [path.join(packageDir, "src", "index.ts")],
	outfile: path.join(outdir, "index.js"),
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node24",
	conditions: ["@leonio/source"],
	// Subpath imports (e.g. @modelcontextprotocol/server/stdio) follow their package.
	external: Object.keys(manifest.dependencies ?? {}),
	logLevel: "warning",
};

rmSync(outdir, { recursive: true, force: true });

if (process.argv.includes("--watch")) {
	const ctx = await context({ ...options, logLevel: "info" });
	await ctx.watch();
} else {
	await build(options);
	console.log(
		`Bundled ${manifest.name} into ${path.relative(process.cwd(), outdir)}`,
	);
}
