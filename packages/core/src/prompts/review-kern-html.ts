import { z } from "zod";

import type { KernResourceDefinition } from "../resources/definition.js";
import { VALIDATE_HTML_MAX_LENGTH } from "../ux/tools.js";
import type { Locale } from "../ux/types.js";
import {
	embeddedResource,
	fencedHtml,
	type KernPromptDefinition,
	LOCALE_NAMES,
	localeArgument,
	numbered,
	strictRender,
} from "./definition.js";

const argsSchema = z.object({
	html: z
		.string()
		.min(1)
		// The prompt passes it to validate_html, which takes no more.
		.max(VALIDATE_HTML_MAX_LENGTH)
		.describe(
			`The HTML to review: a whole page or a part of one, up to ${VALIDATE_HTML_MAX_LENGTH.toLocaleString("en")} characters.`,
		),
	locale: localeArgument,
});

type Args = z.output<typeof argsSchema>;

/**
 * review_kern_html: validate_html on the given HTML, a fix list by rule, and
 * the content rebuilt with our tools rather than patched by hand, rendered
 * strictly. The accessibility guide is embedded; it lists every rule, so no
 * cards are linked. The HTML comes before the steps, the answer last. The fix
 * list is asked for once, in the answer, so it records what the rebuild
 * changed: asked for as a step, models wrote it before rebuilding (r7-b).
 */
export function reviewKernHtml(
	guides: KernResourceDefinition,
): KernPromptDefinition<typeof argsSchema> {
	return {
		name: "review_kern_html",
		title: "Review HTML against KERN",
		description:
			"Checks HTML against KERN's accessibility rules with validate_html and the accessibility guide, lists the fixes by rule, and rebuilds the content with the KERN tools, checked with strict validation.",
		argsSchema,
		content: async (args) => [
			await embeddedResource(guides, "accessibility"),
			{ type: "text", text: workflow(args) },
		],
	};
}

function workflow(args: Args): string {
	const locale: Locale = args.locale ?? "de";

	const items = [
		"**Check:** call `validate_html` with the HTML as it is.",
		"**Problems:** collect them for your answer: the check's issues by `ruleId`, and what the check can't see by the WCAG criterion the guide lists for the component, such as a link made to look like a button (4.1.2) or a heading that doesn't say what its part is about (2.4.6).",
		"**Rebuild:** build the same content again with the kern tools instead of patching the markup: `render_page` for a whole page, `render_composition` for a part. Use `field` blocks in a `form` block for inputs, `section` blocks for headed parts, and the component tools, such as `get_table` or `get_button`, as `html` blocks for the rest. Keep every text, link, value and option, and replace classes KERN doesn't define. An image keeps its `src` and gets an `alt` text that says what it shows.",
		strictRender(["render_page", "render_composition"], locale),
	];

	return [
		"Review this HTML against KERN's accessibility rules and rebuild it with the kern tools:",
		fencedHtml(args.html),
		"The accessibility guide above lists what `validate_html` checks, KERN's accessibility rules, and the WCAG criteria each component leaves to the page. Work in this order:",
		numbered(items),
		`Answer with the fix list in ${LOCALE_NAMES[locale]}, one line per problem: its rule, how the rebuild fixed it, and what a person still has to check, such as an \`alt\` text written without seeing the image. Then the final HTML from the tool, verbatim, in one \`\`\`html block, not a description of it.`,
	].join("\n\n");
}
