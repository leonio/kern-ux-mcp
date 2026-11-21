import { type ExecFileSyncOptions, execFileSync } from "node:child_process";

/**
 * Runs pnpm with these arguments. On Windows pnpm is a .cmd shim, which only
 * cmd.exe starts; the arguments here are package specs, flags and paths
 * without spaces, which cmd.exe passes on as they are.
 */
export function pnpm(
	args: readonly string[],
	options: ExecFileSyncOptions,
): void {
	if (process.platform === "win32") {
		execFileSync(
			process.env.ComSpec ?? "cmd.exe",
			["/d", "/s", "/c", "pnpm", ...args],
			options,
		);
	} else {
		execFileSync("pnpm", args, options);
	}
}
