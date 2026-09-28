import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The repository root, resolved from this file rather than the working
 * directory: npm runs workspace scripts from the package directory.
 */
export const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

export function getKernUxPlainRoot() {
	if (process.env.KERN_UX_PLAIN_ROOT) {
		return path.resolve(process.env.KERN_UX_PLAIN_ROOT);
	}

	const candidates = [
		path.resolve(REPO_ROOT, "..", "kern-ux-plain"),
		path.resolve(REPO_ROOT, "kern-ux-plain"),
	];

	return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}
