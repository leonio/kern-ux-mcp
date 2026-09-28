import { z } from "zod";

/**
 * Zod schema for Dialog component parameters.
 *
 * Flat top-level properties only — no nested objects — so that MCP clients
 * can construct the input reliably.
 */
export const DialogSchema = z
	.object({
		locale: z
			.enum(["de", "en"])
			.optional()
			.describe("Sprache für Tool-Strings (Standard: de)."),
		strict: z
			.boolean()
			.optional()
			.describe("Wenn true: bei Validierungsfehlern wird kein HTML geliefert."),
		id: z
			.string()
			.optional()
			.describe(
				"Optionale feste ID fuer den Dialog. Ohne Angabe wird sie automatisch generiert und fuer aria-labelledby sowie Trigger-Verknuepfung wiederverwendet.",
			),
		title: z
			.string()
			.min(1)
			.describe(
				"Dialog-Ueberschrift. Sollte die Frage, Entscheidung oder Konsequenz des Dialogs kurz und eindeutig benennen.",
			),
		body: z
			.string()
			.min(1)
			.describe(
				"Dialog-Inhalt. Standardmaessig als Text gerendert; fuer laengere Inhalte oder strukturierte Hinweise knapp halten und auf die entscheidungsrelevanten Informationen fokussieren.",
			),
		bodyIsHtml: z
			.boolean()
			.optional()
			.default(false)
			.describe(
				"Wenn true, wird body als vertrauenswuerdiges HTML interpretiert statt escaped. Nur fuer bewusst erzeugte KERN-kompatible Markup-Inhalte verwenden.",
			),
		confirmLabel: z
			.string()
			.min(1)
			.describe(
				"Text des primaeren Aktions-Buttons. Sollte die auszufuehrende Handlung klar benennen, z.B. 'Loeschen' statt allgemeinem 'OK'.",
			),
		confirmId: z
			.string()
			.optional()
			.describe(
				"Optionale feste ID fuer den primaeren Aktions-Button, z.B. fuer gezielte Weiterverarbeitung im Host.",
			),
		cancelLabel: z
			.string()
			.min(1)
			.describe(
				'Text des sekundaeren Abbrechen-Buttons. Im gerenderten Dialog als Button mit formmethod="dialog" umgesetzt.',
			),
		tertiaryLabel: z
			.string()
			.optional()
			.describe(
				"Optionaler tertiaerer Button-Text fuer eine weniger gewichtete Zusatzaktion oder einen Link-aehnlichen Ausweg.",
			),
		triggerLabel: z
			.string()
			.optional()
			.describe(
				"Text fuer den optionalen Trigger-Button. Wenn gesetzt, wird vor dem Dialog ein Button mit data-dialog-target erzeugt, der den Dialog oeffnen kann.",
			),
		triggerVariant: z
			.enum(["primary", "secondary", "tertiary"])
			.optional()
			.default("primary")
			.describe(
				"Variante des Trigger-Buttons. Nur relevant, wenn triggerLabel gesetzt ist.",
			),
		closeButtonLabel: z
			.string()
			.optional()
			.describe(
				"Screenreader-Text fuer den Schliessen-Button im Header. Standard: 'Schliessen' bzw. 'Close'.",
			),
	})
	.describe(
		'Parameter fuer KERN UX Dialog-Komponente. Der Renderer bildet die KERN-Struktur mit <dialog>, Header, Body, Footer und Formular-Buttons nach; Abbrechen und Schliessen verwenden formmethod="dialog". ' +
			"Beispiel: { title: 'Bestaetigen', body: 'Moechten Sie fortfahren?', confirmLabel: 'Ja', cancelLabel: 'Nein', triggerLabel: 'Dialog oeffnen', triggerVariant: 'primary' }.",
	);

/** Type for dialog input (before Zod parsing, allows missing defaulted fields) */
export type DialogInput = z.input<typeof DialogSchema>;

/** Type for dialog params after Zod parsing (all defaults applied) */
export type DialogParams = z.output<typeof DialogSchema>;
