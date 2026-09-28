/**
 * What the hosts (stdio, HTTP) use from core. Core is private: esbuild inlines
 * it into each published package, so this is a build-time API only.
 */
export { type Catalog, getCatalog } from "./mcp/catalog.js";
export {
	createKernServer,
	type KernServerOptions,
} from "./mcp/create-server.js";
