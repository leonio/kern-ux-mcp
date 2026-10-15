import { KIT_COMPONENTS, type KitComponent } from "../ux/figma/kit.js";

/**
 * A fake of the parts of Figma's Plugin API the Figma script uses, with a kit
 * built from KIT_COMPONENTS: every component, its variants and properties,
 * and the nested layers a plan sets. It throws where Figma throws on the
 * mistakes that matter: a child appended to an instance, FILL outside auto
 * layout, text set with its font unloaded, an unknown property or variant
 * value, and a swap to something that isn't a component.
 */

type Font = { family: string; style: string };
type PropertyType = "VARIANT" | "TEXT" | "BOOLEAN" | "INSTANCE_SWAP";
type Definition = {
	type: PropertyType;
	defaultValue: string | boolean;
	variantOptions?: string[];
};
type Variable = {
	id: string;
	key: string;
	name: string;
	variableCollectionId: string;
};
type Collection = {
	id: string;
	key: string;
	name: string;
	modes: Array<{ modeId: string; name: string }>;
};

/** How the kit numbers repeated layers: "➀ input", "⑥ input". */
const NUMBERS = ["➀", "➁", "➂", "➃", "➄", "⑥", "⑦", "⑧", "⑨", "⑩"];
const KIT_FONT: Font = { family: "Fira Sans", style: "Regular" };

let ids = 0;

export class FakeNode {
	readonly id = `${++ids}:1`;
	name = "";
	parent: FakeNode | null = null;
	children: FakeNode[] = [];
	visible = true;
	x = 0;
	y = 0;
	width = 300;
	height = 40;
	fills: unknown[] = [];
	strokes: unknown[] = [];
	dashPattern: number[] = [];
	clipsContent = false;
	layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL" = "NONE";
	primaryAxisSizingMode = "AUTO";
	counterAxisSizingMode = "AUTO";
	primaryAxisAlignItems = "MIN";
	layoutWrap = "NO_WRAP";
	itemSpacing = 0;
	counterAxisSpacing = 0;
	paddingLeft = 0;
	paddingRight = 0;
	paddingTop = 0;
	paddingBottom = 0;
	/** Field → the name of the variable bound to it. */
	bound: Record<string, string> = {};
	/** Collection name → the mode set on the node. */
	modes: Record<string, string> = {};
	componentPropertyReferences: {
		characters?: string;
		mainComponent?: string;
	} | null = null;
	private sizing = "HUG";

	constructor(
		readonly type: string,
		protected readonly fake: FakeFigma,
	) {
		fake.nodes.set(this.id, this);
	}

	get layoutSizingHorizontal(): string {
		return this.sizing;
	}

	set layoutSizingHorizontal(value: string) {
		if (value === "FILL" && (this.parent?.layoutMode ?? "NONE") === "NONE") {
			throw new Error(
				"in set_layoutSizingHorizontal: FILL can only be set on children of auto-layout frames",
			);
		}
		this.sizing = value;
	}

	appendChild(node: FakeNode): void {
		if (this.type === "INSTANCE") {
			throw new Error("Cannot move node. New parent is an instance");
		}
		node.remove();
		node.parent = this;
		this.children.push(node);
	}

	remove(): void {
		if (!this.parent) return;
		this.parent.children = this.parent.children.filter((c) => c !== this);
		this.parent = null;
	}

	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		this.primaryAxisSizingMode = "FIXED";
		this.counterAxisSizingMode = "FIXED";
	}

	findAll(predicate: (node: FakeNode) => boolean): FakeNode[] {
		const found: FakeNode[] = [];
		const walk = (node: FakeNode) => {
			for (const c of node.children) {
				if (predicate(c)) found.push(c);
				walk(c);
			}
		};
		walk(this);
		return found;
	}

	findOne(predicate: (node: FakeNode) => boolean): FakeNode | null {
		return this.findAll(predicate)[0] ?? null;
	}

	findAllWithCriteria({ types }: { types: string[] }): FakeNode[] {
		return this.findAll((node) => types.includes(node.type));
	}

	setBoundVariable(field: string, variable: Variable): void {
		if (!(field in this)) throw new Error(`No field ${field} to bind.`);
		this.bound[field] = variable.name;
	}

	setExplicitVariableModeForCollection(
		collection: Collection,
		modeId: string,
	): void {
		this.modes[collection.name] =
			collection.modes.find((mode) => mode.modeId === modeId)?.name ?? modeId;
	}
}

export class FakeText extends FakeNode {
	fontName: Font = KIT_FONT;
	private value = "";

	constructor(fake: FakeFigma) {
		super("TEXT", fake);
	}

	get characters(): string {
		return this.value;
	}

	set characters(value: string) {
		this.fake.assertFontLoaded(this.fontName);
		this.value = value;
	}

	getRangeAllFontNames(): Font[] {
		return [this.fontName];
	}
}

export class FakeComponent extends FakeNode {
	variantProperties: Record<string, string> | null = null;
	/** On a component set, and on a component outside one. */
	componentPropertyDefinitions: Record<string, Definition> = {};
	/** The kit component it was made from; undefined for a slot. */
	kitName?: string;

	constructor(
		type: "COMPONENT" | "COMPONENT_SET",
		fake: FakeFigma,
		kitName?: string,
	) {
		super(type, fake);
		this.kitName = kitName;
	}

	get defaultVariant(): FakeComponent {
		const first = this.children[0];
		if (!(first instanceof FakeComponent)) throw new Error("No variants.");
		return first;
	}

	createInstance(): FakeInstance {
		if (this.type !== "COMPONENT") {
			throw new Error("createInstance works on a component, not a set");
		}
		return new FakeInstance(this.fake, this);
	}
}

export class FakeInstance extends FakeNode {
	/** Swap property key → the ID of the component swapped in. */
	swapped: Record<string, string> = {};
	booleans: Record<string, boolean> = {};

	constructor(
		fake: FakeFigma,
		private main: FakeComponent,
	) {
		super("INSTANCE", fake);
		this.name =
			main.parent?.type === "COMPONENT_SET" ? main.parent.name : main.name;
		this.children = fake.layersOf(main, this);
	}

	async getMainComponentAsync(): Promise<FakeComponent> {
		return this.main;
	}

	private get definitions(): Record<string, Definition> {
		const owner =
			this.main.parent instanceof FakeComponent &&
			this.main.parent.type === "COMPONENT_SET"
				? this.main.parent
				: this.main;
		return owner.componentPropertyDefinitions;
	}

	get componentProperties(): Record<
		string,
		{ type: PropertyType; value: string | boolean }
	> {
		return Object.fromEntries(
			Object.entries(this.definitions).map(([key, definition]) => [
				key,
				{
					type: definition.type,
					value:
						definition.type === "VARIANT"
							? (this.main.variantProperties?.[key] ?? "")
							: definition.defaultValue,
				},
			]),
		);
	}

	setProperties(values: Record<string, string | boolean>): void {
		const definitions = this.definitions;
		const variant = { ...this.main.variantProperties };
		for (const [key, value] of Object.entries(values)) {
			const definition = definitions[key];
			if (!definition) {
				throw new Error(
					`Could not find a component property with name: '${key}'`,
				);
			}
			if (definition.type === "VARIANT") {
				if (!definition.variantOptions?.includes(String(value))) {
					throw new Error(`'${value}' isn't a value of ${key}`);
				}
				variant[key] = String(value);
			} else if (definition.type === "BOOLEAN") {
				if (typeof value !== "boolean")
					throw new Error(`${key} takes a boolean`);
				this.booleans[key] = value;
			} else if (definition.type === "INSTANCE_SWAP") {
				const target = this.fake.nodes.get(String(value));
				if (target?.type !== "COMPONENT") {
					throw new Error(`${key} takes the ID of a component, not ${value}`);
				}
				this.swapped[key] = String(value);
			} else {
				const text = this.findOne(
					(node) => node.componentPropertyReferences?.characters === key,
				);
				if (!(text instanceof FakeText)) throw new Error(`No text for ${key}`);
				text.characters = String(value);
			}
		}
		if (this.main.variantProperties) {
			const set = this.main.parent;
			const match = set?.children.find(
				(c) =>
					c instanceof FakeComponent &&
					Object.entries(variant).every(
						([axis, option]) => c.variantProperties?.[axis] === option,
					),
			);
			if (!(match instanceof FakeComponent)) {
				throw new Error(`No variant ${JSON.stringify(variant)}`);
			}
			this.main = match;
		}
	}

	/** The text of a text property, by its name in a plan. */
	text(name: string): string | undefined {
		const text = this.findOne(
			(node) =>
				node instanceof FakeText && node.name === name && node.parent === this,
		);
		return text instanceof FakeText ? text.characters : undefined;
	}

	/** The value of a variant axis. */
	variant(axis: string): string | undefined {
		return this.main.variantProperties?.[axis];
	}

	/** The component swapped into a property, by its name in a plan. */
	swappedIn(name: string): FakeComponent | undefined {
		const key = Object.keys(this.swapped).find(
			(candidate) =>
				candidate.replace(/#.*$/, "").replace(/^[^a-z]+/i, "") === name,
		);
		const node = key ? this.fake.nodes.get(this.swapped[key] ?? "") : undefined;
		return node instanceof FakeComponent ? node : undefined;
	}

	/** The value of a boolean property, by its name in a plan. */
	boolean(name: string): boolean | undefined {
		const key = Object.keys(this.booleans).find(
			(candidate) => candidate.replace(/#.*$/, "") === name,
		);
		return key ? this.booleans[key] : undefined;
	}
}

/** The property keys the fake kit gives a component, as Figma spells them. */
function propertyKeys(spec: KitComponent, index: number) {
	return {
		texts: (spec.texts ?? []).map(
			(name) => [name, `✏️ ${name}#${index}:1`] as const,
		),
		booleans: (spec.booleans ?? []).map(
			(name) => [name, `${name}#${index}:2`] as const,
		),
		swaps: (spec.swaps ?? []).map(
			(name) => [name, `↳ ${name}#${index}:3`] as const,
		),
	};
}

function cartesian(
	axes: Readonly<Record<string, readonly string[]>>,
): Array<Record<string, string>> {
	return Object.entries(axes).reduce<Array<Record<string, string>>>(
		(combinations, [axis, options]) =>
			combinations.flatMap((combination) =>
				options.map((option) => ({ ...combination, [axis]: option })),
			),
		[{}],
	);
}

export class FakeFigma {
	readonly mixed = Symbol("mixed");
	readonly nodes = new Map<string, FakeNode>();
	readonly currentPage: FakeNode;
	readonly loadedFonts = new Set<string>();
	/** Kit component name → its set, or the component outside a set. */
	readonly kit = new Map<string, FakeComponent>();
	readonly variables;
	readonly teamLibrary;
	private readonly libraryVariables: Variable[] = [];
	private readonly collections: Collection[] = [];

	constructor(options: { linked?: boolean } = {}) {
		this.currentPage = new FakeNode("PAGE", this);
		Object.entries(KIT_COMPONENTS).forEach(([name, spec], index) => {
			this.kit.set(name, this.makeKitComponent(name, spec, index + 1));
		});

		const collection = (name: string, modes: string[]): Collection => {
			const created = {
				id: `VariableCollectionId:${name}`,
				key: `collection-${name}`,
				name,
				modes: modes.map((mode, index) => ({
					modeId: `${name}:${index}`,
					name: mode,
				})),
			};
			this.collections.push(created);
			return created;
		};
		const device = collection("02_Device", ["Mobile", "Desktop"]);
		const level = collection("04_Level", ["Level-0", "Level-1", "Level-2"]);
		const add = (owner: Collection, name: string) =>
			this.libraryVariables.push({
				id: `VariableID:${name}`,
				key: `variable-${name}`,
				name,
				variableCollectionId: owner.id,
			});
		for (const space of [
			"none",
			"2x-small",
			"x-small",
			"small",
			"default",
			"large",
			"x-large",
		]) {
			add(device, `metric/space/${space}`);
		}
		add(device, "metric/grid/page-margin");
		add(level, "color/layout/background/default-contextual");

		const linked = options.linked ?? true;
		this.teamLibrary = {
			getAvailableLibraryVariableCollectionsAsync: async () =>
				linked ? this.collections.map(({ key, name }) => ({ key, name })) : [],
			getVariablesInLibraryCollectionAsync: async (key: string) => {
				const owner = this.collections.find((c) => c.key === key);
				return this.libraryVariables
					.filter((v) => v.variableCollectionId === owner?.id)
					.map(({ key: variableKey, name }) => ({ key: variableKey, name }));
			},
		};
		this.variables = {
			getLocalVariablesAsync: async () => [] as Variable[],
			importVariableByKeyAsync: async (key: string) => {
				const found = this.libraryVariables.find((v) => v.key === key);
				if (!found) throw new Error(`No variable ${key}`);
				return found;
			},
			getVariableCollectionByIdAsync: async (id: string) =>
				this.collections.find((c) => c.id === id) ?? null,
			setBoundVariableForPaint: (
				paint: Record<string, unknown>,
				field: string,
				variable: Variable,
			) => ({
				...paint,
				boundVariables: {
					[field]: { type: "VARIABLE_ALIAS", id: variable.id },
				},
			}),
		};
	}

	/** The key search_design_system would return for a kit component. */
	keyOf(name: string): string {
		return `key-${name}`;
	}

	createFrame(): FakeNode {
		const frame = new FakeNode("FRAME", this);
		this.currentPage.appendChild(frame);
		return frame;
	}

	createText(): FakeText {
		const text = new FakeText(this);
		this.currentPage.appendChild(text);
		return text;
	}

	createComponentFromNode(node: FakeNode): FakeComponent {
		const component = new FakeComponent("COMPONENT", this);
		component.name = node.name;
		component.width = node.width;
		component.layoutMode = node.layoutMode;
		const parent = node.parent;
		if (parent) {
			const index = parent.children.indexOf(node);
			parent.children.splice(index, 1, component);
			component.parent = parent;
			node.parent = null;
		}
		for (const c of [...node.children]) component.appendChild(c);
		return component;
	}

	async importComponentSetByKeyAsync(key: string): Promise<FakeComponent> {
		const found = this.byKey(key);
		if (found?.type !== "COMPONENT_SET") {
			throw new Error(`No component set with the key ${key}`);
		}
		return found;
	}

	async importComponentByKeyAsync(key: string): Promise<FakeComponent> {
		const found = this.byKey(key);
		if (found?.type !== "COMPONENT") {
			throw new Error(`No component with the key ${key}`);
		}
		return found;
	}

	async loadFontAsync(font: Font): Promise<void> {
		this.loadedFonts.add(`${font.family}|${font.style}`);
	}

	assertFontLoaded(font: Font): void {
		if (!this.loadedFonts.has(`${font.family}|${font.style}`)) {
			throw new Error(
				`Cannot write to node with unloaded font "${font.family} ${font.style}"`,
			);
		}
	}

	/** The children an instance of a kit component starts with. */
	layersOf(main: FakeComponent, instance: FakeInstance): FakeNode[] {
		const owner =
			main.parent instanceof FakeComponent &&
			main.parent.type === "COMPONENT_SET"
				? main.parent
				: main;
		const spec = owner.kitName ? KIT_COMPONENTS[owner.kitName] : undefined;
		if (!spec) {
			return main.children.map(() => new FakeNode("FRAME", this));
		}
		const layers: FakeNode[] = [];
		for (const [key, definition] of Object.entries(
			owner.componentPropertyDefinitions,
		)) {
			if (definition.type === "TEXT") {
				const text = new FakeText(this);
				text.name = key.replace(/^✏️ /, "").replace(/#.*$/, "");
				text.componentPropertyReferences = { characters: key };
				layers.push(text);
			}
			if (definition.type === "INSTANCE_SWAP") {
				const placeholder = new FakeNode("INSTANCE", this);
				placeholder.name = "placeholder";
				placeholder.width = 280;
				placeholder.componentPropertyReferences = { mainComponent: key };
				layers.push(placeholder);
			}
		}
		for (const { layer, component, count = 1 } of spec.layers ?? []) {
			const nested = this.kit.get(component);
			if (!nested) throw new Error(`The fake kit has no ${component}.`);
			for (let index = 0; index < count; index++) {
				const child = (
					nested.type === "COMPONENT_SET" ? nested.defaultVariant : nested
				).createInstance();
				child.name = count > 1 ? `${NUMBERS[index]} ${layer}` : layer;
				layers.push(child);
			}
		}
		for (const layer of layers) layer.parent = instance;
		return layers;
	}

	private byKey(key: string): FakeComponent | undefined {
		const name = key.replace(/^key-/, "");
		return key.startsWith("key-") ? this.kit.get(name) : undefined;
	}

	private makeKitComponent(
		name: string,
		spec: KitComponent,
		index: number,
	): FakeComponent {
		const keys = propertyKeys(spec, index);
		const definitions: Record<string, Definition> = {};
		for (const [, key] of keys.texts) {
			definitions[key] = { type: "TEXT", defaultValue: "Text" };
		}
		for (const [, key] of keys.booleans) {
			definitions[key] = { type: "BOOLEAN", defaultValue: true };
		}
		for (const [, key] of keys.swaps) {
			definitions[key] = { type: "INSTANCE_SWAP", defaultValue: "" };
		}

		if (!spec.variants) {
			const component = new FakeComponent("COMPONENT", this, name);
			component.name = name;
			component.componentPropertyDefinitions = definitions;
			return component;
		}

		const set = new FakeComponent("COMPONENT_SET", this, name);
		set.name = name;
		for (const [axis, options] of Object.entries(spec.variants)) {
			definitions[axis] = {
				type: "VARIANT",
				defaultValue: options[0] ?? "",
				variantOptions: [...options],
			};
		}
		set.componentPropertyDefinitions = definitions;
		for (const combination of cartesian(spec.variants)) {
			const variant = new FakeComponent("COMPONENT", this);
			variant.name = Object.entries(combination)
				.map(([axis, option]) => `${axis}=${option}`)
				.join(", ");
			variant.variantProperties = combination;
			set.appendChild(variant);
		}
		return set;
	}
}

/** Runs a Figma script the way use_figma does: a body with figma in scope and a returned value. */
export async function runFigmaScript(
	script: string,
	figma: FakeFigma,
): Promise<{
	screenId: string | null;
	slotsId: string | null;
	instances: number;
	missing: string[];
	warnings: string[];
	errors: string[];
}> {
	const AsyncFunction = Object.getPrototypeOf(async () => {})
		.constructor as new (
		...args: string[]
	) => (figma: FakeFigma) => Promise<never>;
	return new AsyncFunction("figma", script)(figma);
}

/** The script with every key in KEYS filled in from the fake kit. */
export function withKeys(
	script: string,
	figma: FakeFigma,
	except: readonly string[] = [],
): string {
	return script.replace(/^ {2}("[^"]+"): "",$/gm, (line, quoted: string) => {
		const name = JSON.parse(quoted) as string;
		return except.includes(name)
			? line
			: `  ${quoted}: ${JSON.stringify(figma.keyOf(name))},`;
	});
}
