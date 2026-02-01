import { randomUUID } from "node:crypto";

/**
 * Generate a unique ID with a given prefix.
 * Format: `{prefix}-{8-char-hex}` (e.g., "btn-a1b2c3d4")
 */
export function generateId(prefix: string): string {
	const uuid = randomUUID().replace(/-/g, "").slice(0, 8);
	return `${prefix}-${uuid}`;
}
