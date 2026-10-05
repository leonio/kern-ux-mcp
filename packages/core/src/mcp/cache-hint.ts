import type { CacheHint } from "@modelcontextprotocol/server";

/**
 * Lists and resources only change with a release (a new server version), and
 * are the same for every user, so clients and shared caches may keep them for
 * an hour. Applies to 2026-07-28 responses only.
 */
export const RELEASE_CACHE_HINT: CacheHint = {
	ttlMs: 60 * 60 * 1000,
	cacheScope: "public",
};
