/** Buckets beyond this count trigger a sweep of the ones that have refilled completely. */
const SWEEP_THRESHOLD = 10_000;

type Bucket = { tokens: number; updatedMs: number };

/**
 * A token bucket per client key: up to `perMinute` requests at once, refilled
 * continuously at `perMinute` per minute. In memory and per process.
 */
export class RateLimiter {
	readonly #perMinute: number;
	readonly #now: () => number;
	readonly #buckets = new Map<string, Bucket>();

	constructor(perMinute: number, now: () => number = () => performance.now()) {
		this.#perMinute = perMinute;
		this.#now = now;
	}

	/** Takes a token for `key`. Returns 0 if the request may proceed, else the seconds until it may retry. */
	take(key: string): number {
		const now = this.#now();
		const bucket = this.#refill(this.#buckets.get(key), now);
		if (bucket.tokens >= 1) {
			bucket.tokens -= 1;
			this.#buckets.set(key, bucket);
			this.#sweep(now);
			return 0;
		}
		this.#buckets.set(key, bucket);
		const msPerToken = 60_000 / this.#perMinute;
		return Math.max(1, Math.ceil(((1 - bucket.tokens) * msPerToken) / 1000));
	}

	/** Number of clients currently tracked (for tests). */
	get size(): number {
		return this.#buckets.size;
	}

	#refill(bucket: Bucket | undefined, now: number): Bucket {
		if (!bucket) return { tokens: this.#perMinute, updatedMs: now };
		const refilled = ((now - bucket.updatedMs) / 60_000) * this.#perMinute;
		return {
			tokens: Math.min(this.#perMinute, bucket.tokens + refilled),
			updatedMs: now,
		};
	}

	#sweep(now: number): void {
		if (this.#buckets.size <= SWEEP_THRESHOLD) return;
		for (const [key, bucket] of this.#buckets) {
			if (this.#refill(bucket, now).tokens >= this.#perMinute) {
				this.#buckets.delete(key);
			}
		}
	}
}
