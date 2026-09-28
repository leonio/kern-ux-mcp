import { describe, expect, it } from "vitest";
import { buildAccordion } from "./accordion.js";

describe("buildAccordion", () => {
	describe("single mode", () => {
		it("should generate single accordion HTML", () => {
			const result = buildAccordion(
				{
					mode: "single",
					title: "FAQ Question",
					content: "This is the answer.",
				},
				"de",
			);
			expect(result.html).toContain('class="kern-accordion"');
			expect(result.html).toContain("<details");
			expect(result.html).toContain("<summary");
			expect(result.html).toContain('class="kern-accordion__header"');
			expect(result.html).toContain('class="kern-title"');
			expect(result.html).toContain("FAQ Question");
			expect(result.html).toContain('class="kern-accordion__body"');
			expect(result.html).toContain("This is the answer.");
			expect(result.warnings).toEqual([]);
		});

		it("should add open attribute when open", () => {
			const result = buildAccordion(
				{
					mode: "single",
					title: "Open Accordion",
					content: "Visible content.",
					open: true,
				},
				"en",
			);
			expect(result.html).toContain('<details class="kern-accordion" open>');
		});

		it("should escape HTML in title and content by default", () => {
			const result = buildAccordion(
				{
					mode: "single",
					title: "<script>Title</script>",
					content: "<b>Bold</b>",
				},
				"de",
			);
			expect(result.html).toContain("&lt;script&gt;Title&lt;/script&gt;");
			expect(result.html).toContain("&lt;b&gt;Bold&lt;/b&gt;");
		});

		it("should allow raw HTML content when contentIsHtml is true", () => {
			const result = buildAccordion(
				{
					mode: "single",
					title: "Rich Content",
					content: "<strong>Important</strong>",
					contentIsHtml: true,
				},
				"en",
			);
			expect(result.html).toContain("<strong>Important</strong>");
		});
	});

	describe("group mode", () => {
		it("should generate accordion group HTML", () => {
			const result = buildAccordion(
				{
					mode: "group",
					items: [
						{ title: "Section 1", content: "Content 1" },
						{ title: "Section 2", content: "Content 2" },
					],
				},
				"de",
			);
			expect(result.html).toContain('class="kern-accordion-group"');
			expect(result.html).toContain("Section 1");
			expect(result.html).toContain("Content 1");
			expect(result.html).toContain("Section 2");
			expect(result.html).toContain("Content 2");
			// Should have two accordions
			const matches = result.html.match(/class="kern-accordion"/g);
			expect(matches?.length).toBe(2);
		});

		it("should support individual item open state", () => {
			const result = buildAccordion(
				{
					mode: "group",
					items: [
						{ title: "Closed", content: "Hidden" },
						{ title: "Open", content: "Visible", open: true },
					],
				},
				"en",
			);
			// Second accordion should have open attribute
			expect(result.html).toContain('<details class="kern-accordion" open>');
		});

		it("should support individual item contentIsHtml", () => {
			const result = buildAccordion(
				{
					mode: "group",
					items: [
						{ title: "Plain", content: "<b>escaped</b>" },
						{ title: "Rich", content: "<b>bold</b>", contentIsHtml: true },
					],
				},
				"de",
			);
			expect(result.html).toContain("&lt;b&gt;escaped&lt;/b&gt;");
			expect(result.html).toContain("<b>bold</b>");
		});
	});
});
