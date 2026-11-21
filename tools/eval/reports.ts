/**
 * Where the eval's reports live: 2.1's in docs/plan-v2.1/evals (decision A1.4),
 * 2.0's where they were written. Both run.ts and compare.ts find a label in
 * either; new reports go to the first.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Repo-relative: the folder new reports go to, then 2.0's. */
export const REPORT_DIRS = [
	"docs/plan-v2.1/evals",
	"docs/v2-migration/evals",
] as const;

/** The report of that label in the first folder that has one, or undefined. */
export async function findReport(label: string): Promise<string | undefined> {
	for (const dir of REPORT_DIRS) {
		const file = path.join(REPO_ROOT, dir, `${label}.json`);
		try {
			await fs.access(file);
			return file;
		} catch {
			// Not in this folder.
		}
	}
	return undefined;
}
