import type { McpServer } from "@modelcontextprotocol/server";

import type { KernPromptDefinition } from "./definition.js";

/**
 * Registers each prompt. The SDK checks the arguments against argsSchema
 * (-32602 for a missing or invalid one, and for an unknown prompt) and
 * completes the arguments marked completable. Each content block becomes a
 * user message of its own.
 */
export function registerKernPrompts(
	server: McpServer,
	prompts: readonly KernPromptDefinition[],
): void {
	for (const prompt of prompts) {
		server.registerPrompt(
			prompt.name,
			{
				title: prompt.title,
				description: prompt.description,
				argsSchema: prompt.argsSchema,
			},
			async (args) => ({
				messages: (await prompt.content(args)).map((content) => ({
					role: "user" as const,
					content,
				})),
			}),
		);
	}
}
