import { McpServer } from "@modelcontextprotocol/server";
import pkg from "../../../../package.json" with { type: "json" };
import registry from "./registry.json" with { type: "json" };

const server = new McpServer(
	{ name: "json-import", version: pkg.version },
	{ capabilities: { tools: {} } },
);
const count: number = registry.components.length;
console.log(
	JSON.stringify({
		components: count,
		version: pkg.version,
		server: typeof server,
	}),
);
