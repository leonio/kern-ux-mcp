import { describe, expect, it } from "vitest";

import { normalizeToolArgs } from "./server.js";

describe("normalizeToolArgs", () => {
	it("maps legacy dialog actions payload to flat fields", () => {
		const normalized = normalizeToolArgs("get_dialog", {
			title: "Confirm",
			body: "Proceed?",
			actions: {
				confirm: { label: "Yes", id: "yes-id" },
				cancel: { label: "No" },
				tertiary: { label: "Later" },
			},
			trigger: { label: "Open", variant: "secondary" },
		}) as any;

		expect(normalized.confirmLabel).toBe("Yes");
		expect(normalized.cancelLabel).toBe("No");
		expect(normalized.confirmId).toBe("yes-id");
		expect(normalized.tertiaryLabel).toBe("Later");
		expect(normalized.triggerLabel).toBe("Open");
		expect(normalized.triggerVariant).toBe("secondary");
	});

	it("keeps explicitly provided flat dialog fields", () => {
		const normalized = normalizeToolArgs("get_dialog", {
			title: "Confirm",
			body: "Proceed?",
			confirmLabel: "FlatYes",
			cancelLabel: "FlatNo",
			actions: {
				confirm: { label: "OldYes" },
				cancel: { label: "OldNo" },
			},
		}) as any;

		expect(normalized.confirmLabel).toBe("FlatYes");
		expect(normalized.cancelLabel).toBe("FlatNo");
	});

	it("maps legacy section heading object and paragraph objects", () => {
		const normalized = normalizeToolArgs("get_section", {
			heading: { text: "Overview", level: 3 },
			paragraphs: [{ text: "A" }, { text: "B" }],
			divider: true,
		}) as any;

		expect(normalized.headingText).toBe("Overview");
		expect(normalized.headingLevel).toBe(3);
		expect(normalized.paragraphs).toEqual(["A", "B"]);
		expect(normalized.divider).toBe(true);
	});

	it("maps section heading string and single paragraph alias", () => {
		const normalized = normalizeToolArgs("get_section", {
			heading: "Overview",
			paragraph: "Single line",
		}) as any;

		expect(normalized.headingText).toBe("Overview");
		expect(normalized.paragraphs).toEqual(["Single line"]);
	});

	it("fills sensible defaults for input tools when name/label are missing", () => {
		const textNormalized = normalizeToolArgs("get_inputtext", {}) as any;
		const numberNormalized = normalizeToolArgs("get_inputnumber", {}) as any;
		const fileNormalized = normalizeToolArgs("get_inputfile", {}) as any;

		expect(textNormalized.name).toBe("text_input");
		expect(textNormalized.label).toBe("Textfeld");

		expect(numberNormalized.name).toBe("number_input");
		expect(numberNormalized.label).toBe("Zahl");

		expect(fileNormalized.name).toBe("upload");
		expect(fileNormalized.label).toBe("Datei hochladen");
	});

	it("normalizes tasklist aliases and string items", () => {
		const normalized = normalizeToolArgs("get_tasklist", {
			title: "Antragsschritte",
			items: ["Schritt A", "Schritt B"],
		}) as any;

		expect(normalized.heading).toBe("Antragsschritte");
		expect(normalized.items).toEqual([
			{ title: "Schritt A" },
			{ title: "Schritt B" },
		]);
	});
});
