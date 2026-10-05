import { completable } from "@modelcontextprotocol/server";
import { z } from "zod";

import {
	type KernResourceDefinition,
	resourceUri,
} from "../resources/definition.js";
import { componentCardUri } from "../ux/tool-builders/component-docs.js";
import type { ResourceLinkRef } from "../ux/tool-builders/shared.js";
import type { Locale, Registry } from "../ux/types.js";

/** One content block of a prompt, kept SDK-free like ToolDef. */
export type KernPromptContent =
	| { type: "text"; text: string }
	| {
			type: "resource";
			resource: { uri: string; mimeType: string; text: string };
	  }
	| ({ type: "resource_link" } & ResourceLinkRef);

/**
 * A prompt: a workflow over our tools that the user picks in the client. Its
 * content blocks each become a user message, in order.
 */
export type KernPromptDefinition<Args extends z.ZodObject = z.ZodObject> = {
	name: string;
	title: string;
	description: string;
	/** String arguments only, as MCP requires. Their descriptions show in the client. */
	argsSchema: Args;
	/** The content for arguments the schema has parsed. */
	content(args: z.output<Args>): Promise<readonly KernPromptContent[]>;
};

const LOCALES: readonly Locale[] = ["de", "en"];

/**
 * The locale argument every prompt takes, completed with de and en. A blank
 * value counts as none: a client may send "" for an optional argument left
 * empty. Built once, since completable() marks the schema it's given; the SDK
 * finds the completer under .optional() only, so the default is applied in code.
 */
export const localeArgument = completable(
	z
		.union([z.enum(["de", "en"]), z.literal("").transform(() => undefined)], {
			error: "locale is de or en.",
		})
		.describe("Language of the labels and messages: de (the default) or en."),
	(value) => LOCALES.filter((locale) => locale.startsWith(value ?? "")),
).optional();

export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
	de: "German",
	en: "English",
};

/** An optional free-text argument, or undefined when it's blank. */
export function filledIn(value: string | undefined): string | undefined {
	return value?.trim() || undefined;
}

/** A workflow's steps as a numbered Markdown list. */
export function numbered(items: readonly string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

/** The step that renders the result, strictly, in the page's language; the tools are alternatives. */
export function strictRender(
	tools: string | readonly string[],
	locale: Locale,
): string {
	const names = [tools]
		.flat()
		.map((tool) => `\`${tool}\``)
		.join(" or ");
	return `**Render:** call ${names} with \`locale: "${locale}"\` and \`strict: true\`. A strict call fails with the issues: fix the blocks and call again. If you change the HTML afterwards, check it with \`validate_html\`.`;
}

/** The last line of a workflow: the answer it asks for. */
export const VERBATIM_ANSWER =
	"Answer with the final HTML from the tool, verbatim, in one ```html block, not a description of it.";

/** Markup in a fenced html block whose fence no backtick run inside it can close. */
export function fencedHtml(html: string): string {
	const longest = Math.max(
		0,
		...[...html.matchAll(/`+/g)].map(([run]) => run.length),
	);
	const fence = "`".repeat(Math.max(3, longest + 1));
	return `${fence}html\n${html.trim()}\n${fence}`;
}

/** A resource embedded whole, as resources/read serves it. */
export async function embeddedResource(
	definition: KernResourceDefinition,
	value: string,
): Promise<KernPromptContent> {
	const text = await definition.read(value);
	if (text === undefined) {
		throw new Error(`${definition.name} has no ${value} to embed.`);
	}
	return {
		type: "resource",
		resource: {
			uri: resourceUri(definition, value),
			mimeType: definition.mimeType,
			text,
		},
	};
}

/** Links to component cards by registry ID, checked when the prompt is built. */
export function cardLinks(
	registry: Registry,
	ids: readonly string[],
): KernPromptContent[] {
	return ids.map((id) => {
		const component = registry.byId.get(id);
		if (!component) {
			throw new Error(
				`A prompt links the card ${id}, which isn't in the registry.`,
			);
		}
		return {
			type: "resource_link",
			uri: componentCardUri(id),
			name: id,
			title: `KERN ${component.title}`,
			mimeType: "text/markdown",
		};
	});
}
