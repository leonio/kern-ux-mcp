/**
 * The HTTP host's configuration, read from environment variables. Invalid or
 * unsafe settings throw a ConfigError, so the server refuses to start rather
 * than run with a setting it can't honour.
 */
export type HttpConfig = {
	host: string;
	port: number;
	/** Hostnames accepted in the Host header, port-agnostic (DNS rebinding protection). */
	allowedHosts: string[];
	/** Hostnames accepted in the Origin header when a browser sends one. */
	allowedOrigins: string[];
	/** When set, /mcp requires `Authorization: Bearer <token>`. */
	authToken?: string;
	/** When set, the maximum /mcp requests per minute from one client address. */
	rateLimitPerMinute?: number;
	/** Origins (scheme://host[:port]) that get CORS headers. */
	corsOrigins: string[];
};

export class ConfigError extends Error {
	override name = "ConfigError";
}

const LOOPBACK_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

function list(value: string | undefined): string[] | undefined {
	const items = value
		?.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
	return items && items.length > 0 ? items : undefined;
}

/** "Example.com:3000" → "example.com", "[::1]:3000" → "[::1]". The SDK guards compare hostnames only. */
function hostname(entry: string): string {
	const lower = entry.toLowerCase();
	if (lower.startsWith("[")) {
		return lower.slice(0, lower.indexOf("]") + 1);
	}
	const parts = lower.split(":");
	return parts.length === 2 ? (parts[0] ?? lower) : lower;
}

function isLoopback(host: string): boolean {
	return (
		host === "localhost" ||
		host === "::1" ||
		host === "[::1]" ||
		/^127\.\d+\.\d+\.\d+$/.test(host)
	);
}

function parsePort(value: string | undefined): number {
	if (value === undefined || value.trim() === "") return 3000;
	const port = Number(value);
	if (!Number.isInteger(port) || port < 0 || port > 65535) {
		throw new ConfigError(
			`PORT must be an integer from 0 to 65535, got "${value}".`,
		);
	}
	return port;
}

function parseRateLimit(value: string | undefined): number | undefined {
	if (value === undefined || value.trim() === "") return undefined;
	const limit = Number(value);
	if (!Number.isInteger(limit) || limit < 1) {
		throw new ConfigError(
			`KERN_RATE_LIMIT must be a positive integer (requests per minute per client), got "${value}".`,
		);
	}
	return limit;
}

function parseCorsOrigin(entry: string): string {
	let url: URL;
	try {
		url = new URL(entry);
	} catch {
		throw new ConfigError(
			`KERN_CORS_ORIGINS entries must be origins like https://app.example.com, got "${entry}".`,
		);
	}
	if (
		(url.protocol !== "https:" && url.protocol !== "http:") ||
		url.pathname !== "/" ||
		url.search ||
		url.hash
	) {
		throw new ConfigError(
			`KERN_CORS_ORIGINS entries must be origins like https://app.example.com, got "${entry}".`,
		);
	}
	return url.origin;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): HttpConfig {
	const host = env.HOST?.trim() || "127.0.0.1";
	const loopback = isLoopback(host.toLowerCase());
	const configuredHosts = list(env.KERN_ALLOWED_HOSTS);
	if (!configuredHosts && !loopback) {
		throw new ConfigError(
			`KERN_ALLOWED_HOSTS is required when HOST (${host}) is not a loopback address: list the hostnames clients use to reach the server, e.g. KERN_ALLOWED_HOSTS=mcp.example.com.`,
		);
	}

	const corsOrigins = (list(env.KERN_CORS_ORIGINS) ?? []).map(parseCorsOrigin);
	// Browsers that may call the server must also pass the Origin check.
	const corsHostnames = corsOrigins.map((origin) =>
		hostname(new URL(origin).host),
	);
	const configuredOrigins = list(env.KERN_ALLOWED_ORIGINS)?.map(hostname);
	const allowedOrigins = [
		...new Set([
			...(configuredOrigins ?? (loopback ? LOOPBACK_HOSTNAMES : [])),
			...corsHostnames,
		]),
	];

	const authToken = env.KERN_AUTH_TOKEN?.trim() || undefined;
	const rateLimitPerMinute = parseRateLimit(env.KERN_RATE_LIMIT);

	return {
		host,
		port: parsePort(env.PORT),
		allowedHosts: configuredHosts?.map(hostname) ?? LOOPBACK_HOSTNAMES,
		allowedOrigins,
		...(authToken ? { authToken } : {}),
		...(rateLimitPerMinute ? { rateLimitPerMinute } : {}),
		corsOrigins,
	};
}
