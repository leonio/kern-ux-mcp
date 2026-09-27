import { expect } from "vitest";

import type { ComponentInfo, Registry } from "../ux/types.js";

/**
 * Shared helpers for tool tests. Test-only: excluded from the build via tsconfig.build.json.
 */

export type RenderedToolResult = {
	html: string;
	warnings: string[];
	validation: {
		ok: boolean;
	};
};

export function createRegistry<T extends ComponentInfo>(
	components: T[] = [],
): Registry {
	return {
		manifestVersion: "test",
		generatedAt: new Date().toISOString(),
		tokens: { colors: [], spacing: [], rawVariables: [] },
		components,
		byId: new Map(
			components.map((component) => [component.id, component] as const),
		),
	};
}

export async function invokeTool<TResult>(
	tool: { handler(args: unknown): Promise<unknown> } | undefined,
	args: unknown,
): Promise<TResult> {
	expect(tool).toBeDefined();
	if (!tool) {
		throw new Error("Expected tool to be defined");
	}

	return (await tool.handler(args)) as TResult;
}
