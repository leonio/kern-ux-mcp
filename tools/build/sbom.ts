/**
 * Writes sbom.cyclonedx.json for a host package (packages/stdio,
 * packages/http): a CycloneDX SBOM of the package as users install it, with
 * its runtime dependencies. The private core is inlined into the bundle, a
 * devDependency, so it isn't in it. The release ships the SBOM in the npm
 * tarball, attaches it to the GitHub release, and attests it for the
 * container image and the .mcpb, which inline these same packages.
 *
 * pnpm sbom writes it, with the package as the SBOM's subject; this marks the
 * subject as the application it is. It keeps the serialNumber, without which
 * actions/attest refuses the SBOM ("Unsupported SBOM format").
 *
 * Usage, from the repo root: pnpm sbom:write (both hosts), or from the package
 * directory: pnpm run sbom:write
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pnpm } from "./pnpm.js";

/** The CycloneDX version actions/attest and the SBOM scanners read. */
const SPEC_VERSION = "1.6";
const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

type Bom = {
	metadata: { component: { name: string; type?: string } };
	components?: unknown[];
};

const packageDir = process.cwd();
const pkg = JSON.parse(
	readFileSync(path.join(packageDir, "package.json"), "utf8"),
) as { name: string; version: string };

const output = path.join(packageDir, "sbom.cyclonedx.json");
pnpm(
	[
		"sbom",
		"--sbom-format",
		"cyclonedx",
		"--sbom-spec-version",
		SPEC_VERSION,
		"--prod",
		"--filter",
		pkg.name,
		"--out",
		output,
	],
	{ cwd: REPO_ROOT, stdio: ["ignore", "ignore", "inherit"] },
);

const bom = JSON.parse(readFileSync(output, "utf8")) as Bom;
bom.metadata.component.type = "application";
writeFileSync(output, `${JSON.stringify(bom, null, 2)}\n`);

console.log(
	`Wrote ${path.relative(REPO_ROOT, output)}: ${pkg.name}@${pkg.version} with ${bom.components?.length ?? 0} components`,
);
