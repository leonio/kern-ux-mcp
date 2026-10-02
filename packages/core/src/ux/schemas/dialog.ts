import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

/**
 * Zod schema for Dialog component parameters.
 *
 * Flat top-level properties only — no nested objects — so that MCP clients
 * can construct the input reliably.
 */
export const DialogSchema = z.object({
	...McpCommonSchema.shape,
	id: z
		.string()
		.optional()
		.describe(
			"Dialog id, for aria-labelledby and the trigger; generated when omitted.",
		),
	title: z
		.string()
		.min(1)
		.describe("Heading: the question or decision, short and clear."),
	body: z
		.string()
		.min(1)
		.describe("Content, rendered as text. Keep it to what the decision needs."),
	bodyIsHtml: z
		.boolean()
		.optional()
		.default(false)
		.describe("Treat body as trusted HTML instead of escaping it."),
	confirmLabel: z
		.string()
		.min(1)
		.describe(
			"Label of the primary button. Name the action, e.g. 'Löschen', not 'OK'.",
		),
	confirmId: z.string().optional().describe("Id of the primary button."),
	cancelLabel: z
		.string()
		.min(1)
		.describe('Label of the cancel button, which uses formmethod="dialog".'),
	tertiaryLabel: z
		.string()
		.optional()
		.describe("Label of an optional third button for a lesser action."),
	triggerLabel: z
		.string()
		.optional()
		.describe(
			"Adds a button before the dialog that opens it (data-dialog-target).",
		),
	triggerVariant: z
		.enum(["primary", "secondary", "tertiary"])
		.optional()
		.default("primary")
		.describe("Variant of the trigger button."),
	closeButtonLabel: z
		.string()
		.optional()
		.describe(
			"Screen-reader text of the close button; 'Schließen' or 'Close' by default.",
		),
});

/** Type for dialog input (before Zod parsing, allows missing defaulted fields) */
export type DialogInput = z.input<typeof DialogSchema>;

/** Type for dialog params after Zod parsing (all defaults applied) */
export type DialogParams = z.output<typeof DialogSchema>;
