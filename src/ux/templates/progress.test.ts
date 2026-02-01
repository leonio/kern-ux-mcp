import { describe, expect, it } from "vitest";
import { buildProgress } from "./progress.js";

describe("buildProgress", () => {
	it("should generate basic progress HTML", () => {
		const result = buildProgress({ value: 50 }, "de");
		expect(result.html).toContain('class="kern-progress"');
		expect(result.html).toContain("<progress");
		expect(result.html).toContain('value="50"');
		expect(result.html).toContain('max="100"'); // default max
		expect(result.warnings).toEqual([]);
	});

	it("should use custom max value", () => {
		const result = buildProgress({ value: 25, max: 50 }, "en");
		expect(result.html).toContain('value="25"');
		expect(result.html).toContain('max="50"');
	});

	it("should include label on top", () => {
		const result = buildProgress(
			{ value: 75, label: "Loading...", labelPosition: "top" },
			"en",
		);
		expect(result.html).toContain('class="kern-label"');
		expect(result.html).toContain("Loading...");
		// Label should appear before progress
		const labelIndex = result.html.indexOf("Loading...");
		const progressIndex = result.html.indexOf("<progress");
		expect(labelIndex).toBeLessThan(progressIndex);
	});

	it("should include label on bottom", () => {
		const result = buildProgress(
			{ value: 30, label: "Uploading...", labelPosition: "bottom" },
			"de",
		);
		expect(result.html).toContain('class="kern-label"');
		expect(result.html).toContain("Uploading...");
		// Progress should appear before label
		const progressIndex = result.html.indexOf("<progress");
		const labelIndex = result.html.indexOf("Uploading...");
		expect(progressIndex).toBeLessThan(labelIndex);
	});

	it("should link label to progress via for/id", () => {
		const result = buildProgress({ value: 50, label: "Progress" }, "en");
		// Check that label has for attribute pointing to progress id
		expect(result.html).toMatch(/for="progress-[a-f0-9]+"/);
		expect(result.html).toMatch(/id="progress-[a-f0-9]+"/);
	});

	it("should not include id when no label", () => {
		const result = buildProgress({ value: 100 }, "de");
		// Progress without label shouldn't have id (no association needed)
		expect(result.html).not.toMatch(/id="progress-/);
	});
});
