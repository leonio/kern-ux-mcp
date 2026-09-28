import { describe, expect, it } from "vitest";
import { buildIcon } from "./icon.js";

describe("buildIcon", () => {
	it("should generate decorative icon with aria-hidden", () => {
		const result = buildIcon({ name: "check", decorative: true }, "de");
		expect(result.html).toContain('class="kern-icon kern-icon--check"');
		expect(result.html).toContain('aria-hidden="true"');
		expect(result.html).not.toContain("aria-label");
		expect(result.warnings).toEqual([]);
	});

	it("should generate meaningful icon with aria-label", () => {
		const result = buildIcon(
			{ name: "close", decorative: false, ariaLabel: "Close dialog" },
			"en",
		);
		expect(result.html).toContain('class="kern-icon kern-icon--close"');
		expect(result.html).toContain('aria-hidden="false"');
		expect(result.html).toContain('aria-label="Close dialog"');
	});

	it("should apply small size modifier", () => {
		const result = buildIcon(
			{ name: "info", decorative: true, size: "small" },
			"de",
		);
		expect(result.html).toContain("kern-icon--small");
	});

	it("should apply large size modifier", () => {
		const result = buildIcon(
			{ name: "warning", decorative: true, size: "large" },
			"en",
		);
		expect(result.html).toContain("kern-icon--large");
	});

	it("should apply x-large size modifier", () => {
		const result = buildIcon(
			{ name: "danger", decorative: true, size: "x-large" },
			"de",
		);
		expect(result.html).toContain("kern-icon--x-large");
	});

	it("should use default size (medium) without modifier", () => {
		const result = buildIcon(
			{ name: "success", decorative: true, size: "default" },
			"en",
		);
		expect(result.html).not.toContain("kern-icon--small");
		expect(result.html).not.toContain("kern-icon--large");
		expect(result.html).not.toContain("kern-icon--x-large");
		expect(result.html).not.toContain("kern-icon--medium");
	});

	it("should escape special characters in aria-label", () => {
		const result = buildIcon(
			{ name: "help", decorative: false, ariaLabel: "Help & Info" },
			"de",
		);
		expect(result.html).toContain('aria-label="Help &amp; Info"');
	});
});
