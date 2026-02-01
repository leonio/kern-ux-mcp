import { z } from "zod";
import { McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;

export const tasklistItemSchema = z.object({
	title: z
		.string()
		.describe("Aufgabentitel oder Zusammenfassungs-Text des Eintrags."),
	href: z
		.string()
		.optional()
		.describe(
			"Optionales Link-Ziel. Ohne href wird der Titel als nicht klickbarer Text gerendert.",
		),
	status: z
		.string()
		.optional()
		.default("Offen")
		.describe(
			"Sichtbarer Status-Text des Eintrags, z.B. 'Erledigt' oder 'Unvollstaendig'.",
		),
	statusType: z
		.enum(["info", "success", "warning", "danger"])
		.optional()
		.default("info")
		.describe("Badge-Variante fuer den Status des Eintrags."),
});

export const tasklistSchema = z
	.object({
		...CommonParams,
		heading: z
			.string()
			.optional()
			.default("Aufgaben")
			.describe(
				"Ueberschrift der Tasklist. Der Renderer nutzt immer die KERN-Darstellung mit kern-heading-medium.",
			),
		numbered: z
			.boolean()
			.optional()
			.default(true)
			.describe(
				'Wenn true, wird vor jedem Eintrag ein fortlaufender <span class="kern-number"> gerendert. Bei false entsteht die ungeordnete Variante.',
			),
		items: z
			.array(tasklistItemSchema)
			.min(1)
			.describe(
				"Eintraege der Tasklist. Dieses Schema modelliert genau eine Tasklist, nicht den zusaetzlichen kern-task-list-group-Wrapper aus den KERN-Beispielen.",
			),
	})
	.describe(
		"Parameter fuer KERN UX Tasklist-Komponente. Geeignet fuer Aufgaben oder Pruefschritte mit sichtbarem Bearbeitungsstatus; jeder Eintrag wird mit einem Status-Badge gerendert.",
	);

export type TasklistInput = z.input<typeof tasklistSchema>;
