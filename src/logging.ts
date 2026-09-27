const DEBUG_MAX_CHARS = 4000;

export function isDebugEnabled(): boolean {
	const value = process.env.KERN_DEBUG?.trim().toLowerCase();
	return value === "1" || value === "true" || value === "yes";
}

function toDebugString(value: unknown): string {
	try {
		const text = JSON.stringify(value, null, 2);
		if (text.length <= DEBUG_MAX_CHARS) {
			return text;
		}

		return `${text.slice(0, DEBUG_MAX_CHARS)}\n...<truncated>`;
	} catch {
		return String(value);
	}
}

/** Writes `[kern-ux:mcp] <event>` (plus a truncated JSON payload) to stderr when KERN_DEBUG is set. */
export function debugLog(event: string, payload?: unknown): void {
	if (!isDebugEnabled()) {
		return;
	}

	const header = `[kern-ux:mcp] ${event}`;
	if (payload === undefined) {
		process.stderr.write(`${header}\n`);
		return;
	}

	process.stderr.write(`${header}\n${toDebugString(payload)}\n`);
}
