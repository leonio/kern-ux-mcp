import { describe, expect, it } from "vitest";
import { buildAlert } from "./alert.js";

describe("buildAlert", () => {
	it("builds an info alert with title only", () => {
		const result = buildAlert({ type: "info", title: "Hinweis" }, "de");

		expect(result.html).toContain('class="kern-alert kern-alert--info"');
		expect(result.html).toContain('role="alert"');
		expect(result.html).toContain("kern-icon--info");
		expect(result.html).toContain('aria-hidden="true"');
		expect(result.html).toContain("Hinweis");
		expect(result.html).not.toContain("kern-alert__body");
		expect(result.warnings).toHaveLength(0);
	});

	it("builds a success alert", () => {
		const result = buildAlert({ type: "success", title: "Success!" }, "en");

		expect(result.html).toContain("kern-alert--success");
		expect(result.html).toContain("kern-icon--success");
	});

	it("builds a warning alert", () => {
		const result = buildAlert({ type: "warning", title: "Warnung" }, "de");

		expect(result.html).toContain("kern-alert--warning");
		expect(result.html).toContain("kern-icon--warning");
	});

	it("builds a danger alert", () => {
		const result = buildAlert({ type: "danger", title: "Error" }, "en");

		expect(result.html).toContain("kern-alert--danger");
		expect(result.html).toContain("kern-icon--danger");
	});

	it("builds an alert with body text", () => {
		const result = buildAlert(
			{
				type: "info",
				title: "Note",
				body: { text: "This is additional information." },
			},
			"en",
		);

		expect(result.html).toContain("kern-alert__body");
		expect(result.html).toContain('class="kern-body"');
		expect(result.html).toContain("This is additional information.");
	});

	it("builds an alert with links", () => {
		const result = buildAlert(
			{
				type: "info",
				title: "Links",
				body: {
					links: [{ href: "https://example.com", text: "Example Link" }],
				},
			},
			"en",
		);

		expect(result.html).toContain('href="https://example.com"');
		expect(result.html).toContain('class="kern-link"');
		expect(result.html).toContain("Example Link");
		expect(result.html).toContain("kern-icon--arrow-forward");
	});

	it("builds an alert with list items", () => {
		const result = buildAlert(
			{
				type: "warning",
				title: "Issues",
				body: {
					listItems: ["Issue 1", "Issue 2", "Issue 3"],
					listStyle: "bullet",
				},
			},
			"en",
		);

		expect(result.html).toContain("kern-list kern-list--bullet");
		expect(result.html).toContain("<li>Issue 1</li>");
		expect(result.html).toContain("<li>Issue 2</li>");
		expect(result.html).toContain("<li>Issue 3</li>");
	});

	it("builds an alert with all body elements", () => {
		const result = buildAlert(
			{
				type: "danger",
				title: "Error",
				body: {
					text: "Something went wrong.",
					links: [{ href: "/help", text: "Get help" }],
					listItems: ["Error A", "Error B"],
				},
			},
			"en",
		);

		expect(result.html).toContain("Something went wrong.");
		expect(result.html).toContain("Get help");
		expect(result.html).toContain("Error A");
	});

	it("escapes HTML in title and body", () => {
		const result = buildAlert(
			{
				type: "info",
				title: "<script>bad</script>",
				body: { text: "<img src=x onerror=alert(1)>" },
			},
			"de",
		);

		expect(result.html).not.toContain("<script>");
		expect(result.html).not.toContain("<img");
		expect(result.html).toContain("&lt;script&gt;");
	});
});
