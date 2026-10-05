import { z } from "zod";

import type { KernResourceDefinition } from "../resources/definition.js";
import type { Registry } from "../ux/types.js";
import {
	cardLinks,
	embeddedResource,
	type KernPromptDefinition,
	LOCALE_NAMES,
	localeArgument,
} from "./definition.js";

/** The cards of the inputs a form is built from, linked whatever the fields. */
const FORM_CARDS = [
	"inputtext",
	"textarea",
	"select",
	"checkbox",
	"radio",
	"fieldset",
] as const;

const argsSchema = z.object({
	purpose: z
		.string()
		.min(1)
		.describe(
			'What the form is for, e.g. "Kontaktformular des Bürgerbüros" or "Anmeldung zum Newsletter".',
		),
	fields: z
		.string()
		.min(1)
		.describe(
			'The fields, separated by commas, e.g. "Vorname, Nachname, E-Mail, Geburtsdatum". Options in brackets, e.g. "Anrede (Frau, Herr, divers)".',
		),
	locale: localeArgument,
});

/**
 * create_input_form: a form from a list of fields, built with field, fieldset
 * and form blocks and rendered strictly. The forms guide is embedded and the
 * input cards are linked; the workflow comes last, ending with the answer it
 * wants, so that's what the model reads last.
 */
export function createInputForm(
	registry: Registry,
	guides: KernResourceDefinition,
): KernPromptDefinition<typeof argsSchema> {
	const links = cardLinks(registry, FORM_CARDS);

	return {
		name: "create_input_form",
		title: "Create a KERN form",
		description:
			"Builds an accessible form from a list of fields with the KERN tools: input types, fieldsets, required and optional fields, the error summary, and strict validation.",
		argsSchema,
		content: async (args) => [
			await embeddedResource(guides, "forms"),
			...links,
			{ type: "text", text: workflow(args) },
		],
	};
}

function workflow(args: z.output<typeof argsSchema>): string {
	const locale = args.locale ?? "de";
	const language = LOCALE_NAMES[locale];

	return `Build a form with the kern tools: ${args.purpose.trim()}

Fields: ${args.fields.trim()}

The forms guide above has KERN's rules for labels, hints, errors and required fields, and the cards linked above describe each input. Work in this order:

1. **Fields:** one \`field\` block per field. Pick its \`type\`: text, email, tel, url, number, date, password, textarea, select, radio or checkbox. select and radio need \`options\`; a checkbox with \`options\` is a group. A file upload has no field type: render it with \`get_inputfile\` and add its HTML as an \`html\` block.
2. **Labels:** a short \`label\` in ${language} without a trailing colon, a \`name\`, and an \`autocomplete\` token where one fits (given-name, family-name, email, tel, bday, street-address, postal-code). A \`hint\` only where it helps, such as for an expected format.
3. **Required and optional:** \`required: true\` on the fields the form needs, \`optional: true\` on the few it doesn't. Radio and checkbox fields ignore \`required\`.
4. **Groups:** related fields go in a \`fieldset\` block with a \`legend\`, with \`legendSize: "large"\` for a main part of the form such as an address. Everything goes in one \`form\` block with \`actions: { submitLabel }\`. To show the form after a failed submit, give each field in error its \`error\` message and the form \`errorSummary: {}\`.
5. **Render:** call \`render_composition\` with \`locale: "${locale}"\` and \`strict: true\`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with \`validate_html\`.

Answer with the final HTML from the tool, verbatim, in one \`\`\`html block, not a description of it.`;
}
