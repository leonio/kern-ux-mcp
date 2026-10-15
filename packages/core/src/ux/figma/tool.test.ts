import { describe, expect, it } from "vitest";

import { invokeTool } from "../../invoke.js";
import { getCatalog } from "../../mcp/catalog.js";
import { FIGMA_KIT } from "./kit.js";

const tool = getCatalog().tools.find((t) => t.name === "plan_figma_design");

async function plan(input: Record<string, unknown>) {
	if (!tool) throw new Error("No plan_figma_design.");
	return (await invokeTool(tool, input)) as {
		name: string;
		kit: { name: string; version: string };
		components: string[];
		scripts: string[];
		steps: string[];
		unmapped: string[];
		warnings: string[];
	};
}

describe("plan_figma_design", () => {
	it("returns the components to look up and a script with a key for each", async () => {
		const result = await plan({
			html: '<h1 class="kern-heading-x-large">Start</h1><button class="kern-btn kern-btn--primary"><span class="kern-label">Los</span></button>',
		});

		expect(result).toMatchObject({
			name: "Start",
			kit: { ...FIGMA_KIT },
			components: ["button-primary", "heading-x-large"],
			unmapped: [],
			warnings: [],
		});
		expect(result.scripts[0]).toContain(
			'const KEYS = {\n  "button-primary": "",\n  "heading-x-large": "",\n};',
		);
		expect(result.scripts[0]).toContain(
			'const PLAN = {"name":"Start","device":"desktop"',
		);
		expect(
			result.scripts[0]
				?.trimEnd()
				.endsWith("return await buildKernScreen(PLAN, KEYS);"),
		).toBe(true);
		expect(result.steps).toHaveLength(4);
		expect(result.steps[0]).toContain(
			"one component query per name in components (2)",
		);
	});

	it("takes a name and the mobile width, and lists what the kit lacks", async () => {
		const result = await plan({
			html: '<dialog class="kern-dialog"><p>Löschen?</p></dialog>',
			name: "Löschen bestätigen",
			device: "mobile",
		});

		expect(result.name).toBe("Löschen bestätigen");
		expect(result.scripts[0]).toContain('"device":"mobile","width":360');
		expect(result.unmapped).toEqual(["dialog"]);
		expect(result.steps.at(-1)).toBe(
			"These have no kit component and are placeholders: dialog. Tell the designer.",
		);
	});

	it("rejects empty HTML and an unknown device", async () => {
		await expect(plan({ html: "" })).rejects.toThrow("plan_figma_design");
		await expect(plan({ html: "<p>x</p>", device: "tablet" })).rejects.toThrow(
			"device",
		);
	});
});
