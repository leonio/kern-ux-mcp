import { describe, expect, it } from "vitest";
import { buildLoader } from "./loader.js";

describe("buildLoader", () => {
	it("builds a visible loader (DE)", () => {
		const result = buildLoader({}, "de");

		expect(result.html).toContain('class="kern-loader kern-loader--visible"');
		expect(result.html).toContain('role="status"');
		expect(result.html).toContain('class="kern-sr-only"');
		expect(result.html).toContain("Wird geladen...");
		expect(result.warnings).toHaveLength(0);
	});

	it("builds a visible loader (EN)", () => {
		const result = buildLoader({}, "en");

		expect(result.html).toContain("Loading...");
	});

	it("builds a hidden loader", () => {
		const result = buildLoader({ visible: false }, "de");

		expect(result.html).toContain('class="kern-loader"');
		expect(result.html).not.toContain("kern-loader--visible");
	});

	it("builds a loader with custom sr-text", () => {
		const result = buildLoader({ srText: "Daten werden verarbeitet..." }, "de");

		expect(result.html).toContain("Daten werden verarbeitet...");
		expect(result.html).not.toContain("Wird geladen...");
	});

	it("always includes role=status for accessibility", () => {
		const result = buildLoader({ visible: true }, "en");

		expect(result.html).toContain('role="status"');
	});
});
