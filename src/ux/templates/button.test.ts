import { describe, expect, it } from "vitest";
import { buildButton } from "./button.js";

describe("buildButton", () => {
	it("builds a primary button with label", () => {
		const result = buildButton(
			{ variant: "primary", label: "Speichern" },
			"de",
		);

		expect(result.html).toContain('class="kern-btn kern-btn--primary"');
		expect(result.html).toContain('<span class="kern-label">Speichern</span>');
		expect(result.warnings).toHaveLength(0);
	});

	it("builds a secondary x-small button", () => {
		const result = buildButton(
			{ variant: "secondary", label: "Cancel", size: "x-small" },
			"en",
		);

		expect(result.html).toContain("kern-btn--secondary");
		expect(result.html).toContain("kern-btn--x-small");
		expect(result.html).toContain("Cancel");
	});

	it("keeps legacy small alias compatible", () => {
		const result = buildButton(
			{ variant: "secondary", label: "Cancel", size: "small" },
			"en",
		);

		expect(result.html).toContain("kern-btn--x-small");
		expect(result.html).not.toContain("kern-btn--small");
	});

	it("builds a tertiary button with block modifier", () => {
		const result = buildButton(
			{ variant: "tertiary", label: "Action", block: true },
			"de",
		);

		expect(result.html).toContain("kern-btn--tertiary");
		expect(result.html).toContain("kern-btn--block");
	});

	it("builds a disabled button", () => {
		const result = buildButton(
			{ variant: "primary", label: "Disabled", disabled: true },
			"de",
		);

		expect(result.html).toContain("disabled");
	});

	it("builds a button with icon on left", () => {
		const result = buildButton(
			{
				variant: "primary",
				label: "Edit",
				icon: { name: "edit", position: "left" },
			},
			"en",
		);

		expect(result.html).toContain('class="kern-icon kern-icon--edit"');
		expect(result.html).toContain('aria-hidden="true"');
		// Icon should appear before label
		const iconIndex = result.html.indexOf("kern-icon--edit");
		const labelIndex = result.html.indexOf("kern-label");
		expect(iconIndex).toBeLessThan(labelIndex);
	});

	it("builds a button with icon on right", () => {
		const result = buildButton(
			{
				variant: "primary",
				label: "Next",
				icon: { name: "arrow-forward", position: "right" },
			},
			"en",
		);

		// Icon should appear after label
		const iconIndex = result.html.indexOf("kern-icon--arrow-forward");
		const labelIndex = result.html.indexOf("kern-label");
		expect(iconIndex).toBeGreaterThan(labelIndex);
	});

	it("builds an icon-only button with sr-only label", () => {
		const result = buildButton(
			{
				variant: "primary",
				label: "Close",
				icon: { name: "close" },
				labelVisibility: "sr-only",
			},
			"en",
		);

		expect(result.html).toContain('class="kern-sr-only"');
		expect(result.html).toContain("Close");
	});

	it("builds a button with sr-only-mobile label", () => {
		const result = buildButton(
			{
				variant: "primary",
				label: "Menu",
				icon: { name: "more-vert" },
				labelVisibility: "sr-only-mobile",
			},
			"de",
		);

		expect(result.html).toContain('class="kern-sr-only-mobile"');
	});

	it("escapes HTML in label", () => {
		const result = buildButton(
			{ variant: "primary", label: "<script>alert('xss')</script>" },
			"de",
		);

		expect(result.html).not.toContain("<script>");
		expect(result.html).toContain("&lt;script&gt;");
	});
});
