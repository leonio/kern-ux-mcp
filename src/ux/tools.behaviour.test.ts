import { describe, expect, it } from "vitest";

import {
	createRegistry,
	invokeTool,
	type RenderedToolResult,
} from "../test-support/tools.js";
import { createTools } from "./tools.js";

type DocsToolResult = {
	excerpt: string;
	sections?: Array<{ content: string }>;
	reviewedGuidance?: {
		status: string;
		summary: {
			text: string;
			evidence: Array<{ note?: string }>;
		};
	};
};

describe("tool behaviour", () => {
	it("formats deprecated warning with object-style get_component_docs args", async () => {
		const registry = createRegistry([
			{
				id: "legacycomponent",
				title: "LegacyComponent",
				status: "deprecated",
				category: "interactive",
				strategy: "fallback",
				guidance: { de: "", en: "" },
				htmlCanonical: '<div class="kern-body">Legacy</div>',
			},
		]);

		const tools = createTools(registry);
		const tool = tools.getTool("get_legacycomponent");

		expect(tool).toBeDefined();
		const result = await invokeTool<RenderedToolResult>(tool, {});
		expect(result.warnings.join("\n")).toContain(
			"get_component_docs with { componentId: 'legacycomponent' }",
		);
	});

	it("get_component_docs returns extracted docs plus locale-selected reviewed guidance", async () => {
		const registry = createRegistry([
			{
				id: "kopfzeile",
				title: "Kopfzeile",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				docs: {
					excerpt: "Sanitized docs excerpt",
					sections: [
						{
							source: "COMPONENTS.MD",
							heading: "Kopfzeile",
							content: "Sanitized section content",
						},
					],
				},
				reviewedGuidance: {
					status: "reviewed",
					summary: {
						text: {
							de: "Kuratiertes Summary DE",
							en: "Curated summary EN",
						},
						confidence: "high",
						evidence: [
							{
								kind: "story",
								source: "kern-ux-plain/stories/Kopfzeile/Kopfzeile.stories.js",
								note: {
									de: "Story-Hinweis DE",
									en: "Story note EN",
								},
							},
						],
					},
					primaryUseCases: [],
					antiUseCases: [],
					requiredA11yPractices: [],
					semanticInvariants: [],
					compositionPatterns: [],
					authoringNotes: [],
					migrationNotes: [],
				},
			},
			{
				id: "body",
				title: "Body",
				status: "stable",
				category: "foundational",
				strategy: "typography",
			},
		]);

		const tools = createTools(registry);
		const docsTool = tools.getTool("get_component_docs");

		expect(docsTool).toBeDefined();

		const result = await invokeTool<DocsToolResult>(docsTool, {
			componentId: "kopfzeile",
			locale: "de",
		});
		expect(result.excerpt).toBe("Sanitized docs excerpt");
		expect(result.sections?.[0].content).toBe("Sanitized section content");
		expect(result.reviewedGuidance?.status).toBe("reviewed");
		expect(result.reviewedGuidance?.summary.text).toBe(
			"Kuratiertes Summary DE",
		);
		expect(result.reviewedGuidance?.summary.evidence[0].note).toBe(
			"Story-Hinweis DE",
		);

		const resultEn = await invokeTool<DocsToolResult>(docsTool, {
			componentId: "kopfzeile",
			locale: "en",
		});
		expect(resultEn.reviewedGuidance?.summary.text).toBe("Curated summary EN");
		expect(resultEn.reviewedGuidance?.summary.evidence[0].note).toBe(
			"Story note EN",
		);

		const resultWithoutDocs = await invokeTool<DocsToolResult>(docsTool, {
			componentId: "body",
		});
		expect(resultWithoutDocs.excerpt).toContain(
			"No packaged component documentation available",
		);
		expect(resultWithoutDocs.reviewedGuidance).toBeUndefined();
	});

	it("get_utility_reference returns surface section with background custom properties", async () => {
		const tools = createTools(createRegistry([]));
		const tool = tools.getTool("get_utility_reference");

		const result = (await tool?.handler({ category: "surface" })) as {
			sections: Array<{ id: string; entries: Array<{ className: string }> }>;
		};

		expect(result.sections).toHaveLength(1);
		expect(result.sections[0].id).toBe("surface");
		expect(
			result.sections[0].entries.some(
				(e) => e.className === "--kern-color-background-subtle",
			),
		).toBe(true);
		expect(
			result.sections[0].entries.some(
				(e) => e.className === "--kern-color-surface-success",
			),
		).toBe(true);
	});
});
