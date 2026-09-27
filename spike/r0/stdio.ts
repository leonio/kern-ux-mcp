// R0 spike (throwaway): stdio entry on SDK v2.
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { tapStdin } from "./client-log.js";
import { createKernServer, getCatalog } from "./create-server.js";

const catalog = await getCatalog();
tapStdin("stdio");
serveStdio(() => createKernServer(catalog), {
	onerror: (err) => process.stderr.write(`[kern-ux:spike] ${err.message}\n`),
});
