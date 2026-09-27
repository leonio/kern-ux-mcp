import { describe, expect, it } from "vitest";

import { normalizeToolArgs } from "./invoke.js";

function normalize(name: string, args: unknown): Record<string, unknown> {
	return normalizeToolArgs(name, args) as Record<string, unknown>;
}

describe("normalizeToolArgs", () => {
	it("maps legacy dialog actions payload to flat fields", () => {
		const normalized = normalize("get_dialog", {
			title: "Confirm",
			body: "Proceed?",
			actions: {
				confirm: { label: "Yes", id: "yes-id" },
				cancel: { label: "No" },
				tertiary: { label: "Later" },
			},
			trigger: { label: "Open", variant: "secondary" },
		});

		expect(normalized.confirmLabel).toBe("Yes");
		expect(normalized.cancelLabel).toBe("No");
		expect(normalized.confirmId).toBe("yes-id");
		expect(normalized.tertiaryLabel).toBe("Later");
		expect(normalized.triggerLabel).toBe("Open");
		expect(normalized.triggerVariant).toBe("secondary");
	});

	it("keeps explicitly provided flat dialog fields", () => {
		const normalized = normalize("get_dialog", {
			title: "Confirm",
			body: "Proceed?",
			confirmLabel: "FlatYes",
			cancelLabel: "FlatNo",
			actions: {
				confirm: { label: "OldYes" },
				cancel: { label: "OldNo" },
			},
		});

		expect(normalized.confirmLabel).toBe("FlatYes");
		expect(normalized.cancelLabel).toBe("FlatNo");
	});

	it("maps legacy section heading object and paragraph objects", () => {
		const normalized = normalize("get_section", {
			heading: { text: "Overview", level: 3 },
			paragraphs: [{ text: "A" }, { text: "B" }],
			divider: true,
		});

		expect(normalized.headingText).toBe("Overview");
		expect(normalized.headingLevel).toBe(3);
		expect(normalized.paragraphs).toEqual(["A", "B"]);
		expect(normalized.divider).toBe(true);
	});

	it("maps section heading string and single paragraph alias", () => {
		const normalized = normalize("get_section", {
			heading: "Overview",
			paragraph: "Single line",
		});

		expect(normalized.headingText).toBe("Overview");
		expect(normalized.paragraphs).toEqual(["Single line"]);
	});

	it("fills sensible defaults for input tools when name/label are missing", () => {
		const textNormalized = normalize("get_inputtext", {});
		const numberNormalized = normalize("get_inputnumber", {});
		const fileNormalized = normalize("get_inputfile", {});

		expect(textNormalized.name).toBe("text_input");
		expect(textNormalized.label).toBe("Textfeld");

		expect(numberNormalized.name).toBe("number_input");
		expect(numberNormalized.label).toBe("Zahl");

		expect(fileNormalized.name).toBe("upload");
		expect(fileNormalized.label).toBe("Datei hochladen");
	});

	it("normalizes tasklist aliases and string items", () => {
		const normalized = normalize("get_tasklist", {
			title: "Antragsschritte",
			items: ["Schritt A", "Schritt B"],
		});

		expect(normalized.heading).toBe("Antragsschritte");
		expect(normalized.items).toEqual([
			{ title: "Schritt A" },
			{ title: "Schritt B" },
		]);
	});
});
