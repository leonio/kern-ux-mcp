import { buildGuide, GUIDES } from "../skills/guide-builder.js";
import type { ToolDef } from "../ux/tool-builders/shared.js";
import type { Registry } from "../ux/types.js";
import {
	byteLength,
	type KernResourceDefinition,
	resourceUri,
} from "./definition.js";

/**
 * kern://guides/{name}: the guides of skills/guide-builder.ts, each built on
 * first use.
 */
export function guides(
	registry: Registry,
	tools: readonly ToolDef[],
): KernResourceDefinition {
	const built = new Map<string, Promise<string>>();

	const read = (name: string): Promise<string | undefined> => {
		if (!GUIDES.some((guide) => guide.name === name)) {
			return Promise.resolve(undefined);
		}
		let text = built.get(name);
		if (!text) {
			text = buildGuide(registry, name, tools);
			built.set(name, text);
		}
		return text;
	};

	const definition: KernResourceDefinition = {
		name: "guides",
		uriTemplate: "kern://guides/{name}",
		variable: "name",
		title: "KERN guides",
		description:
			"Guides that put what our tools do next to KERN's guidance: forms, layout and accessibility.",
		mimeType: "text/markdown",
		read,
		entries: () =>
			Promise.all(
				GUIDES.map(async (guide) => ({
					uri: resourceUri(definition, guide.name),
					value: guide.name,
					title: guide.title,
					description: guide.description,
					size: byteLength((await read(guide.name)) ?? ""),
				})),
			),
	};
	return definition;
}
