// R0 spike (throwaway): cost of the SDK's lazy wire-schema construction.
const t0 = performance.now();
const s = await import("@modelcontextprotocol/server");
const t1 = performance.now();
s.preloadSchemas();
const t2 = performance.now();
const c = await import("@modelcontextprotocol/client");
const t3 = performance.now();
c.preloadSchemas();
const t4 = performance.now();
console.log({
	serverImportMs: Math.round(t1 - t0),
	serverPreloadMs: Math.round(t2 - t1),
	clientImportMs: Math.round(t3 - t2),
	clientPreloadMs: Math.round(t4 - t3),
});
