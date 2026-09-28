import { describe, expect, it } from "vitest";

import { RateLimiter } from "./rate-limit.js";

function clock() {
	let nowMs = 0;
	return {
		now: () => nowMs,
		advance: (ms: number) => {
			nowMs += ms;
		},
	};
}

describe("RateLimiter", () => {
	it("allows a burst of the per-minute limit, then asks the client to wait", () => {
		const time = clock();
		const limiter = new RateLimiter(3, time.now);

		expect([limiter.take("a"), limiter.take("a"), limiter.take("a")]).toEqual([
			0, 0, 0,
		]);
		// One token refills every 20 s at 3 per minute.
		expect(limiter.take("a")).toBe(20);
	});

	it("refills continuously", () => {
		const time = clock();
		const limiter = new RateLimiter(60, time.now);
		for (let i = 0; i < 60; i++) limiter.take("a");
		expect(limiter.take("a")).toBe(1);

		time.advance(1_000);
		expect(limiter.take("a")).toBe(0);
		expect(limiter.take("a")).toBe(1);
	});

	it("never refills above the limit", () => {
		const time = clock();
		const limiter = new RateLimiter(2, time.now);
		limiter.take("a");
		time.advance(10 * 60_000);

		expect([limiter.take("a"), limiter.take("a"), limiter.take("a")]).toEqual([
			0, 0, 30,
		]);
	});

	it("tracks clients separately", () => {
		const limiter = new RateLimiter(1, clock().now);
		expect(limiter.take("a")).toBe(0);
		expect(limiter.take("a")).toBeGreaterThan(0);
		expect(limiter.take("b")).toBe(0);
	});

	it("forgets clients whose bucket has refilled once it tracks many", () => {
		const time = clock();
		const limiter = new RateLimiter(1, time.now);
		for (let i = 0; i <= 10_000; i++) limiter.take(`client-${i}`);
		expect(limiter.size).toBe(10_001);

		time.advance(60_000);
		limiter.take("new-client");
		expect(limiter.size).toBe(1);
	});
});
