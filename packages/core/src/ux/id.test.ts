import { describe, expect, it } from "vitest";

import { generateId, withStableIds } from "./id.js";

describe("generateId", () => {
	it("adds eight random hex digits to the prefix", () => {
		const id = generateId("input");

		expect(id).toMatch(/^input-[0-9a-f]{8}$/);
		expect(generateId("input")).not.toBe(id);
	});

	it("counts up per prefix inside withStableIds, across awaits", async () => {
		const ids = await withStableIds(async () => {
			const first = generateId("input");
			await Promise.resolve();
			return [first, generateId("hint"), generateId("input")];
		});

		expect(ids).toEqual(["input-1", "hint-1", "input-2"]);
	});

	it("starts over in each run, and leaves calls outside it random while it waits", async () => {
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const run = withStableIds(async () => {
			await gate;
			return generateId("input");
		});
		const outside = generateId("input");
		release();

		expect(await run).toBe("input-1");
		expect(withStableIds(() => generateId("input"))).toBe("input-1");
		expect(outside).toMatch(/^input-[0-9a-f]{8}$/);
	});
});
