import { z } from "zod";
import { HeadingLevelSchema } from "./foundations.js";

export const FormFlowStepSchema = z.object({
	label: z
		.string()
		.min(1)
		.describe(
			"Schrittbezeichnung – wird in Tasklist und Fortschrittsanzeige verwendet.",
		),
	statusText: z
		.string()
		.optional()
		.describe(
			"Übersteuert den automatisch abgeleiteten Status-Badge-Text (z.B. 'Erledigt', 'Aktuell', 'Offen').",
		),
	contentBlocks: z
		.array(z.any())
		.optional()
		.describe(
			"Inhalt dieses Schrittes, dargestellt mit der Standard-ContentBlock-Grammatik (text/html/button/grid/card/…). Typisierung erfolgt über RecursiveContentNodeSchema in content-union.ts.",
		),
});

export const FormFlowSchema = z
	.object({
		currentStep: z
			.number()
			.int()
			.min(1)
			.describe(
				"Aktiver Schritt (1-basiert). Werte außerhalb des gültigen Bereichs werden auf den letzten Schritt begrenzt.",
			),
		steps: z
			.array(FormFlowStepSchema)
			.min(2)
			.describe(
				"Mindestens 2 Schritte. Jeder Schritt hat ein Label und optionale contentBlocks.",
			),
		heading: z
			.string()
			.optional()
			.describe("Optionaler Formulartitel oberhalb der Tasklist."),
		headingLevel: HeadingLevelSchema.optional()
			.default(2)
			.describe(
				"Überschriftenebene des Formulartitels (Tasklist-Heading erbt diese Ebene).",
			),
		showProgress: z
			.boolean()
			.optional()
			.default(true)
			.describe("Wenn false, wird keine Fortschrittsanzeige gerendert."),
		navigation: z
			.object({
				backLabel: z
					.string()
					.optional()
					.describe("Label für den Zurück-Button."),
				nextLabel: z
					.string()
					.optional()
					.describe("Label für den Weiter-Button."),
				submitLabel: z
					.string()
					.optional()
					.describe(
						"Label für den Absenden-Button (wird nur im letzten Schritt angezeigt).",
					),
			})
			.optional()
			.describe(
				"Optionale Navigation. Wird komplett weggelassen, erscheinen keine Navigations-Buttons.",
			),
	})
	.describe(
		"Mehrstufiges Formular-Layout: Tasklist + optionale Fortschrittsanzeige + aktiver Schritt-Inhalt.",
	);

export type FormFlowInput = z.input<typeof FormFlowSchema>;
export type FormFlowParams = z.output<typeof FormFlowSchema>;
