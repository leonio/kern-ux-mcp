import { z } from "zod";

/**
 * Zod schema for Alert component parameters.
 */
export const AlertSchema = z
	.object({
		locale: z
			.enum(["de", "en"])
			.optional()
			.describe("Sprache für Tool-Strings (Standard: de)."),
		strict: z
			.boolean()
			.optional()
			.describe("Wenn true: bei Validierungsfehlern wird kein HTML geliefert."),
		type: z
			.enum(["info", "success", "warning", "danger"])
			.default("info")
			.describe(
				"Alert-Typ: info, success, warning oder danger. Steuert Variante und passendes Status-Icon im Header.",
			),
		title: z
			.string()
			.min(1)
			.describe(
				"Alert-Ueberschrift. Kurz und eindeutig formulieren; sie traegt die Hauptaussage des Alerts.",
			),
		body: z
			.object({
				text: z
					.string()
					.optional()
					.describe(
						"Optionaler Fliesstext im Alert-Body fuer zusaetzlichen Kontext oder Erlaeuterungen.",
					),
				links: z
					.array(
						z.object({
							href: z
								.string()
								.describe(
									"Link-Ziel fuer eine weiterfuehrende Aktion oder Information.",
								),
							text: z.string().describe("Sichtbarer Link-Text im Alert-Body."),
						}),
					)
					.optional()
					.describe(
						"Optionale Links im Body. Der Renderer verwendet dafuer KERN-Links mit dekorativem Arrow-Forward-Icon.",
					),
				listItems: z
					.array(z.string())
					.optional()
					.describe(
						"Optionale Listenelemente im Body, z.B. fuer mehrere Hinweise, Schritte oder Fehlerpunkte.",
					),
				listStyle: z
					.enum(["default", "bullet"])
					.optional()
					.default("default")
					.describe(
						"Listen-Stil: default oder bullet. Entspricht kern-list bzw. kern-list kern-list--bullet.",
					),
			})
			.optional()
			.describe(
				"Optionaler Body-Inhalt des Alerts. Der Alert kann nur aus Header bestehen oder zusaetzlich Text, Links und Listen aufnehmen.",
			),
	})
	.describe(
		'Parameter fuer KERN UX Alert-Komponente. Der Renderer erzeugt immer role="alert" und setzt das Status-Icon standardmaessig auf aria-hidden="true", weil die Textinhalte die eigentliche Information tragen.',
	);

/** Type for alert input (before Zod parsing, allows missing defaulted fields) */
export type AlertInput = z.input<typeof AlertSchema>;

/** Type for alert params after Zod parsing (all defaults applied) */
export type AlertParams = z.output<typeof AlertSchema>;
