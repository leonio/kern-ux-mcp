import { z } from "zod";
import { FormFieldBaseSchema, McpCommonSchema } from "./foundations.js";

const CommonParams = McpCommonSchema.shape;
const InputGroupFieldSchema = FormFieldBaseSchema.pick({
	disabled: true,
	readonly: true,
});

export const inputGroupSchema = z
	.object({
		...CommonParams,
		name: z
			.string()
			.describe("Name-Attribut des Input-Felds innerhalb der Input Group."),
		prefix: z
			.string()
			.optional()
			.describe(
				"Optionaler visueller Prefix vor dem Input, z.B. 'https://' oder '€'. Muss laut KERN bei Bedarf im Feldlabel mitbeschrieben werden, da Prefix/Suffix fuer Screenreader rein visuell bleiben.",
			),
		suffix: z
			.string()
			.optional()
			.describe(
				"Optionaler visueller Suffix nach dem Input, z.B. '.de' oder 'EUR'. Muss laut KERN bei Bedarf im Feldlabel mitbeschrieben werden.",
			),
		value: z.string().optional().describe("Optionaler Startwert im Input."),
		placeholder: z
			.string()
			.optional()
			.describe("Optionaler Platzhaltertext im eigentlichen Textfeld."),
	})
	.merge(InputGroupFieldSchema)
	.describe(
		"Parameter fuer KERN UX InputGroup-Komponente. Diese MCP-Schnittstelle modelliert die einfache Textfeld-Variante mit visuellem Prefix/Suffix sowie disabled/readonly, nicht die erweiterten Button- oder Error-Kompositionen aus den Story-Beispielen.",
	);

export type InputGroupInput = z.input<typeof inputGroupSchema>;
