import { describe, expect, it } from "vitest";
import { buildSummary } from "./summary.js";

describe("buildSummary", () => {
	describe("single mode", () => {
		it("should generate basic summary HTML", () => {
			const result = buildSummary(
				{
					mode: "single",
					title: "Personal Information",
					items: [
						{ key: "Name", value: "Max Mustermann" },
						{ key: "Email", value: "max@example.com" },
					],
				},
				"de",
			);
			expect(result.html).toContain('class="kern-summary"');
			expect(result.html).toContain('class="kern-summary__header"');
			expect(result.html).toContain('class="kern-summary__body"');
			expect(result.html).toContain('class="kern-description-list"');
			expect(result.html).toContain("Personal Information");
			expect(result.html).toContain("Name");
			expect(result.html).toContain("Max Mustermann");
			expect(result.warnings).toEqual([]);
		});

		it("should include step number", () => {
			const result = buildSummary(
				{
					mode: "single",
					number: 1,
					title: "Step One",
					items: [{ key: "Status", value: "Complete" }],
				},
				"en",
			);
			expect(result.html).toContain('class="kern-number"');
			expect(result.html).toContain(">1</span>");
		});

		it("should use custom heading level", () => {
			const result = buildSummary(
				{
					mode: "single",
					title: "Details",
					headingLevel: "4",
					items: [{ key: "Key", value: "Value" }],
				},
				"de",
			);
			expect(result.html).toContain("<h4");
			expect(result.html).toContain("</h4>");
		});

		it("should include edit action with aria-describedby", () => {
			const result = buildSummary(
				{
					mode: "single",
					title: "Editable",
					items: [{ key: "Field", value: "Data" }],
					action: { href: "/edit" },
				},
				"de",
			);
			expect(result.html).toContain('class="kern-summary__actions"');
			expect(result.html).toContain('href="/edit"');
			expect(result.html).toContain("aria-describedby");
			expect(result.html).toContain("Bearbeiten");
			expect(result.html).toContain('class="kern-icon kern-icon--edit"');
		});

		it("should use English edit label", () => {
			const result = buildSummary(
				{
					mode: "single",
					title: "Editable",
					items: [{ key: "Field", value: "Data" }],
					action: { href: "/edit" },
				},
				"en",
			);
			expect(result.html).toContain("Edit");
		});

		it("should allow raw HTML in value", () => {
			const result = buildSummary(
				{
					mode: "single",
					title: "Rich",
					items: [
						{ key: "HTML", value: "<strong>Bold</strong>", valueIsHtml: true },
					],
				},
				"de",
			);
			expect(result.html).toContain("<strong>Bold</strong>");
		});
	});

	describe("group mode", () => {
		it("should generate summary group HTML", () => {
			const result = buildSummary(
				{
					mode: "group",
					groupTitle: "All Steps",
					summaries: [
						{ title: "Step 1", items: [{ key: "A", value: "1" }] },
						{ title: "Step 2", items: [{ key: "B", value: "2" }] },
					],
				},
				"de",
			);
			expect(result.html).toContain('class="kern-summary-group"');
			expect(result.html).toContain('class="kern-summary-group__header"');
			expect(result.html).toContain("All Steps");
			expect(result.html).toContain("Step 1");
			expect(result.html).toContain("Step 2");
		});

		it("should use custom group heading level", () => {
			const result = buildSummary(
				{
					mode: "group",
					groupTitle: "Group",
					groupHeadingLevel: "3",
					summaries: [{ title: "Item", items: [{ key: "K", value: "V" }] }],
				},
				"en",
			);
			expect(result.html).toContain("<h3");
			expect(result.html).toContain("</h3>");
		});
	});
});
