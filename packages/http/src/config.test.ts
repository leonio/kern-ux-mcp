import { describe, expect, it } from "vitest";

import { ConfigError, loadConfig } from "./config.js";

describe("loadConfig", () => {
	it("defaults to a loopback bind on port 3000 with localhost validation", () => {
		expect(loadConfig({})).toEqual({
			host: "127.0.0.1",
			port: 3000,
			allowedHosts: ["localhost", "127.0.0.1", "[::1]"],
			allowedOrigins: ["localhost", "127.0.0.1", "[::1]"],
			corsOrigins: [],
		});
	});

	it.each(["localhost", "127.0.0.2", "::1", "[::1]"])(
		"treats HOST=%s as loopback",
		(host) => {
			expect(loadConfig({ HOST: host }).allowedHosts).toEqual([
				"localhost",
				"127.0.0.1",
				"[::1]",
			]);
		},
	);

	it.each(["0.0.0.0", "::", "10.0.0.5"])(
		"requires KERN_ALLOWED_HOSTS when HOST=%s",
		(host) => {
			expect(() => loadConfig({ HOST: host })).toThrow(ConfigError);
			expect(() => loadConfig({ HOST: host })).toThrow(
				/KERN_ALLOWED_HOSTS is required/,
			);
		},
	);

	it("rejects every browser Origin on a public bind unless origins are listed", () => {
		const config = loadConfig({
			HOST: "0.0.0.0",
			KERN_ALLOWED_HOSTS: "mcp.example.com",
		});
		expect(config.allowedHosts).toEqual(["mcp.example.com"]);
		expect(config.allowedOrigins).toEqual([]);
	});

	it("normalises host and origin entries to hostnames, since the guards ignore ports", () => {
		const config = loadConfig({
			HOST: "0.0.0.0",
			KERN_ALLOWED_HOSTS: " Localhost:3000 , mcp.example.com,[::1]:8080,,",
			KERN_ALLOWED_ORIGINS: "app.example.com:443",
		});
		expect(config.allowedHosts).toEqual([
			"localhost",
			"mcp.example.com",
			"[::1]",
		]);
		expect(config.allowedOrigins).toEqual(["app.example.com"]);
	});

	it("adds CORS origins to the allowed origins", () => {
		const config = loadConfig({
			KERN_ALLOWED_ORIGINS: "localhost",
			KERN_CORS_ORIGINS: "https://app.example.com, http://localhost:5173/",
		});
		expect(config.corsOrigins).toEqual([
			"https://app.example.com",
			"http://localhost:5173",
		]);
		expect(config.allowedOrigins).toEqual(["localhost", "app.example.com"]);
	});

	it.each([
		"app.example.com",
		"ftp://app.example.com",
		"https://app.example.com/mcp",
		"*",
	])("rejects the CORS origin %s", (origin) => {
		expect(() => loadConfig({ KERN_CORS_ORIGINS: origin })).toThrow(
			/KERN_CORS_ORIGINS/,
		);
	});

	it("parses PORT, including 0 for an ephemeral port", () => {
		expect(loadConfig({ PORT: "8080" }).port).toBe(8080);
		expect(loadConfig({ PORT: "0" }).port).toBe(0);
		expect(loadConfig({ PORT: " " }).port).toBe(3000);
	});

	it.each(["-1", "65536", "80.5", "http"])("rejects PORT=%s", (port) => {
		expect(() => loadConfig({ PORT: port })).toThrow(/PORT must be an integer/);
	});

	it("reads the optional bearer token and rate limit", () => {
		const config = loadConfig({
			KERN_AUTH_TOKEN: "  s3cret-token  ",
			KERN_RATE_LIMIT: "120",
		});
		expect(config.authToken).toBe("s3cret-token");
		expect(config.rateLimitPerMinute).toBe(120);
	});

	it("ignores empty optional settings", () => {
		const config = loadConfig({
			KERN_AUTH_TOKEN: " ",
			KERN_RATE_LIMIT: "",
			KERN_CORS_ORIGINS: "",
		});
		expect(config).not.toHaveProperty("authToken");
		expect(config).not.toHaveProperty("rateLimitPerMinute");
		expect(config.corsOrigins).toEqual([]);
	});

	it.each(["0", "-5", "1.5", "lots"])("rejects KERN_RATE_LIMIT=%s", (limit) => {
		expect(() => loadConfig({ KERN_RATE_LIMIT: limit })).toThrow(
			/KERN_RATE_LIMIT/,
		);
	});
});
