import { z } from "zod";

import type { KernResourceDefinition } from "../resources/definition.js";
import type { Locale, Registry } from "../ux/types.js";
import {
	cardLinks,
	embeddedResource,
	filledIn,
	type KernPromptDefinition,
	LOCALE_NAMES,
	localeArgument,
	numbered,
	strictRender,
	VERBATIM_ANSWER,
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

/** The cards a multi-step form adds: the step list, progress and the review. */
const STEP_CARDS = ["tasklist", "progress", "summary"] as const;

/** Example labels, in the form's language. */
const NAVIGATION_LABELS: Readonly<Record<Locale, string>> = {
	de: "Zurück, Weiter and Absenden",
	en: "Back, Next and Submit",
};
const REVIEW_STEP: Readonly<Record<Locale, string>> = {
	de: "Prüfen und Absenden",
	en: "Review and submit",
};

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
			'The fields, separated by commas, e.g. "Vorname, Nachname, E-Mail, Geburtsdatum". Options in brackets, e.g. "Anrede (Frau, Herr, divers)". With steps, the fields of every step, in order.',
		),
	steps: z
		.string()
		.optional()
		.describe(
			'The steps of a multi-step form, separated by semicolons, e.g. "Persönliche Daten; Fahrzeug; Prüfen und Absenden". Leave it empty for a form on one page.',
		),
	locale: localeArgument,
});

type Args = z.output<typeof argsSchema>;

/**
 * create_input_form: a form from a list of fields, built with field, fieldset
 * and form blocks and rendered strictly. Given steps, a formFlow block instead,
 * with a summary in the step for checking the answers. The forms guide is
 * embedded and the cards of the inputs (and of the step list, progress and
 * summary) are linked; the workflow comes last, ending with the answer it
 * wants, so that's what the model reads last.
 */
export function createInputForm(
	registry: Registry,
	guides: KernResourceDefinition,
): KernPromptDefinition<typeof argsSchema> {
	const formLinks = cardLinks(registry, FORM_CARDS);
	const stepLinks = cardLinks(registry, STEP_CARDS);

	return {
		name: "create_input_form",
		title: "Create a KERN form",
		description:
			"Builds an accessible form from a list of fields with the KERN tools: input types, fieldsets, required and optional fields, the error summary, and strict validation. Given steps, a multi-step form with a step list, progress, and a summary in the step for checking the answers.",
		argsSchema,
		content: async (args) => [
			await embeddedResource(guides, "forms"),
			...formLinks,
			...(filledIn(args.steps) ? stepLinks : []),
			{ type: "text", text: workflow(args) },
		],
	};
}

function workflow(args: Args): string {
	const locale = args.locale ?? "de";
	const steps = filledIn(args.steps);

	const items = [
		"**Fields:** one `field` block per field. Pick its `type`: text, email, tel, url, number, date, password, textarea, select, radio or checkbox. select and radio need `options`; a checkbox with `options` is a group. A file upload has no field type: render it with `get_inputfile` and add its HTML as an `html` block.",
		`**Labels:** a short \`label\` in ${LOCALE_NAMES[locale]} without a trailing colon, a \`name\`, and an \`autocomplete\` token where one fits (given-name, family-name, email, tel, bday, street-address, postal-code). A \`hint\` only where it helps, such as for an expected format.`,
		"**Required and optional:** `required: true` on the fields the form needs, `optional: true` on the few it doesn't. Radio and checkbox fields ignore `required`.",
		...(steps
			? stepItems(locale)
			: [
					'**Groups:** related fields go in a `fieldset` block with a `legend`, with `legendSize: "large"` for a main part of the form such as an address. Everything goes in one `form` block with `actions: { submitLabel }`. To show the form after a failed submit, give each field in error its `error` message and the form `errorSummary: {}`.',
				]),
		strictRender("render_composition", locale),
	];

	return [
		`Build ${steps ? "a multi-step form" : "a form"} with the kern tools: ${args.purpose.trim()}`,
		...(steps ? [`Steps: ${steps}`] : []),
		`Fields: ${args.fields.trim()}`,
		`The forms guide above has KERN's rules for labels, hints, errors and required fields, and the cards linked above describe ${steps ? "each input, the step list, the progress bar and the summary" : "each input"}. Work in this order:`,
		numbered(items),
		VERBATIM_ANSWER,
	].join("\n\n");
}

function stepItems(locale: Locale): string[] {
	return [
		`**Steps:** one \`formFlow\` block with exactly the steps given, in order, each \`label\` as given. Spread the fields over the steps in the order given, each step's fields in a \`fieldset\` whose \`legend\` names the step, with \`legendSize: "large"\`. \`navigation: { backLabel, nextLabel, submitLabel }\` (such as ${NAVIGATION_LABELS[locale]}) gives every step but the first a back button, and only the last one a submit button. The step list and the progress bar come with the block.`,
		`**Review:** KERN asks for a summary where people check their answers before sending them. If a step is for that, such as "${REVIEW_STEP[locale]}", start its \`contentBlocks\` with a summary block, \`{ kind: "summary", summary: { summaries: [{ title, items: [{ key, value }], editHref }] } }\`: one summary per earlier step, titled and ordered like the steps, with example answers and a link back to the step.`,
		"**The step shown:** `currentStep` is the step to show. Without `renderAllSteps`, each step is a page of its own; with `renderAllSteps: true`, every step is in the page and the inactive ones are hidden, so a script can switch between them. To show a step after a failed submit, give each field in error its `error` message and the `formFlow` block `errorSummary: {}`.",
	];
}
