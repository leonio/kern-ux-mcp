import type { PromptMessage } from "@modelcontextprotocol/client";

/**
 * An MCP prompt's messages as one text for `claude -p`, since headless Claude
 * Code runs no MCP prompts of its own: a text as it is, an embedded resource
 * in a <resource> tag with its URI, a resource link as one line. Without
 * --resources the model can't read a linked resource, so the line only names it.
 */
export function promptText(messages: readonly PromptMessage[]): string {
	return messages
		.map(({ content }) => {
			if (content.type === "text") return content.text;
			if (content.type === "resource") {
				const { resource } = content;
				if (!("text" in resource)) {
					throw new Error(`The prompt embeds ${resource.uri} as binary.`);
				}
				return `<resource uri="${resource.uri}">\n${resource.text.trimEnd()}\n</resource>`;
			}
			if (content.type === "resource_link") {
				return `Resource: ${content.uri}${content.title ? ` (${content.title})` : ""}`;
			}
			throw new Error(`The eval can't send ${content.type} prompt content.`);
		})
		.join("\n\n");
}
