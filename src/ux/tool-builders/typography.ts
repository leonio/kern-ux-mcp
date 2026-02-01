import type { z } from "zod";
import { pickLocale } from "../i18n.js";
import { bodyToolSchema } from "../schemas/body.js";
import { headingToolSchema } from "../schemas/heading.js";
import { labelToolSchema } from "../schemas/label.js";
import { linkToolSchema } from "../schemas/link.js";
import { listsToolSchema } from "../schemas/lists.js";
import { prelineToolSchema } from "../schemas/preline.js";
import { sublineToolSchema } from "../schemas/subline.js";
import { titleToolSchema } from "../schemas/title.js";
import { TypographyToolSchema } from "../schemas/typography.js";
import { buildBody } from "../templates/body.js";
import { buildHeading } from "../templates/heading.js";
import { buildLabel } from "../templates/label.js";
import { buildLink } from "../templates/link.js";
import { buildLists } from "../templates/lists.js";
import { buildPreline } from "../templates/preline.js";
import { buildSubline } from "../templates/subline.js";
import { buildTitle } from "../templates/title.js";
import { buildTypography } from "../templates/typography.js";
import type { ComponentInfo } from "../types.js";
import { validateHtmlStrict } from "../validate.js";
import {
	assertStrictValidationOrThrow,
	ComponentOutputSchema,
	experimentalBanner,
	getComponentToolName,
	type ToolDef,
} from "./shared.js";

/**
 * Foundational typography strategy tooling.
 */

export const TYPOGRAPHY_MANIFEST_IDS = new Set([
	"heading",
	"body",
	"label",
	"link",
	"lists",
	"preline",
	"subline",
	"title",
]);

export function buildTypographyTool(component: ComponentInfo): ToolDef {
	const name = getComponentToolName(component);
	const inputSchema =
		component.id === "body"
			? bodyToolSchema
			: component.id === "heading"
				? headingToolSchema
				: component.id === "label"
					? labelToolSchema
					: component.id === "link"
						? linkToolSchema
						: component.id === "lists"
							? listsToolSchema
							: component.id === "preline"
								? prelineToolSchema
								: component.id === "subline"
									? sublineToolSchema
									: component.id === "title"
										? titleToolSchema
										: TypographyToolSchema;

	return {
		name,
		description:
			component.id === "heading"
				? "KERN UX (Foundational/Typography): HTML für Heading erzeugen. " +
					"Nutze level 1-6 für Hierarchie (h1..h6). Beispiel: { text: 'Services', level: 2 }."
				: `KERN UX (Foundational/Typography): HTML für ${component.title} erzeugen.`,
		inputSchema,
		outputSchema: ComponentOutputSchema,
		handler: async (args: z.infer<typeof inputSchema>) => {
			const locale = pickLocale(args.locale);
			const strict = args.strict === true;
			const typographyArgs = args as Partial<{
				kind:
					| "heading"
					| "body"
					| "label"
					| "link"
					| "list"
					| "preline"
					| "subline"
					| "title";
				level: 1 | 2 | 3 | 4 | 5 | 6;
				text: string;
				href: string;
				ordered: boolean;
			}>;

			const inferredKind =
				typographyArgs.kind ??
				(component.id.includes("heading")
					? "heading"
					: component.id.includes("label")
						? "label"
						: component.id.includes("link")
							? "link"
							: component.id.includes("list")
								? "list"
								: component.id.includes("preline")
									? "preline"
									: component.id.includes("subline")
										? "subline"
										: component.id.includes("title")
											? "title"
											: "body");

			const html =
				experimentalBanner(component) +
				(component.id === "body"
					? buildBody(args as Parameters<typeof buildBody>[0]).html
					: component.id === "heading"
						? buildHeading(args as Parameters<typeof buildHeading>[0]).html
						: component.id === "label"
							? buildLabel(args as Parameters<typeof buildLabel>[0]).html
							: component.id === "link"
								? buildLink(args as Parameters<typeof buildLink>[0]).html
								: component.id === "lists"
									? buildLists(args as Parameters<typeof buildLists>[0]).html
									: component.id === "preline"
										? buildPreline(args as Parameters<typeof buildPreline>[0])
												.html
										: component.id === "subline"
											? buildSubline(args as Parameters<typeof buildSubline>[0])
													.html
											: component.id === "title"
												? buildTitle(args as Parameters<typeof buildTitle>[0])
														.html
												: (component.htmlCanonical ??
													buildTypography({
														kind: inferredKind,
														level: typographyArgs.level,
														text: typographyArgs.text,
														href: typographyArgs.href,
														ordered: typographyArgs.ordered,
													}).html));

			const validation = validateHtmlStrict(html);

			assertStrictValidationOrThrow({ name, locale, strict, validation });

			return { html, warnings: component.warnings ?? [], validation };
		},
	};
}
