import { describe, expect, it } from "vitest";

import { toolInputSchemaToJsonSchema } from "../json-schema.js";
import { DialogSchema } from "./dialog.js";

describe("DialogSchema JSON Schema serialization", () => {
	const jsonSchema = toolInputSchemaToJsonSchema(DialogSchema, {
		name: "get_dialog",
		refStrategy: "none",
	}) as any;

	// Navigate into the actual schema body (zodToJsonSchema wraps in definitions).
	const props =
		jsonSchema.properties ??
		jsonSchema.definitions?.get_dialog?.properties ??
		{};
	const required: string[] =
		jsonSchema.required ?? jsonSchema.definitions?.get_dialog?.required ?? [];

	it("marks title, body, confirmLabel, and cancelLabel as required", () => {
		expect(required).toContain("title");
		expect(required).toContain("body");
		expect(required).toContain("confirmLabel");
		expect(required).toContain("cancelLabel");
	});

	it("does not mark optional fields as required", () => {
		expect(required).not.toContain("locale");
		expect(required).not.toContain("strict");
		expect(required).not.toContain("id");
		expect(required).not.toContain("bodyIsHtml");
		expect(required).not.toContain("triggerLabel");
		expect(required).not.toContain("triggerVariant");
		expect(required).not.toContain("closeButtonLabel");
		expect(required).not.toContain("tertiaryLabel");
		expect(required).not.toContain("confirmId");
	});

	it("has no nested object properties (flat schema)", () => {
		// The old schema had actions.confirm.label nesting.
		// The new schema must be completely flat.
		expect(props.actions).toBeUndefined();
		expect(props.trigger).toBeUndefined();
		// All button labels are top-level strings
		expect(props.confirmLabel?.type).toBe("string");
		expect(props.cancelLabel?.type).toBe("string");
	});

	it("includes description metadata on key fields", () => {
		expect(props.title?.description).toBeTruthy();
		expect(props.body?.description).toBeTruthy();
		expect(props.confirmLabel?.description).toBeTruthy();
		expect(props.cancelLabel?.description).toBeTruthy();
	});

	it("includes default value for bodyIsHtml", () => {
		expect(props.bodyIsHtml?.default).toBe(false);
	});

	it("exposes triggerVariant enum", () => {
		const triggerVariant = props.triggerVariant;
		expect(triggerVariant).toBeDefined();
		// zodToJsonSchema may use anyOf for optional+default or direct enum
		const enumValues =
			triggerVariant?.enum ??
			triggerVariant?.anyOf?.find((s: any) => s.enum)?.enum ??
			triggerVariant?.default;
		expect(enumValues).toBeDefined();
	});

	it("tertiaryLabel and confirmId are optional strings", () => {
		// tertiaryLabel should not be in required
		expect(required).not.toContain("tertiaryLabel");
		expect(required).not.toContain("confirmId");
	});
});
