/**
 * Bundles a host package (packages/stdio, packages/http) with esbuild. npm runs
 * workspace scripts from the package directory, so that's the package it builds.
 * Both outputs start from src/index.ts:
 *
 * - dist/index.js, the npm package. @leonio/kern-ux-core is private and never
 *   published, so it's inlined, read from its TypeScript source through the
 *   "@leonio/source" export condition. Third-party packages stay external:
 *   they're real dependencies of the published package, so users get their
 *   patches and the SBOM stays accurate. The build fails if the bundle imports
 *   a package the host doesn't declare, if a declared range differs from core's,
 *   or if a dependency's required peer isn't declared.
 * - standalone/index.js, for the MCPB bundle and the container image. Everything
 *   is inlined, so it runs without node_modules. THIRD_PARTY_LICENSES.txt next
 *   to it carries the licence of every inlined package.
 *
 * Usage: tsx ../../tools/build/bundle.ts [--watch]   (--watch rebuilds dist/ only)
 */
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { isBuiltin } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	type BuildOptions,
	build,
	context,
	type Metafile,
	type Plugin,
} from "esbuild";

type Manifest = {
	name: string;
	version: string;
	license?: string;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	peerDependenciesMeta?: Record<string, { optional?: boolean }>;
};

const CORE = "@leonio/kern-ux-core";
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

const packageDir = process.cwd();
const manifest = readManifest(path.join(packageDir, "package.json"));
const dependencies = manifest.dependencies ?? {};

function readManifest(file: string): Manifest {
	return JSON.parse(readFileSync(file, "utf8")) as Manifest;
}

/** "@scope/name/sub/path" → "@scope/name"; "name/sub" → "name". */
function packageName(specifier: string): string {
	const parts = specifier.split("/");
	return (
		specifier.startsWith("@") ? parts.slice(0, 2) : parts.slice(0, 1)
	).join("/");
}

/** The installed package.json of a dependency, looked up like Node would from `fromDir`. */
function installedManifestPath(
	name: string,
	fromDir = packageDir,
): string | undefined {
	for (let dir = fromDir; ; dir = path.dirname(dir)) {
		const candidate = path.join(dir, "node_modules", name, "package.json");
		if (existsSync(candidate)) return candidate;
		if (path.dirname(dir) === dir) return undefined;
	}
}

function checkDeclaredRanges(): string[] {
	const core = readManifest(
		path.join(REPO_ROOT, "packages", "core", "package.json"),
	);
	const problems: string[] = [];
	for (const [name, range] of Object.entries(dependencies)) {
		const coreRange = core.dependencies?.[name];
		if (coreRange !== undefined && coreRange !== range) {
			problems.push(
				`${name}: ${manifest.name} declares ${range}, core declares ${coreRange}. Keep them equal.`,
			);
		}
		const installed = installedManifestPath(name);
		if (!installed) {
			problems.push(`${name} is declared but not installed. Run npm install.`);
			continue;
		}
		const dependency = readManifest(installed);
		for (const peer of Object.keys(dependency.peerDependencies ?? {})) {
			if (
				!dependency.peerDependenciesMeta?.[peer]?.optional &&
				!(peer in dependencies)
			) {
				problems.push(
					`${name} needs its peer ${peer}; declare it in ${manifest.name} dependencies.`,
				);
			}
		}
	}
	return problems;
}

/**
 * Inlines core and keeps declared third-party packages external. Any other
 * package import fails the build, so a dependency core gains can't silently go
 * missing from a published package.
 */
const declaredDependencies: Plugin = {
	name: "declared-dependencies",
	setup(build) {
		build.onResolve({ filter: /^[^./]/ }, (args) => {
			if (args.kind === "entry-point" || path.isAbsolute(args.path))
				return undefined;
			if (isBuiltin(args.path)) return { path: args.path, external: true };
			const name = packageName(args.path);
			if (name === CORE) return undefined;
			if (name in dependencies) return { path: args.path, external: true };
			return {
				errors: [
					{
						text: `${args.path} is imported by ${path.relative(REPO_ROOT, args.importer)}, but ${manifest.name} doesn't declare ${name} in its dependencies.`,
					},
				],
			};
		});
	},
};

const common: BuildOptions = {
	entryPoints: [path.join(packageDir, "src", "index.ts")],
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node24",
	conditions: ["@leonio/source"],
	logLevel: "warning",
};

const npmOptions: BuildOptions = {
	...common,
	outfile: path.join(packageDir, "dist", "index.js"),
	plugins: [declaredDependencies],
};

const LICENSE_FILE = /^(licen[cs]e|copying)(\.(md|txt))?$/i;

/**
 * THIRD_PARTY_LICENSES.txt for the standalone bundle: every package esbuild
 * inlined, plus their dependencies. Some packages ship a pre-bundled dist
 * (node-html-parser 9 contains css-select and entities), so the inputs alone
 * would miss code that is in the bundle.
 */
function thirdPartyLicenses(metafile: Metafile): string {
	const packageDirs = new Set<string>();
	const pending: string[] = [];
	for (const input of Object.keys(metafile.inputs)) {
		const normalized = input.replaceAll("\\", "/");
		const at = normalized.lastIndexOf("node_modules/");
		if (at === -1) continue;
		const name = packageName(normalized.slice(at + "node_modules/".length));
		pending.push(
			path.resolve(packageDir, normalized.slice(0, at), "node_modules", name),
		);
	}
	for (let dir = pending.pop(); dir !== undefined; dir = pending.pop()) {
		if (packageDirs.has(dir)) continue;
		packageDirs.add(dir);
		for (const name of Object.keys(
			readManifest(path.join(dir, "package.json")).dependencies ?? {},
		)) {
			const installed = installedManifestPath(name, dir);
			if (installed) pending.push(path.dirname(installed));
		}
	}

	const entries = [...packageDirs]
		.map((dir) => {
			const dependency = readManifest(path.join(dir, "package.json"));
			const licenseFile = readdirSync(dir).find((file) =>
				LICENSE_FILE.test(file),
			);
			const text = licenseFile
				? readFileSync(path.join(dir, licenseFile), "utf8").trim()
				: `(No licence file in the package. Declared licence: ${dependency.license ?? "none"}.)`;
			return {
				key: `${dependency.name}@${dependency.version}`,
				text: `${dependency.name}@${dependency.version} (${dependency.license ?? "unknown licence"})\n\n${text}`,
			};
		})
		.sort((a, b) => a.key.localeCompare(b.key));

	return [
		`Third-party software inlined into ${manifest.name} standalone/index.js (${entries.length} packages)`,
		...entries.map((entry) => entry.text),
	]
		.join(`\n\n${"-".repeat(78)}\n\n`)
		.concat("\n");
}

async function buildStandalone(): Promise<void> {
	const outdir = path.join(packageDir, "standalone");
	const result = await build({
		...common,
		outfile: path.join(outdir, "index.js"),
		metafile: true,
	});
	mkdirSync(outdir, { recursive: true });
	writeFileSync(
		path.join(outdir, "THIRD_PARTY_LICENSES.txt"),
		thirdPartyLicenses(result.metafile),
	);
}

const problems = checkDeclaredRanges();
if (problems.length > 0) {
	console.error(
		`Dependency declarations of ${manifest.name}:\n- ${problems.join("\n- ")}`,
	);
	process.exit(1);
}

for (const dir of ["dist", "standalone"]) {
	rmSync(path.join(packageDir, dir), { recursive: true, force: true });
}

if (process.argv.includes("--watch")) {
	const ctx = await context({ ...npmOptions, logLevel: "info" });
	await ctx.watch();
} else {
	await build(npmOptions);
	await buildStandalone();
	console.log(
		`Bundled ${manifest.name} into dist/ (npm) and standalone/ (MCPB, container)`,
	);
}
