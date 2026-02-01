import { describe, expect, it } from "vitest";
import { buildDialog } from "./dialog.js";

describe("buildDialog", () => {
	it("builds a basic dialog with required elements", () => {
		const result = buildDialog(
			{
				title: "Confirm Action",
				body: "Are you sure you want to proceed?",
				confirmLabel: "Yes",
				cancelLabel: "No",
			},
			"en",
		);

		expect(result.html).toContain('class="kern-dialog"');
		expect(result.html).toContain('aria-modal="true"');
		expect(result.html).toContain("aria-labelledby");
		expect(result.html).toContain("Confirm Action");
		expect(result.html).toContain("Are you sure you want to proceed?");
		expect(result.html).toContain("Yes");
		expect(result.html).toContain("No");
		expect(result.html).toContain('formmethod="dialog"');
		expect(result.html).toContain("kern-icon--close");
		expect(result.html).toContain("kern-sr-only");
		expect(result.warnings).toHaveLength(0);
	});

	it("includes proper structure sections", () => {
		const result = buildDialog(
			{
				title: "Dialog",
				body: "Content",
				confirmLabel: "OK",
				cancelLabel: "Cancel",
			},
			"en",
		);

		expect(result.html).toContain("kern-dialog__header");
		expect(result.html).toContain("kern-dialog__body");
		expect(result.html).toContain("kern-dialog__footer");
	});

	it("uses German close label by default for de locale", () => {
		const result = buildDialog(
			{
				title: "Dialog",
				body: "Inhalt",
				confirmLabel: "Bestätigen",
				cancelLabel: "Abbrechen",
			},
			"de",
		);

		expect(result.html).toContain("Schließen");
	});

	it("uses English close label for en locale", () => {
		const result = buildDialog(
			{
				title: "Dialog",
				body: "Content",
				confirmLabel: "Confirm",
				cancelLabel: "Cancel",
			},
			"en",
		);

		expect(result.html).toContain("Close");
	});

	it("uses custom close button label when provided", () => {
		const result = buildDialog(
			{
				title: "Dialog",
				body: "Content",
				confirmLabel: "OK",
				cancelLabel: "Cancel",
				closeButtonLabel: "Dismiss",
			},
			"en",
		);

		expect(result.html).toContain("Dismiss");
		expect(result.html).not.toContain(">Close<");
	});

	it("builds a dialog with tertiary action", () => {
		const result = buildDialog(
			{
				title: "Delete Item",
				body: "This action cannot be undone.",
				confirmLabel: "Delete",
				cancelLabel: "Keep",
				tertiaryLabel: "Learn More",
			},
			"en",
		);

		expect(result.html).toContain("Learn More");
		// Should have 4 buttons: close, tertiary, cancel, confirm
		const buttonMatches = result.html.match(/<button/g);
		expect(buttonMatches).toHaveLength(4);
	});

	it("builds a dialog with trigger button", () => {
		const result = buildDialog(
			{
				title: "Modal",
				body: "Modal content",
				confirmLabel: "Save",
				cancelLabel: "Discard",
				triggerLabel: "Open Modal",
				triggerVariant: "primary",
			},
			"en",
		);

		expect(result.html).toContain("data-dialog-target");
		expect(result.html).toContain("Open Modal");
		expect(result.html).toContain("kern-btn--primary");
		// Trigger should appear before dialog
		const triggerIndex = result.html.indexOf("data-dialog-target");
		const dialogIndex = result.html.indexOf("<dialog");
		expect(triggerIndex).toBeLessThan(dialogIndex);
	});

	it("builds a dialog with secondary trigger button", () => {
		const result = buildDialog(
			{
				title: "Info",
				body: "Details",
				confirmLabel: "OK",
				cancelLabel: "Close",
				triggerLabel: "Show Info",
				triggerVariant: "secondary",
			},
			"en",
		);

		// Find the trigger button (before <dialog>)
		const beforeDialog = result.html.split("<dialog")[0];
		expect(beforeDialog).toContain("kern-btn--secondary");
	});

	it("uses custom id when provided", () => {
		const result = buildDialog(
			{
				id: "my-dialog",
				title: "Custom ID",
				body: "Content",
				confirmLabel: "OK",
				cancelLabel: "Cancel",
			},
			"en",
		);

		expect(result.html).toContain('id="my-dialog"');
		expect(result.html).toContain('aria-labelledby="my-dialog-title"');
	});

	it("uses custom confirm button id when provided", () => {
		const result = buildDialog(
			{
				title: "Form",
				body: "Submit form?",
				confirmLabel: "Submit",
				confirmId: "submit-btn",
				cancelLabel: "Cancel",
			},
			"en",
		);

		expect(result.html).toContain('id="submit-btn"');
	});

	it("renders HTML body when bodyIsHtml is true", () => {
		const result = buildDialog(
			{
				title: "Rich Content",
				body: '<ul class="kern-list"><li>Item 1</li><li>Item 2</li></ul>',
				bodyIsHtml: true,
				confirmLabel: "OK",
				cancelLabel: "Cancel",
			},
			"en",
		);

		expect(result.html).toContain('<ul class="kern-list">');
		expect(result.html).toContain("<li>Item 1</li>");
	});

	it("escapes HTML body when bodyIsHtml is false", () => {
		const result = buildDialog(
			{
				title: "Plain",
				body: "<script>alert('xss')</script>",
				bodyIsHtml: false,
				confirmLabel: "OK",
				cancelLabel: "Cancel",
			},
			"en",
		);

		expect(result.html).not.toContain("<script>");
		expect(result.html).toContain("&lt;script&gt;");
	});

	it("links heading to dialog via aria-labelledby", () => {
		const result = buildDialog(
			{
				id: "test-dlg",
				title: "Test",
				body: "Content",
				confirmLabel: "OK",
				cancelLabel: "Cancel",
			},
			"en",
		);

		expect(result.html).toContain('aria-labelledby="test-dlg-title"');
		expect(result.html).toContain('id="test-dlg-title"');
	});
});
