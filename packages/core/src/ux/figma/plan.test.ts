import { describe, expect, it } from "vitest";

import { invokeTool } from "../../invoke.js";
import { getCatalog } from "../../mcp/catalog.js";
import { TOOL_EXAMPLES } from "../tool-examples.js";
import { KIT_COMPONENTS, type KitComponent, optionKey } from "./kit.js";
import {
	type InstanceProps,
	type NestedInstance,
	type PlanInstance,
	type PlanNode,
	planFigmaDesign,
} from "./plan.js";

/** Every instance in a plan, slots included. */
function instances(nodes: readonly PlanNode[]): PlanInstance[] {
	return nodes.flatMap((node) =>
		node.type === "frame"
			? instances(node.children)
			: [node, ...instances(Object.values(node.slots ?? {}).flat())],
	);
}

/** What in a plan the kit doesn't have: components, properties, values, layers. */
function kitProblems(nodes: readonly PlanNode[]): string[] {
	const problems: string[] = [];

	const check = (
		props: InstanceProps,
		spec: KitComponent,
		where: string,
	): void => {
		for (const [axis, value] of Object.entries(props.variants ?? {})) {
			const options = spec.variants?.[axis];
			if (!options) problems.push(`${where}: no variant ${axis}`);
			else if (!options.some((o) => optionKey(o) === optionKey(value))) {
				problems.push(`${where}: ${axis} has no value ${value}`);
			}
		}
		for (const name of Object.keys(props.texts ?? {})) {
			if (!spec.texts?.includes(name))
				problems.push(`${where}: no text ${name}`);
		}
		for (const name of Object.keys(props.booleans ?? {})) {
			if (!spec.booleans?.includes(name)) {
				problems.push(`${where}: no boolean ${name}`);
			}
		}
		for (const [name, target] of Object.entries(props.swaps ?? {})) {
			if (!spec.swaps?.includes(name))
				problems.push(`${where}: no swap ${name}`);
			if (!KIT_COMPONENTS[target])
				problems.push(`${where}: no component ${target}`);
		}
		for (const nested of props.nested ?? []) checkNested(nested, spec, where);
	};

	const checkNested = (
		nested: NestedInstance,
		owner: KitComponent,
		where: string,
	): void => {
		const layer = owner.layers?.find((l) => l.layer === nested.layer);
		const inner = `${where} > ${nested.layer}`;
		if (!layer) {
			problems.push(`${inner}: no such layer`);
			return;
		}
		if (layer.component !== nested.component) {
			problems.push(`${inner}: is ${layer.component}, not ${nested.component}`);
		}
		const spec = KIT_COMPONENTS[layer.component] ?? {};
		check(nested, spec, inner);
		for (const item of nested.items ?? []) check(item, spec, `${inner}[]`);
	};

	for (const node of instances(nodes)) {
		const spec = KIT_COMPONENTS[node.component];
		if (!spec) {
			problems.push(`no kit component ${node.component}`);
			continue;
		}
		check(node, spec, node.component);
		for (const slot of Object.keys(node.slots ?? {})) {
			if (!spec.swaps?.includes(slot)) {
				problems.push(`${node.component}: no slot ${slot}`);
			}
		}
	}
	return problems;
}

const { tools } = getCatalog();

async function html(tool: string, input: Record<string, unknown>) {
	const found = tools.find((t) => t.name === tool);
	if (!found) throw new Error(`No tool ${tool}`);
	return ((await invokeTool(found, input)) as { html: string }).html;
}

function only(nodes: readonly PlanNode[]): PlanInstance {
	const [first, ...rest] = instances(nodes);
	if (!first || rest.length > 0) {
		throw new Error(`Expected one instance, got ${instances(nodes).length}.`);
	}
	return first;
}

describe("planFigmaDesign against the kit", () => {
	const samples = tools.flatMap((tool) => {
		const examples = TOOL_EXAMPLES[tool.name];
		if (examples)
			return examples.map((example) => [tool.name, example.input] as const);
		// The tools with KERN's example HTML take no input.
		return tool.description.includes("KERN's example HTML")
			? [[tool.name, {}] as const]
			: [];
	});

	it.each(samples)(
		"plans %s only with what the kit has",
		async (tool, input) => {
			const result = planFigmaDesign(await html(tool, input));

			expect(kitProblems(result.plan.children)).toEqual([]);
			for (const component of result.components) {
				expect(KIT_COMPONENTS, component).toHaveProperty([component]);
			}
		},
	);
});

describe("planFigmaDesign", () => {
	it("plans a page: Kopfzeile, header, main and footer, named after its h1", async () => {
		const page = await html("render_page", {
			kopfzeile: true,
			header: {
				title: "Bürgerservice",
				navigation: [{ label: "Start", href: "/" }],
			},
			heading: "Sperrmüll anmelden",
			contentBlocks: [{ kind: "text", text: "Hallo" }],
			footer: { note: "© Musterstadt" },
		});

		const { plan } = planFigmaDesign(page);

		expect(plan).toMatchObject({
			name: "Sperrmüll anmelden",
			page: true,
			width: 1440,
		});
		expect(
			plan.children.map((n) => (n.type === "frame" ? n.name : n.component)),
		).toEqual(["kopfzeile", "header", "main", "footer"]);
		const main = plan.children[2];
		expect(main).toMatchObject({ padding: { x: "page-margin" }, gap: "large" });
	});

	it("leaves out the skip link, hidden steps and screen-reader text", () => {
		const { plan } = planFigmaDesign(
			'<a class="kern-link" href="#main">Zum Inhalt</a><div hidden><p class="kern-body">Schritt 2</p></div><span class="kern-sr-only">nur vorgelesen</span><p class="kern-body">Sichtbar</p>',
		);

		expect(plan.children).toEqual([
			expect.objectContaining({
				component: "body-default",
				texts: { body: "Sichtbar" },
			}),
		]);
		expect(plan.page).toBe(false);
	});

	it("takes the name and device it's given", () => {
		const { plan } = planFigmaDesign('<p class="kern-body">x</p>', {
			name: " Start ",
			device: "mobile",
		});

		expect(plan).toMatchObject({ name: "Start", device: "mobile", width: 360 });
	});

	it("maps a button's variant, size, state and icon", async () => {
		const plan = (input: Record<string, unknown>) =>
			html("get_button", { label: "Weiter", ...input }).then((markup) =>
				only(planFigmaDesign(markup).plan.children),
			);

		expect(await plan({ variant: "secondary", size: "small" })).toMatchObject({
			component: "button-secondary-small",
			variants: { state: "default", icon: "none" },
			texts: { label: "Weiter" },
		});
		expect(
			await plan({ icon: { name: "arrow-forward", position: "right" } }),
		).toMatchObject({
			component: "button-primary",
			variants: { icon: "right" },
			swaps: { "icon-type": "icon-arrow_forward-default" },
		});
		expect(
			await plan({
				size: "large",
				icon: { name: "edit", position: "left" },
				labelVisibility: "sr-only",
			}),
		).toMatchObject({
			component: "button-primary-large",
			variants: { icon: "only" },
			swaps: { "icon-type": "icon-edit-large" },
		});
		expect(await plan({ disabled: true })).toMatchObject({
			variants: { state: "disabled" },
		});
	});

	it("keeps a button's own icon when the kit has no such icon", () => {
		const result = planFigmaDesign(
			'<button class="kern-btn kern-btn--primary"><span class="kern-label">Abmelden</span><span class="kern-icon kern-icon--logout" aria-hidden="true"></span></button>',
		);

		expect(only(result.plan.children).swaps).toEqual({});
		expect(result.warnings).toEqual([
			"The kit has no icon logout: the component's own icon stays.",
		]);
	});

	it("maps each field type to its input component, with label, hint and error", async () => {
		const field = (field: Record<string, unknown>) =>
			html("render_composition", {
				contentBlocks: [
					{ kind: "field", field: { name: "f", label: "Feld", ...field } },
				],
			}).then((markup) => only(planFigmaDesign(markup).plan.children));

		const types: Array<[string, string]> = [
			["text", "input-text"],
			["email", "input-e-mail"],
			["tel", "input-tel"],
			["url", "input-url"],
			["number", "input-number"],
			["date", "input-text"],
			["password", "input-password"],
			["textarea", "input-textarea"],
		];
		for (const [type, component] of types) {
			expect((await field({ type })).component, type).toBe(component);
		}
		expect(
			(await field({ type: "select", options: [{ value: "a", label: "A" }] }))
				.component,
		).toBe("input-select");

		expect(
			await field({
				type: "text",
				hint: "Wie im Ausweis",
				error: "Fehlt.",
				optional: true,
			}),
		).toMatchObject({
			variants: { error: "true" },
			nested: [
				{
					layer: "form",
					texts: { label: "Feld", hint: "Wie im Ausweis", error: "Fehlt." },
					booleans: { hint: true, optional: true },
				},
			],
		});
	});

	it("maps radios and checkboxes to the kit's groups, one item per option", async () => {
		const group = (type: string, count: number) =>
			html("render_composition", {
				contentBlocks: [
					{
						kind: "field",
						field: {
							type,
							name: "g",
							label: "Wahl",
							options: Array.from({ length: count }, (_, i) => ({
								value: String(i),
								label: `Option ${i + 1}`,
							})),
						},
					},
				],
			}).then((markup) => planFigmaDesign(markup));

		const radios = await group("radio", 2);
		expect(only(radios.plan.children)).toMatchObject({
			component: "input-radios",
			texts: { legend: "Wahl" },
			nested: [
				{
					layer: "input",
					component: "base-radio",
					items: [
						{ texts: { label: "Option 1" } },
						{ texts: { label: "Option 2" } },
					],
				},
			],
		});

		const checkboxes = await group("checkbox", 8);
		expect(only(checkboxes.plan.children).component).toBe("input-checkboxes");
		expect(checkboxes.warnings).toEqual([
			'input-checkboxes "Wahl" has 8 options; the kit shows 7.',
		]);
	});

	it("puts a fieldset's fields into its slot", async () => {
		const markup = await html("render_composition", {
			contentBlocks: [
				{
					kind: "fieldset",
					fieldset: {
						legend: "Anschrift",
						contentBlocks: [
							{
								kind: "field",
								field: { type: "text", name: "s", label: "Straße" },
							},
						],
					},
				},
			],
		});

		const [fieldset] = planFigmaDesign(markup).plan.children;
		expect(fieldset).toMatchObject({
			component: "fieldset",
			texts: { legend: "Anschrift" },
			slots: {
				component: [expect.objectContaining({ component: "input-text" })],
			},
		});
	});

	it("maps cards: size, interactive, header texts, body slot and action bar", async () => {
		const markup = await html("render_composition", {
			contentBlocks: [
				{
					kind: "grid",
					grid: {
						columnsContent: [
							[
								{
									kind: "card",
									card: {
										size: "large",
										header: {
											preline: "Service",
											title: "Wohngeld",
											subline: "Zuschuss",
										},
										body: "Zuschuss zur Miete.",
										footer: {
											primaryLabel: "Beantragen",
											secondaryLabel: "Mehr",
										},
									},
								},
							],
							[
								{
									kind: "card",
									card: {
										header: { title: "Elterngeld", href: "/elterngeld" },
									},
								},
							],
						],
					},
				},
			],
		});

		const [row, large, body, interactive] = instances(
			planFigmaDesign(markup).plan.children,
		);
		expect(row).toMatchObject({
			component: "row",
			variants: { layout: "6-6", device: "desktop" },
		});
		expect(body).toMatchObject({ component: "body-default" });
		expect(large).toMatchObject({
			component: "card-large",
			texts: { preline: "Service", title: "Wohngeld", subline: "Zuschuss" },
			booleans: {
				preline: true,
				subline: true,
				"content-slot": true,
				"action bar": true,
			},
			nested: [
				{
					layer: "card-actions",
					component: "card-actions-large",
					variants: { "number of buttons": "2" },
					nested: [
						{ layer: "button-primary", texts: { label: "Beantragen" } },
						{ layer: "button-secondary", texts: { label: "Mehr" } },
					],
				},
			],
			slots: {
				component: [expect.objectContaining({ component: "body-default" })],
			},
		});
		expect(interactive).toMatchObject({
			component: "card-default-interactive",
			texts: { title: "Elterngeld" },
			booleans: { "content-slot": false },
		});
	});

	it("lays out grids on the kit's row, and wider ones as frames", () => {
		const grid = (classes: string, items: number, itemClass = "") =>
			planFigmaDesign(
				`<div class="kern-grid ${classes}">${Array.from(
					{ length: items },
					(_, i) =>
						`<div class="${itemClass}"><p class="kern-body">${i}</p></div>`,
				).join("")}</div>`,
			);

		expect(
			grid("kern-grid-cols-1 kern-grid-cols-3-md", 3).plan.children,
		).toEqual([
			expect.objectContaining({
				component: "row",
				variants: { layout: "3-3-3", device: "desktop" },
			}),
		]);

		const wrapped = grid("kern-grid-cols-2-md", 3).plan.children;
		expect(wrapped).toEqual([
			expect.objectContaining({
				type: "frame",
				children: [
					expect.objectContaining({
						component: "row",
						variants: { layout: "6-6", device: "desktop" },
					}),
					expect.objectContaining({
						component: "row",
						slots: expect.objectContaining({ "placeholder-2": [] }),
					}),
				],
			}),
		]);

		const uneven = planFigmaDesign(
			'<div class="kern-grid kern-grid-cols-12-md"><div class="kern-col-8-md">a</div><div class="kern-col-4-md">b</div></div>',
		).plan.children;
		expect(uneven).toEqual([
			expect.objectContaining({
				component: "row",
				variants: { layout: "8-4", device: "desktop" },
			}),
		]);

		const wide = grid("kern-grid-cols-5-md", 5);
		expect(wide.plan.children[0]).toMatchObject({
			type: "frame",
			direction: "horizontal",
			wrap: true,
		});
		expect(wide.warnings).toEqual([
			"A grid of 5 columns: the kit's row has up to 4, so it's drawn as frames.",
		]);

		expect(grid("kern-grid-cols-1", 2).plan.children[0]).toMatchObject({
			type: "frame",
			name: "grid",
			direction: "vertical",
		});
	});

	it("maps an open disclosure to an expanded accordion with its content in the slot", async () => {
		const markup = await html("render_composition", {
			contentBlocks: [
				{
					kind: "disclosure",
					disclosure: {
						triggerLabel: "Mehr",
						open: true,
						contentBlocks: [{ kind: "text", text: "Details" }],
					},
				},
			],
		});

		expect(planFigmaDesign(markup).plan.children[0]).toMatchObject({
			component: "accordion",
			variants: { expanded: "true" },
			texts: { titel: "Mehr" },
			booleans: { "content-slot": true },
			slots: {
				component: [expect.objectContaining({ texts: { body: "Details" } })],
			},
		});
	});

	it("maps a form flow: its task list, progress and the current step", async () => {
		const markup = await html("render_composition", {
			contentBlocks: [
				{
					kind: "formFlow",
					formFlow: {
						currentStep: 2,
						showProgress: true,
						renderAllSteps: true,
						steps: [
							{
								label: "Person",
								contentBlocks: [
									{
										kind: "field",
										field: { type: "text", name: "a", label: "Name" },
									},
								],
							},
							{
								label: "Prüfen",
								contentBlocks: [{ kind: "text", text: "Alles richtig?" }],
							},
						],
					},
				},
			],
		});

		const result = planFigmaDesign(markup);
		const components = instances(result.plan.children).map((n) => n.component);
		expect(components).toContain("task-list");
		expect(components).toContain("progress");
		// Only the current step is visible.
		expect(components).not.toContain("input-text");

		const taskList = instances(result.plan.children).find(
			(n) => n.component === "task-list",
		);
		expect(taskList?.nested?.[1]).toMatchObject({
			layer: "task-list-item",
			items: [
				{
					variants: { type: "Erledigt" },
					nested: [expect.objectContaining({ texts: { title: "Person" } })],
				},
				expect.objectContaining({
					nested: [expect.objectContaining({ texts: { title: "Prüfen" } })],
				}),
			],
		});
		const progress = instances(result.plan.children).find(
			(n) => n.component === "progress",
		);
		expect(progress?.nested).toEqual([
			{
				layer: "progressbar",
				component: "progressbar",
				variants: { progress: "100%" },
			},
		]);
	});

	it("maps a summary group to its heading and one summary per step", async () => {
		const markup = await html("render_composition", {
			contentBlocks: [
				{
					kind: "summary",
					summary: {
						title: "Ihre Angaben",
						summaries: [
							{
								title: "Person",
								items: [{ key: "Name", value: "Muster" }],
								editHref: "#person",
							},
							{ title: "Kontakt", items: [{ key: "E-Mail", value: "a@b.de" }] },
						],
					},
				},
			],
		});

		const [group] = planFigmaDesign(markup).plan.children;
		expect(group).toMatchObject({ type: "frame", name: "summary-group" });
		const [title, person, contact] = instances([group as PlanNode]);
		expect(title).toMatchObject({ texts: { heading: "Ihre Angaben" } });
		expect(person).toMatchObject({
			component: "summary",
			texts: { title: "Person" },
			nested: expect.arrayContaining([
				{
					layer: "description-list-item",
					component: "description-list-item",
					items: [{ texts: { term: "Name", definition: "Muster" } }],
				},
				expect.objectContaining({
					layer: "link-default",
					texts: { label: expect.any(String) },
				}),
			]),
		});
		expect(contact?.nested).toContainEqual({
			layer: "link-default",
			component: "link-default",
			visible: false,
		});
	});

	it("maps a table to the kit's table, and says when it has more than the kit shows", async () => {
		const result = planFigmaDesign(
			'<div class="kern-table-responsive"><table class="kern-table kern-table--striped"><caption class="kern-table-caption">Gebühren</caption><thead><tr><th>Leistung</th><th class="kern-table__header--numeric">Preis</th></tr></thead><tbody><tr><td>Ausweis</td><td class="kern-table__cell--numeric">37 €</td></tr></tbody></table></div>',
		);

		expect(only(result.plan.children)).toMatchObject({
			component: "table-default",
			variants: { striped: "true" },
			booleans: { caption: true },
			nested: [
				{ layer: "title-default", texts: { title: "Gebühren" } },
				{
					layer: "table-head",
					nested: [
						{
							layer: "table-cell",
							items: [
								{ texts: { text: "Leistung" } },
								{
									texts: { text: "Preis" },
									variants: { "text-align": "right" },
								},
							],
						},
					],
				},
				{
					layer: "table-row",
					items: [
						{
							variants: { striped: "true" },
							nested: [
								{
									layer: "table-cell",
									items: [
										{ texts: { text: "Ausweis" } },
										{ texts: { text: "37 €" } },
									],
								},
							],
						},
					],
				},
			],
		});
		expect(result.warnings).toEqual([]);

		const wide = planFigmaDesign(
			`<table class="kern-table kern-table--small"><tbody>${"<tr><td>1</td><td>2</td><td>3</td><td>4</td></tr>".repeat(2)}</tbody></table>`,
		);
		expect(only(wide.plan.children).component).toBe("table-small");
		expect(wide.warnings).toEqual([
			"A table of 4 columns and 2 rows: the kit's table shows 3 by 3.",
		]);
	});

	it("draws what the kit doesn't have as a labelled placeholder, and lists it", () => {
		const result = planFigmaDesign(
			'<dialog class="kern-dialog"><p>Wirklich löschen?</p></dialog><div class="kern-dropdown">x</div>',
		);

		expect(result.unmapped).toEqual(["dialog", "dropdown"]);
		expect(result.plan.children[0]).toMatchObject({
			component: "placeholder",
			nested: [{ layer: "label-default", texts: { label: "dialog" } }],
		});
	});

	it("gives a KERN level its own frame and lays out flex rows", () => {
		const { plan } = planFigmaDesign(
			'<div class="kern-layer kern-level-1"><div class="kern-flex kern-justify-content-between kern-flex-wrap kern-gap-sm"><a class="kern-link" href="/a">A</a><a class="kern-link kern-link--small" href="/b"><span class="kern-icon kern-icon--arrow-forward" aria-hidden="true"></span>B</a></div></div>',
		);

		expect(plan.children[0]).toMatchObject({
			type: "frame",
			level: 1,
			children: [
				{
					type: "frame",
					direction: "horizontal",
					gap: "small",
					wrap: true,
					spaceBetween: true,
					children: [
						expect.objectContaining({
							component: "link-default",
							texts: { label: "A" },
						}),
						expect.objectContaining({
							component: "link-small",
							variants: {
								alignment: "horizontal",
								state: "default",
								icon: "left",
							},
							swaps: { "icon-type": "icon-arrow_forward-small" },
						}),
					],
				},
			],
		});
	});

	it("maps text: headings by class or level, bodies, titles, lists", () => {
		const { plan } = planFigmaDesign(
			'<h2>Ohne Klasse</h2><h3 class="kern-heading-large">Groß</h3><p class="kern-body kern-body--small kern-body--bold">Klein <a href="/x">und Link</a></p><p class="kern-title kern-title--large">Titel</p><ul class="kern-list kern-list--bullet"><li>Eins</li><li>Zwei</li></ul><ol><li>Erst</li></ol>',
		);

		expect(
			instances(plan.children).map((n) => [
				n.component,
				Object.values(n.texts ?? {})[0],
			]),
		).toEqual([
			["heading-large", "Ohne Klasse"],
			["heading-large", "Groß"],
			["body-small", "Klein und Link"],
			["title-large", "Titel"],
			["body-default", "• Eins"],
			["body-default", "• Zwei"],
			["body-default", "1. Erst"],
		]);
		expect(instances(plan.children)[2]?.variants).toEqual({ weight: "bold" });
	});
});
