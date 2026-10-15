import { describe, expect, it } from "vitest";

import { invokeTool } from "../../invoke.js";
import { getCatalog } from "../../mcp/catalog.js";
import {
	FakeComponent,
	FakeFigma,
	FakeInstance,
	type FakeNode,
	runFigmaScript,
	withKeys,
} from "../../test-support/figma.js";
import { TOOL_EXAMPLES } from "../tool-examples.js";
import { planFigmaDesign } from "./plan.js";
import { figmaScripts, USE_FIGMA_MAX_LENGTH } from "./script.js";

const { tools } = getCatalog();

async function html(tool: string, input: Record<string, unknown>) {
	const found = tools.find((t) => t.name === tool);
	if (!found) throw new Error(`No tool ${tool}`);
	return ((await invokeTool(found, input)) as { html: string }).html;
}

/**
 * Plans the markup and runs its scripts, in order, in a fake Figma with every
 * key filled in. The report is the parts' reports together.
 */
async function build(
	markup: string,
	options: {
		linked?: boolean;
		without?: string[];
		figma?: FakeFigma;
		maxLength?: number;
	} = {},
) {
	const figma = options.figma ?? new FakeFigma({ linked: options.linked });
	const { plan, components } = planFigmaDesign(markup);
	const scripts = figmaScripts(plan, components, options.maxLength);
	const reports = [];
	for (const script of scripts) {
		reports.push(
			await runFigmaScript(withKeys(script, figma, options.without), figma),
		);
	}
	const last = reports.at(-1);
	const report = {
		screenId: last?.screenId ?? null,
		slotsId: last?.slotsId ?? null,
		instances: reports.reduce((sum, r) => sum + r.instances, 0),
		missing: [...new Set(reports.flatMap((r) => r.missing))],
		warnings: [...new Set(reports.flatMap((r) => r.warnings))],
		errors: reports.flatMap((r) => r.errors),
	};
	const screen = figma.nodes.get(report.screenId ?? "") as FakeNode;
	return { figma, report, screen, scripts };
}

/** A node's tree as names, for comparing two builds. */
function outline(node: FakeNode): unknown {
	return node.children.length > 0
		? { [node.name]: node.children.map(outline) }
		: node.name;
}

function instancesOf(root: FakeNode, kitName: string): FakeInstance[] {
	return root.findAll(
		(node) =>
			node instanceof FakeInstance &&
			node.name === kitName &&
			!(node.parent instanceof FakeInstance),
	) as FakeInstance[];
}

const PAGE = {
	kopfzeile: true,
	header: {
		title: "Bürgerservice",
		navigation: [{ label: "Start", href: "/", current: true }],
	},
	heading: "Sperrmüll anmelden",
	contentBlocks: [
		{ kind: "text", text: "Melden Sie hier Ihren Sperrmüll an." },
		{
			kind: "grid",
			grid: {
				columnsContent: [
					[
						{
							kind: "card",
							card: {
								header: { title: "Wohngeld" },
								body: "Zuschuss zur Miete.",
							},
						},
					],
					[
						{
							kind: "card",
							card: {
								header: { title: "Elterngeld" },
								footer: { primaryLabel: "Beantragen" },
							},
						},
					],
				],
			},
		},
		{
			kind: "form",
			form: {
				contentBlocks: [
					{
						kind: "field",
						field: {
							type: "text",
							name: "n",
							label: "Name",
							hint: "Wie im Ausweis",
						},
					},
					{
						kind: "field",
						field: {
							type: "radio",
							name: "zeit",
							label: "Abholung",
							options: [
								{ value: "vm", label: "Vormittag" },
								{ value: "nm", label: "Nachmittag" },
							],
						},
					},
				],
				actions: { submitLabel: "Absenden" },
			},
		},
		{
			kind: "button",
			button: {
				variant: "secondary",
				label: "Weiter",
				icon: { name: "arrow-forward", position: "right" },
			},
		},
	],
	footer: { note: "© Musterstadt" },
};

describe("the Figma script", () => {
	it("builds a page from the kit without errors or warnings", async () => {
		const { report, screen, figma } = await build(
			await html("render_page", PAGE),
		);

		expect(report.errors).toEqual([]);
		expect(report.warnings).toEqual([]);
		expect(report.missing).toEqual([]);
		expect(report.instances).toBeGreaterThan(10);
		expect(screen).toMatchObject({
			name: "Sperrmüll anmelden",
			width: 1440,
			layoutMode: "VERTICAL",
		});
		expect(screen.modes).toEqual({
			"02_Device": "Desktop",
			"04_Level": "Level-0",
		});
		expect(figma.currentPage.children.map((n) => n.name)).toEqual([
			"Sperrmüll anmelden",
			"Sperrmüll anmelden / slots",
		]);
	});

	it("sets texts, variants, nested instances and icon swaps", async () => {
		const { screen, figma } = await build(await html("render_page", PAGE));

		const [field] = instancesOf(screen, "input-text");
		const form = field?.findOne((node) => node.name === "form") as FakeInstance;
		expect(form.text("label")).toBe("Name");
		expect(form.text("hint")).toBe("Wie im Ausweis");
		expect(form.boolean("hint")).toBe(true);

		const [radios] = instancesOf(screen, "input-radios");
		const items = radios?.findAll((node) =>
			node.name.endsWith(" input"),
		) as FakeInstance[];
		expect(items.map((item) => [item.visible, item.text("label")])).toEqual([
			[true, "Vormittag"],
			[true, "Nachmittag"],
			[false, ""],
			[false, ""],
			[false, ""],
		]);

		const [button] = instancesOf(screen, "button-secondary");
		expect(button?.text("label")).toBe("Weiter");
		expect(button?.variant("icon")).toBe("right");
		const icon = button?.swappedIn("icon-type");
		expect(icon?.name).toBe(figma.kit.get("icon-arrow_forward-default")?.name);
	});

	it("builds slot content as a component and swaps it into the slot", async () => {
		const { screen, report, figma } = await build(
			await html("render_page", PAGE),
		);

		const [row] = instancesOf(screen, "row");
		const first = row?.swappedIn("placeholder-1");
		expect(first).toBeInstanceOf(FakeComponent);
		expect(first?.width).toBe(280);
		const [card] = instancesOf(first as FakeNode, "card-default");
		expect(card?.text("title")).toBe("Wohngeld");
		expect(card?.boolean("content-slot")).toBe(true);
		const body = card?.swappedIn("component");
		expect(instancesOf(body as FakeNode, "body-default")[0]?.text("body")).toBe(
			"Zuschuss zur Miete.",
		);

		const slots = figma.nodes.get(report.slotsId ?? "") as FakeNode;
		expect(slots.children.every((node) => node.type === "COMPONENT")).toBe(
			true,
		);
		expect(slots.children.map((node) => node.name)).toContain(
			"row / placeholder-1",
		);
	});

	it("binds spacing to the Foundations' variables", async () => {
		const { screen } = await build(await html("render_page", PAGE));

		const main = screen.findOne((node) => node.name === "main") as FakeNode;
		expect(main.bound).toMatchObject({
			itemSpacing: "metric/space/large",
			paddingLeft: "metric/grid/page-margin",
			paddingRight: "metric/grid/page-margin",
		});
		expect(main.itemSpacing).toBe(24);
		expect(main.layoutSizingHorizontal).toBe("FILL");
	});

	it("uses KERN's values when the Foundations aren't linked", async () => {
		const { screen, report } = await build(await html("render_page", PAGE), {
			linked: false,
		});

		expect(report.errors).toEqual([]);
		expect(report.warnings).toEqual([
			"The KERN 2 Foundations aren't linked to this file: spacing and backgrounds use KERN's values, unbound.",
		]);
		const main = screen.findOne((node) => node.name === "main") as FakeNode;
		expect(main).toMatchObject({ itemSpacing: 24, paddingLeft: 32, bound: {} });
	});

	it("draws a placeholder for a component without a key", async () => {
		const { report, screen } = await build(await html("render_page", PAGE), {
			without: ["kopfzeile"],
		});

		expect(report.missing).toEqual(["kopfzeile"]);
		expect(report.errors).toEqual([]);
		expect(screen.children[0]?.name).toBe("missing: kopfzeile");
	});

	it("reports a key that matches no component, and goes on", async () => {
		const figma = new FakeFigma();
		const { plan, components } = planFigmaDesign(
			'<span class="kern-badge kern-badge--info"><span class="kern-label">Neu</span></span><p class="kern-body">Text</p>',
		);
		const [first = ""] = figmaScripts(plan, components);
		const script = withKeys(first, figma).replace(
			`"key-badge"`,
			`"key-unknown"`,
		);

		const report = await runFigmaScript(script, figma);

		expect(report.errors).toEqual([
			"badge: no component with the key key-unknown (No component with the key key-unknown)",
		]);
		expect(report.instances).toBe(1);
	});

	it("replaces the screen of the same name when it runs again", async () => {
		const markup = await html("render_page", PAGE);
		const { figma } = await build(markup);
		await build(markup, { figma });

		expect(figma.currentPage.children.map((n) => n.name)).toEqual([
			"Sperrmüll anmelden",
			"Sperrmüll anmelden / slots",
		]);
	});

	it("sets a KERN level's mode and its contextual background", async () => {
		const { screen, report } = await build(
			'<div class="kern-layer kern-level-1"><p class="kern-body">Auf Ebene 1</p></div>',
		);

		expect(report.errors).toEqual([]);
		const layer = screen.children[0] as FakeNode;
		expect(layer.modes).toEqual({ "04_Level": "Level-1" });
		expect(layer.fills).toEqual([
			expect.objectContaining({
				boundVariables: {
					color: {
						type: "VARIABLE_ALIAS",
						id: "VariableID:color/layout/background/default-contextual",
					},
				},
			}),
		]);
	});

	const samples = tools.flatMap((tool) => {
		const examples = TOOL_EXAMPLES[tool.name];
		if (examples)
			return examples.map((example) => [tool.name, example.input] as const);
		return tool.description.includes("KERN's example HTML")
			? [[tool.name, {}] as const]
			: [];
	});

	it.each(samples)(
		"builds %s's example without an error",
		async (tool, input) => {
			const { report } = await build(await html(tool, { ...input }));

			expect(report.errors).toEqual([]);
			expect(report.missing).toEqual([]);
		},
	);
});

describe("a plan too big for one use_figma call", () => {
	it("fits a page in one script", async () => {
		const { scripts } = await build(await html("render_page", PAGE));

		expect(scripts).toHaveLength(1);
		expect(scripts[0]?.length).toBeLessThan(USE_FIGMA_MAX_LENGTH);
	});

	it("splits it into parts that build the same screen, in order", async () => {
		const markup = await html("render_page", PAGE);
		const whole = await build(markup);
		const runtimeOnly =
			figmaScripts(
				{ ...planFigmaDesign("").plan, children: [] },
				planFigmaDesign(markup).components,
			)[0]?.length ?? 0;
		const split = await build(markup, { maxLength: runtimeOnly + 1_500 });

		expect(split.scripts.length).toBeGreaterThan(2);
		for (const script of split.scripts) {
			expect(script.length).toBeLessThanOrEqual(runtimeOnly + 1_500);
		}
		expect(split.scripts[1]).toContain("Part 2 of");
		expect(split.report.errors).toEqual([]);
		expect(split.report.instances).toBe(whole.report.instances);
		expect(outline(split.screen)).toEqual(outline(whole.screen));
	});

	it("refuses a later part run before the first", async () => {
		const markup = await html("render_page", PAGE);
		const { plan, components } = planFigmaDesign(markup);
		const runtimeOnly =
			figmaScripts({ ...plan, children: [] }, components)[0]?.length ?? 0;
		const [, second = ""] = figmaScripts(plan, components, runtimeOnly + 1_500);
		const figma = new FakeFigma();

		const report = await runFigmaScript(withKeys(second, figma), figma);

		expect(report.errors).toEqual([
			expect.stringMatching(
				/^Part 2 of \d+: run the parts in order, the first one first\.$/,
			),
		]);
	});
});
