import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

/** Per-prefix counters while withStableIds runs. */
const stableIds = new AsyncLocalStorage<Map<string, number>>();

/**
 * Generate a unique ID with a given prefix.
 * Format: `{prefix}-{8-char-hex}` (e.g., "btn-a1b2c3d4"); inside withStableIds,
 * `{prefix}-{n}`, counting from 1 per prefix.
 */
export function generateId(prefix: string): string {
	const counters = stableIds.getStore();
	if (counters) {
		const next = (counters.get(prefix) ?? 0) + 1;
		counters.set(prefix, next);
		return `${prefix}-${next}`;
	}
	const uuid = randomUUID().replace(/-/g, "").slice(0, 8);
	return `${prefix}-${uuid}`;
}

/**
 * Runs `render` with IDs that count up per prefix (input-1, input-2), so the
 * same input renders the same markup: for content built once and cached, such
 * as the component cards. Calls outside it keep their random IDs, even while
 * it runs.
 */
export function withStableIds<T>(render: () => T): T {
	return stableIds.run(new Map(), render);
}
