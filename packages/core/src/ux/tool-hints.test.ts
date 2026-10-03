import { describe, expect, it } from "vitest";

import { loadRegistryFromManifest } from "./registry.js";
import { TOOL_HINTS, withToolHint } from "./tool-hints.js";
import { createTools } from "./tools.js";

const tools = createTools(loadRegistryFromManifest()).listTools();
const toolNames = new Set(tools.map((tool) => tool.name));

describe("TOOL_HINTS", () => {
	it.each(Object.entries(TOOL_HINTS))(
		"%s is one short sentence",
		(_tool, hint) => {
			expect(hint.text.length).toBeLessThanOrEqual(80);
			expect(hint.text).toMatch(/^[A-Z].*\.$/);
		},
	);

	it.each(Object.entries(TOOL_HINTS))(
		"%s belongs to a tool and names only tools that exist",
		(tool, hint) => {
			expect(toolNames).toContain(tool);
			for (const named of hint.text.match(
				/\b(?:get|list|render|validate)_[a-z_]+/g,
			) ?? []) {
				expect(toolNames).toContain(named);
			}
		},
	);

	it.each(Object.entries(TOOL_HINTS))(
		"%s records where it came from",
		(_tool, hint) => {
			expect(hint.source).toMatch(
				/^(components|foundations|patterns)\/[a-z0-9-]+\.json$/,
			);
			expect(hint.inputHash).toMatch(/^sha256:[0-9a-f]{64}$/);
		},
	);
});

describe("withToolHint", () => {
	it("appends the tool's hint to its description", () => {
		expect(withToolHint("get_preline", "KERN UX: HTML for a preline.")).toBe(
			`KERN UX: HTML for a preline. ${TOOL_HINTS.get_preline.text}`,
		);
	});

	it("leaves a description without a hint as it is", () => {
		expect(withToolHint("get_divider", "KERN UX: HTML for a divider.")).toBe(
			"KERN UX: HTML for a divider.",
		);
		expect(withToolHint("constructor", "x")).toBe("x");
	});

	it("reaches the listing", () => {
		const preline = tools.find((tool) => tool.name === "get_preline");

		expect(preline?.description.endsWith(TOOL_HINTS.get_preline.text)).toBe(
			true,
		);
	});
});
