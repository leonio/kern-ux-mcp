import { describe, expect, it } from "vitest";
import { buildBadge } from "./badge.js";

describe("buildBadge", () => {
	it("builds an info badge", () => {
		const result = buildBadge({ type: "info", text: "Information" }, "de");

		expect(result.html).toContain('class="kern-badge kern-badge--info"');
		expect(result.html).toContain('class="kern-label kern-label--small"');
		expect(result.html).toContain("Information");
		expect(result.warnings).toHaveLength(0);
	});

	it("builds a success badge", () => {
		const result = buildBadge({ type: "success", text: "Completed" }, "en");

		expect(result.html).toContain("kern-badge--success");
		expect(result.html).toContain("Completed");
	});

	it("builds a warning badge", () => {
		const result = buildBadge({ type: "warning", text: "Pending" }, "en");

		expect(result.html).toContain("kern-badge--warning");
	});

	it("builds a danger badge", () => {
		const result = buildBadge({ type: "danger", text: "Error" }, "en");

		expect(result.html).toContain("kern-badge--danger");
	});

	it("builds a badge without icon by default", () => {
		const result = buildBadge({ type: "info", text: "No Icon" }, "de");

		expect(result.html).not.toContain("kern-icon");
	});

	it("builds a badge with icon when showIcon is true", () => {
		const result = buildBadge(
			{ type: "success", text: "With Icon", showIcon: true },
			"de",
		);

		expect(result.html).toContain('class="kern-icon kern-icon--success"');
		expect(result.html).toContain('aria-hidden="true"');
	});

	it("builds a badge with info icon", () => {
		const result = buildBadge(
			{ type: "info", text: "Info", showIcon: true },
			"en",
		);

		expect(result.html).toContain("kern-icon--info");
	});

	it("builds a badge with warning icon", () => {
		const result = buildBadge(
			{ type: "warning", text: "Warning", showIcon: true },
			"en",
		);

		expect(result.html).toContain("kern-icon--warning");
	});

	it("builds a badge with danger icon", () => {
		const result = buildBadge(
			{ type: "danger", text: "Danger", showIcon: true },
			"en",
		);

		expect(result.html).toContain("kern-icon--danger");
	});
});
