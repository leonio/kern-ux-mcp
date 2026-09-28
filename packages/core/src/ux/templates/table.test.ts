import { describe, expect, it } from "vitest";
import { buildTable } from "./table.js";

describe("buildTable", () => {
	it("should generate basic table HTML", () => {
		const result = buildTable(
			{
				headers: [{ text: "Name" }, { text: "Age" }],
				rows: [
					{ cells: [{ content: "Alice" }, { content: "30" }] },
					{ cells: [{ content: "Bob" }, { content: "25" }] },
				],
			},
			"de",
		);
		expect(result.html).toContain('class="kern-table"');
		expect(result.html).toContain("<thead");
		expect(result.html).toContain("<tbody");
		expect(result.html).toContain('class="kern-table__header"');
		expect(result.html).toContain('class="kern-table__cell"');
		expect(result.html).toContain("Name");
		expect(result.html).toContain("Alice");
		expect(result.warnings).toEqual([]);
	});

	it("should include caption for accessibility", () => {
		const result = buildTable(
			{
				caption: "User Data",
				headers: [{ text: "Name" }],
				rows: [{ cells: [{ content: "Alice" }] }],
			},
			"en",
		);
		expect(result.html).toContain(
			'<caption class="kern-title" id="kern-table-caption">User Data</caption>',
		);
	});

	it("should apply small size modifier", () => {
		const result = buildTable(
			{
				headers: [{ text: "Col" }],
				rows: [{ cells: [{ content: "Val" }] }],
				size: "small",
			},
			"de",
		);
		expect(result.html).toContain("kern-table--small");
	});

	it("should apply striped modifier", () => {
		const result = buildTable(
			{
				headers: [{ text: "Col" }],
				rows: [{ cells: [{ content: "Val" }] }],
				striped: true,
			},
			"en",
		);
		expect(result.html).toContain("kern-table--striped");
	});

	it("should wrap in responsive container", () => {
		const result = buildTable(
			{
				caption: "Col Table",
				headers: [{ text: "Col" }],
				rows: [{ cells: [{ content: "Val" }] }],
				responsive: true,
			},
			"de",
		);
		expect(result.html).toContain('class="kern-table-responsive"');
		expect(result.html).toContain('tabindex="0"');
		expect(result.html).toContain('role="region"');
		expect(result.html).toContain('aria-labelledby="kern-table-caption"');
	});

	it("should omit responsive region labelling when no caption exists", () => {
		const result = buildTable(
			{
				headers: [{ text: "Col" }],
				rows: [{ cells: [{ content: "Val" }] }],
				responsive: true,
			},
			"de",
		);

		expect(result.html).toContain('class="kern-table-responsive"');
		expect(result.html).not.toContain('role="region"');
		expect(result.html).not.toContain("aria-labelledby=");
	});

	it("should apply numeric alignment to headers and cells", () => {
		const result = buildTable(
			{
				headers: [{ text: "Item" }, { text: "Price", numeric: true }],
				rows: [
					{ cells: [{ content: "Apple" }, { content: "1.99", numeric: true }] },
				],
			},
			"en",
		);
		expect(result.html).toContain("kern-table__header--numeric");
		expect(result.html).toContain("kern-table__cell--numeric");
	});

	it("should apply numeric alignment from header when cell numeric is omitted", () => {
		const result = buildTable(
			{
				headers: [{ text: "Name" }, { text: "Amount", numeric: true }],
				rows: [{ cells: [{ content: "Alice" }, { content: "199.95" }] }],
			},
			"de",
		);

		expect(result.html).toContain("kern-table__header--numeric");
		expect(result.html).toContain("kern-table__cell--numeric");
	});

	it("should support row headers with scope=row", () => {
		const result = buildTable(
			{
				headers: [{ text: "" }, { text: "Q1" }, { text: "Q2" }],
				rows: [
					{
						rowHeader: "Revenue",
						cells: [{ content: "100" }, { content: "150" }],
					},
				],
			},
			"de",
		);
		expect(result.html).toContain('scope="row"');
		expect(result.html).toContain("Revenue");
	});

	it("should include table footer", () => {
		const result = buildTable(
			{
				headers: [{ text: "Item" }, { text: "Amount" }],
				rows: [{ cells: [{ content: "A" }, { content: "10" }] }],
				footer: [{ content: "Total" }, { content: "10", numeric: true }],
			},
			"en",
		);
		expect(result.html).toContain("<tfoot");
		expect(result.html).toContain('class="kern-table__footer"');
		expect(result.html).toContain("Total");
	});

	it("should escape HTML in cells by default", () => {
		const result = buildTable(
			{
				headers: [{ text: "Data" }],
				rows: [{ cells: [{ content: "<script>alert('xss')</script>" }] }],
			},
			"de",
		);
		expect(result.html).toContain("&lt;script&gt;");
		expect(result.html).not.toContain("<script>");
	});

	it("should allow raw HTML when isHtml is true", () => {
		const result = buildTable(
			{
				headers: [{ text: "Data" }],
				rows: [{ cells: [{ content: "<strong>Bold</strong>", isHtml: true }] }],
			},
			"en",
		);
		expect(result.html).toContain("<strong>Bold</strong>");
	});
});
