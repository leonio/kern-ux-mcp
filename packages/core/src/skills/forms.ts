import {
	fieldItems,
	GROUPS_ITEM,
	stepItems,
} from "../prompts/create-input-form.js";
import { numbered } from "../prompts/definition.js";
import { toolNoteLines } from "../resources/component-cards.js";
import type { KernResourceDefinition } from "../resources/definition.js";
import type { FieldType } from "../ux/schemas/field.js";
import { componentCardUri } from "../ux/tool-builders/component-docs.js";
import { getToolNotes } from "../ux/tool-notes.js";
import type { Registry } from "../ux/types.js";
import type { KernSkillDefinition } from "./definition.js";

/** The KERN component each field type renders. */
const FIELD_COMPONENTS: Readonly<Record<FieldType, string>> = {
	text: "inputtext",
	email: "inputemail",
	tel: "inputtel",
	url: "inputurl",
	number: "inputnumber",
	date: "inputdate",
	password: "inputpassword",
	textarea: "textarea",
	select: "select",
	radio: "radio",
	checkbox: "checkbox",
};

/** The components of a multi-step form, and where formFlow puts each. */
const STEP_COMPONENTS: ReadonlyArray<[id: string, usage: string]> = [
	["tasklist", "the step list of a `formFlow` block"],
	["progress", "the progress bar of a `formFlow` block"],
	["summary", "a `summary` block in the step for checking the answers"],
];

const RENDER_ITEM =
	'**Render:** call `render_composition` with `strict: true` and `locale` set to the page\'s language, `"de"` or `"en"`. When the form is a page of its own, with a header and footer, call `render_page` with the same blocks. A strict call fails with the issues: fix the blocks and call again.';

const USE_ITEM =
	"**Use the HTML:** put the HTML from the tool, verbatim and whole, in your answer or in the file you're editing. To change it, change the blocks and render again. Check any markup you change by hand with `validate_html`.";

/**
 * kern-ux-forms: the create_input_form prompt as a skill, which the model
 * picks for itself when a task needs a form. SKILL.md has the workflow, with
 * the prompt's steps, and KERN's rules for the text of a form, which the
 * tools can't check. The references are KERN's guidance per input and for
 * multi-step forms, from the registry, and the forms guide.
 */
export function kernUxForms(
	registry: Registry,
	guides: KernResourceDefinition,
): KernSkillDefinition {
	return {
		name: "kern-ux-forms",
		description:
			"Builds accessible forms in the KERN UX design system for German public-sector services with the kern-ux MCP server's tools (render_composition, render_page, validate_html): contact forms, applications (Anträge), registrations and multi-step forms with a step list, progress and a step for checking the answers. Use it when asked for a form, input fields, a Formular or an Antrag in KERN, or to fix a KERN form's labels, hints, error messages or required fields.",
		content: async () => {
			const guide = await guides.read("forms");
			if (guide === undefined) {
				throw new Error("The kern-ux-forms skill needs the forms guide.");
			}
			return {
				body: body(registry),
				references: {
					"references/inputs.md": inputsReference(registry),
					"references/steps.md": stepsReference(registry),
					"references/forms-guide.md": guide,
				},
			};
		},
	};
}

function body(registry: Registry): string {
	const rules = registry.foundations.get("form-inputs-overview")?.knowledge;
	if (!rules?.dos?.length || !rules.donts?.length) {
		throw new Error(
			"The kern-ux-forms skill quotes form-inputs-overview's do's and don'ts.",
		);
	}

	return [
		"# Build a KERN form",
		"Build the form with the kern-ux tools instead of writing its HTML: they tie each label to its input, list hints and errors in `aria-describedby`, mark required fields with `aria-required`, build the error summary, and use KERN's classes. The tools can't check the text of a form, so follow KERN's rules for it below.",
		"## Before you build",
		[
			"- **The fields:** take them from the request. Pick each field's type with [references/inputs.md](references/inputs.md), which has KERN's guidance for each input.",
			"- **One page or several steps:** one page, unless the form is too long for one or is a process in a fixed order, such as an application. If the request doesn't name the steps, group the fields into a few steps, each named for what it asks, and end with a step for checking the answers. KERN's guidance for steps, with its limits on their number, is in [references/steps.md](references/steps.md).",
			'- **The language:** German, `locale: "de"`, unless the request is in English or asks for English, `locale: "en"`. Labels, hints, error messages and buttons are in that language.',
		].join("\n"),
		"## Workflow",
		numbered([
			...fieldItems("the page's language"),
			GROUPS_ITEM,
			RENDER_ITEM,
			USE_ITEM,
		]),
		"## Several steps",
		"For a multi-step form, do these instead of step 4:",
		stepItems("de")
			.map((item) => `- ${item}`)
			.join("\n"),
		"## KERN's rules for the text",
		["Do:", "", ...rules.dos.map((rule) => `- ${rule}`)].join("\n"),
		["Don't:", "", ...rules.donts.map((rule) => `- ${rule}`)].join("\n"),
		"## References",
		[
			"- [references/inputs.md](references/inputs.md): which field type to use for which data, with KERN's guidance for each input and our notes where a tool differs from KERN.",
			"- [references/steps.md](references/steps.md): KERN's guidance for the step list, the progress bar and the summary of a multi-step form.",
			"- [references/forms-guide.md](references/forms-guide.md): how the tools build labels, hints, errors and the error summary, with an example, and KERN's rules for every input field. The `kern://guides/forms` resource has the same text.",
		].join("\n"),
	]
		.join("\n\n")
		.concat("\n");
}

function inputsReference(registry: Registry): string {
	return [
		"# Choosing the inputs",
		"Which `field` type to use for which data. Each section has KERN's guidance for the component the type renders, our notes where the tool differs from KERN, and the component's card, which also has the tool's fields and a rendered example.",
		...Object.entries(FIELD_COMPONENTS).map(([type, id]) =>
			componentSection(registry, id, `\`type: "${type}"\``),
		),
		componentSection(
			registry,
			"inputfile",
			"no field type: render it with `get_inputfile` and add its HTML as an `html` block",
		),
		componentSection(
			registry,
			"fieldset",
			"a `fieldset` block around related fields",
		),
	]
		.join("\n\n")
		.concat("\n");
}

function stepsReference(registry: Registry): string {
	return [
		"# Multi-step forms",
		"A `formFlow` block renders a form in steps: KERN's Task List as the step list, the Progress bar, the step's fields and the buttons to move between steps. KERN asks for a Summary where people check their answers before they send them.",
		...STEP_COMPONENTS.map(([id, usage]) =>
			componentSection(registry, id, usage),
		),
	]
		.join("\n\n")
		.concat("\n");
}

/** A component's guidance from the registry and our notes on its tool. */
function componentSection(
	registry: Registry,
	id: string,
	usage: string,
): string {
	const component = registry.byId.get(id);
	if (!component) {
		throw new Error(
			`The kern-ux-forms skill describes ${id}, which isn't in the registry.`,
		);
	}
	const knowledge = component.knowledge ?? {};
	const notes = getToolNotes(id);

	return [
		`## ${component.title}: ${usage}`,
		component.summary ?? component.docs?.summary,
		labelled("Use it for", knowledge.whenToUse),
		labelled(
			"Not for",
			knowledge.whenNotToUse?.map((entry) => {
				const instead = entry.useInstead
					? registry.byId.get(entry.useInstead)?.title
					: undefined;
				return instead ? `${entry.text} Use ${instead} instead.` : entry.text;
			}),
		),
		labelled("Do", knowledge.dos),
		labelled("Don't", knowledge.donts),
		notes
			? [
					`Our tool: ${notes.summary.text.en}`,
					toolNoteLines(notes)
						.map((line) => `- ${line}`)
						.join("\n"),
				]
					.filter(Boolean)
					.join("\n\n")
			: undefined,
		`Card: \`${componentCardUri(id)}\``,
	]
		.filter(Boolean)
		.join("\n\n");
}

/** A label and a bullet list, or nothing for an empty list. */
function labelled(
	label: string,
	items: readonly string[] | undefined,
): string | undefined {
	if (!items || items.length === 0) return undefined;
	return [`${label}:`, "", ...items.map((item) => `- ${item}`)].join("\n");
}
