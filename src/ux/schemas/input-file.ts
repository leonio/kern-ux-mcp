import { z } from "zod";
import { FormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;
const FileFieldSchema = FormFieldBaseSchema.pick({
	label: true,
	hint: true,
	error: true,
	optional: true,
	disabled: true,
}).extend({
	label: z
		.string()
		.min(1)
		.describe(
			"Sichtbares Label fuer den Datei-Upload. Sollte die erwartete Datei oder den Zweck des Uploads konkret benennen, nicht nur allgemein 'Upload'.",
		),
});

export const inputFileSchema = z
	.object({
		...CommonParams,
		name: z
			.string()
			.describe(
				"Name-Attribut des Datei-Felds. Sollte die fachliche Bedeutung der hochgeladenen Datei benennen.",
			),
		accept: z
			.string()
			.optional()
			.describe(
				"Optionaler accept-Filter, z.B. 'image/*,.pdf'. Nur als UI-Filter fuer die Dateiauswahl verstehen; serverseitige Validierung bleibt trotzdem erforderlich.",
			),
	})
	.merge(FileFieldSchema)
	.describe(
		"Parameter fuer KERN UX InputFile-Komponente. Hinweistext sollte erlaubte Formate und, wenn relevant, Groessenlimits nennen. Der Upload selbst bleibt fachlich auf genau eine Datei ausgerichtet.",
	);

export type InputFileInput = z.input<typeof inputFileSchema>;
