/**
 * Writes sbom.cyclonedx.json for a host package (packages/stdio,
 * packages/http): a CycloneDX SBOM of the package as npm users install it,
 * with its runtime dependencies. The private core is inlined into the bundle,
 * not a dependency. The release ships the SBOM in the npm tarball, attaches it
 * to the GitHub release, and attests it for the container image and the .mcpb,
 * which inline these same packages.
 *
 * `npm sbom -w` gets workspaces wrong (with --omit dev it drops zod), so this
 * runs the CycloneDX generator instead. In a workspace that describes the root
 * and lists the package as a component, so the package is then promoted to be
 * the SBOM's subject.
 *
 * Usage, from the package directory: npm run sbom
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Pinned, and run through npm exec, like the mcpb CLI: a release tool, not a dependency. */
const CYCLONEDX_NPM = "@cyclonedx/cyclonedx-npm@6.0.1";
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

type Component = {
	"bom-ref"?: string;
	type?: string;
	group?: string;
	name: string;
	version?: string;
};
type Bom = {
	metadata: { component: Component };
	components?: Component[];
	dependencies?: { ref: string; dependsOn?: string[] }[];
};

const packageDir = process.cwd();
const pkg = JSON.parse(
	readFileSync(path.join(packageDir, "package.json"), "utf8"),
) as { name: string; version: string };
const npmCli = process.env.npm_execpath;
if (!npmCli) {
	console.error("Run this through npm: npm run sbom -w packages/<host>");
	process.exit(1);
}

const output = path.join(packageDir, "sbom.cyclonedx.json");
execFileSync(
	process.execPath,
	[
		npmCli,
		"exec",
		"--yes",
		`--package=${CYCLONEDX_NPM}`,
		"--",
		"cyclonedx-npm",
		"--workspace",
		`packages/${path.basename(packageDir)}`,
		"--omit",
		"dev",
		"--flatten-components",
		// No --output-reproducible: it drops serialNumber, without which
		// actions/attest refuses the SBOM ("Unsupported SBOM format").
		"--output-format",
		"JSON",
		"--output-file",
		output,
	],
	{ cwd: REPO_ROOT, stdio: "inherit" },
);

const bom = JSON.parse(readFileSync(output, "utf8")) as Bom;
const fullName = (component: Component) =>
	component.group ? `${component.group}/${component.name}` : component.name;
const subject = bom.components?.find(
	(component) => fullName(component) === pkg.name,
);
if (!subject) {
	throw new Error(`${pkg.name} isn't a component of the generated SBOM.`);
}

const workspaceRef = bom.metadata.component["bom-ref"];
bom.metadata.component = { ...subject, type: "application" };
bom.components = bom.components?.filter((component) => component !== subject);
bom.dependencies = bom.dependencies?.filter(
	(entry) => entry.ref !== workspaceRef,
);
writeFileSync(output, `${JSON.stringify(bom, null, 2)}\n`);

console.log(
	`Wrote ${path.relative(REPO_ROOT, output)}: ${pkg.name}@${pkg.version} with ${bom.components?.length ?? 0} components`,
);
