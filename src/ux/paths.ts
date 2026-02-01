import { existsSync } from "node:fs";
import path from "node:path";

export function getKernUxPlainRoot() {
	if (process.env.KERN_UX_PLAIN_ROOT) {
		return path.resolve(process.env.KERN_UX_PLAIN_ROOT);
	}

	const candidates = [
		path.resolve(process.cwd(), "..", "kern-ux-plain"),
		path.resolve(process.cwd(), "kern-ux-plain"),
		path.resolve(process.cwd(), "src", "kern-ux-plain"),
	];

	return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}
