import { z } from "zod";
import { IconRefSchema, McpCommonSchema } from "./foundations.js";

/**
 * Common parameters shared across all component schemas
 */
const CommonParams = McpCommonSchema.shape;

/**
 * Schema for a key-value item in the summary description list
 */
export const summaryItemSchema = z
	.object({
		/** Key/term for the description list */
		key: z
			.string()
			.describe("Begriff der Description List innerhalb der Summary."),
		/** Value/description for the description list */
		value: z
			.string()
			.describe("Wert oder Beschreibung zum jeweiligen Begriff."),
		/** Whether value is raw HTML */
		valueIsHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird value als vertrauenswuerdiges HTML interpretiert, z.B. fuer Listen im Detailbereich.",
			),
	})
	.describe("Ein einzelnes Key-Value-Paar der eingebetteten Description List.");

/**
 * Schema for edit action in summary
 */
export const summaryActionSchema = z
	.object({
		/** Link URL for the action */
		href: z
			.string()
			.describe("Link-Ziel fuer die optionale Bearbeiten-Aktion."),
		/** Action label text */
		label: z
			.string()
			.optional()
			.describe(
				"Optionaler sichtbarer Link-Text. Ohne Angabe wird lokalisiert 'Bearbeiten' bzw. 'Edit' verwendet.",
			),
		/** Icon name (default: "edit") */
		icon: IconRefSchema.shape.name
			.optional()
			.default("edit")
			.describe(
				"Icon der Aktion. Standard ist edit, passend zu den KERN-Beispielen.",
			),
	})
	.describe("Optionale Bearbeiten-Aktion der Summary.");

/**
 * Schema for a single summary
 */
export const singleSummarySchema = z
	.object({
		/** Step/task number displayed */
		number: z
			.union([z.string(), z.number()])
			.optional()
			.describe(
				"Optionale sichtbare Nummer vor dem Titel, z.B. fuer Aufgabenfolgen.",
			),
		/** Summary title */
		title: z.string().describe("Titel der einzelnen Summary-Aufgabe."),
		/** Heading level for the title (default: 3) */
		headingLevel: z
			.enum(["2", "3", "4", "5", "6"])
			.optional()
			.default("3")
			.describe(
				"Heading-Level des Titels. Der Renderer verwendet kern-title kern-title--small.",
			),
		/** Key-value items in the description list */
		items: z
			.array(summaryItemSchema)
			.describe("Eintraege der eingebetteten Description List."),
		/** Optional edit action */
		action: summaryActionSchema
			.optional()
			.describe(
				"Optionale Bearbeiten-Aktion. Summary zeigt dabei keinen Status, sondern nur Inhalte und moegliche Bearbeitung.",
			),
	})
	.describe("Parameter fuer eine einzelne Summary-Aufgabe.");

/**
 * Schema for single summary mode
 */
export const summarySingleSchema = z
	.object({
		...CommonParams,
		mode: z.literal("single"),
		/** Single summary configuration */
		...singleSummarySchema.shape,
	})
	.describe("Parameter fuer eine einzelne KERN Summary.");

/**
 * Schema for summary group mode
 */
export const summaryGroupSchema = z
	.object({
		...CommonParams,
		mode: z.literal("group"),
		/** Group title */
		groupTitle: z.string().describe("Gruppenueberschrift der Summary-Gruppe."),
		/** Heading level for group title (default: 2) */
		groupHeadingLevel: z
			.enum(["2", "3", "4", "5", "6"])
			.optional()
			.default("2")
			.describe(
				"Heading-Level der Gruppenueberschrift. Der Renderer nutzt hier kern-heading-medium.",
			),
		/** Array of summaries in the group */
		summaries: z
			.array(singleSummarySchema)
			.min(1)
			.describe("Enthaltene Summary-Aufgaben der Gruppe."),
	})
	.describe(
		"Parameter fuer eine Summary-Gruppe mit mehreren Aufgabenbereichen.",
	);

/**
 * Discriminated union for summary: single vs group mode
 */
export const summarySchema = z
	.discriminatedUnion("mode", [summarySingleSchema, summaryGroupSchema])
	.describe(
		"Parameter fuer KERN UX Summary-Komponente (single oder group). Summary zeigt Inhalte und Bearbeitungslinks, aber keinen Bearbeitungsstatus wie eine Tasklist.",
	);

export type SummaryItemInput = z.input<typeof summaryItemSchema>;
export type SummaryActionInput = z.input<typeof summaryActionSchema>;
export type SingleSummaryInput = z.input<typeof singleSummarySchema>;
export type SummarySingleInput = z.input<typeof summarySingleSchema>;
export type SummaryGroupInput = z.input<typeof summaryGroupSchema>;
export type SummaryInput = z.input<typeof summarySchema>;
