/**
 * The KERN 2 Design-Kit in Figma, 2.4.0: the components a Figma plan places
 * and the properties it sets. Read from the kit on 2026-10-15, through
 * Figma's MCP server and a capture of the file (docs/figma-and-theming.md, F8
 * to F11).
 *
 * Property names are the kit's without their prefix (✏️, ↳) and their ID
 * suffix (#10307:96): the IDs differ in each team's copy of the kit, so the
 * script matches a property by name and type (propertyName below).
 */
export const FIGMA_KIT = {
	name: "KERN 2 Design-Kit",
	version: "2.4.0",
} as const;

export type KitComponent = {
	/** Variant axes with their values, spelled as in the kit. */
	variants?: Readonly<Record<string, readonly string[]>>;
	texts?: readonly string[];
	booleans?: readonly string[];
	/** Instance-swap properties: an icon, or a slot for content. */
	swaps?: readonly string[];
	/**
	 * Instances inside the component that a plan sets, by layer name without
	 * its numbering ("➀ input" is "input"), with how many the kit has.
	 */
	layers?: ReadonlyArray<{ layer: string; component: string; count?: number }>;
};

const BOOL = ["false", "true"] as const;
const BUTTON_STATES = [
	"default",
	"hover",
	"active",
	"selected",
	"disabled",
] as const;
const FEEDBACK = ["info", "success", "warning", "danger"] as const;
const LEGEND_TYPES = ["default", "large"] as const;
const CHECK_STATES = ["default", "hover", "disabled"] as const;

export const BUTTON_VARIANTS = ["primary", "secondary", "tertiary"] as const;
export const BUTTON_SIZES = [
	"x-small",
	"small",
	"default",
	"large",
	"x-large",
] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

/** The kit's name for a button: button-primary, button-primary-small, ... */
export function buttonComponent(
	variant: (typeof BUTTON_VARIANTS)[number],
	size: ButtonSize,
): string {
	return size === "default" ? `button-${variant}` : `button-${variant}-${size}`;
}

/** The size of a button's icon: the kit has small, default and large ones. */
export function buttonIconSize(size: ButtonSize): IconSize {
	if (size === "x-small" || size === "small") return "small";
	if (size === "large" || size === "x-large") return "large";
	return "default";
}

const BUTTON: KitComponent = {
	variants: { state: BUTTON_STATES, icon: ["none", "left", "right", "only"] },
	texts: ["label"],
	booleans: ["focus"],
	swaps: ["icon-type"],
};

const LINK: KitComponent = {
	variants: {
		alignment: ["vertical ↓", "horizontal  →"],
		state: ["default", "visited", "hover", "active"],
		icon: ["left", "right", "none"],
	},
	texts: ["label"],
	booleans: ["focus"],
	swaps: ["icon-type"],
};

const FIELD: KitComponent = {
	variants: { error: BOOL, "fieldset error": BOOL },
	layers: [{ layer: "form", component: "base-form" }],
};

const GROUP_TEXTS = ["legend", "hint", "error"] as const;
const GROUP_BOOLEANS = ["hint", "optional"] as const;

const CARD_TEXTS = ["preline", "title", "subline"] as const;

function card(size: "default" | "small" | "large"): KitComponent {
	return {
		variants: { surface: BOOL, stretch: BOOL },
		texts: CARD_TEXTS,
		booleans: ["preline", "subline", "media", "content-slot", "action bar"],
		swaps: ["component"],
		layers: [
			{
				layer: "card-actions",
				component: size === "default" ? "card-actions" : `card-actions-${size}`,
			},
		],
	};
}

function interactiveCard(state: readonly string[]): KitComponent {
	return {
		variants: { surface: BOOL, state },
		texts: CARD_TEXTS,
		booleans: ["preline", "subline", "media", "content-slot", "focus"],
		swaps: ["component"],
	};
}

function cardActions(size: "" | "-small" | "-large"): KitComponent {
	return {
		variants: { "number of buttons": ["2", "1"], "long label": BOOL },
		layers: [
			{ layer: "button-primary", component: `button-primary${size}` },
			{ layer: "button-secondary", component: `button-secondary${size}` },
		],
	};
}

const TABLE_SIZES = { "table-default": "", "table-small": "-small" } as const;

function table(suffix: "" | "-small"): KitComponent {
	return {
		variants: { striped: BOOL },
		booleans: ["footer", "caption", "show info layer"],
		layers: [
			{
				layer: suffix ? "title-small" : "title-default",
				component: suffix ? "title-small" : "title-default",
			},
			{ layer: `table-head${suffix}`, component: `table-head${suffix}` },
			{
				layer: `table-row${suffix}`,
				component: `table-row${suffix}`,
				count: 3,
			},
		],
	};
}

const tableRow = (suffix: "" | "-small"): KitComponent => ({
	variants: { striped: BOOL },
	layers: [
		{
			layer: `table-cell${suffix}`,
			component: `table-cell${suffix}`,
			count: 3,
		},
	],
});

const tableCell: KitComponent = {
	variants: {
		"font-weight": ["bold", "regular"],
		"text-align": ["default", "right"],
	},
	texts: ["text"],
};

/** The equal-width layouts of the kit's row, by number of columns. */
export const ROW_EQUAL_LAYOUTS: Readonly<Record<number, string>> = {
	1: "12",
	2: "6-6",
	3: "3-3-3",
	4: "4-4-4-4",
};

export const ROW_LAYOUTS = [
	"12",
	"10",
	"8",
	"6",
	"6-6",
	"7-5",
	"5-7",
	"8-4",
	"4-8",
	"9-3",
	"3-9",
	"3-3-3",
	"4-4-4-4",
] as const;

/** The row's column slots, placeholder-1 to placeholder-4. */
export const ROW_SLOTS = [
	"placeholder-1",
	"placeholder-2",
	"placeholder-3",
	"placeholder-4",
] as const;

export const PROGRESS_STEPS = [
	"0%",
	"10%",
	"20%",
	"25%",
	"30%",
	"40%",
	"50%",
	"60%",
	"70%",
	"75%",
	"80%",
	"90%",
	"100%",
] as const;

/** The task list item's status, by the badge type our task list shows. */
export const TASK_STATUS = {
	success: "Erledigt",
	warning: "Unvollständig",
	danger: "Nicht zu bearbeiten",
	info: "Kein Status",
} as const;

export const HEADING_SIZES = [
	"display",
	"x-large",
	"large",
	"medium",
	"small",
] as const;

const textComponents = (
	prefix: string,
	sizes: readonly string[],
	text: string,
	variants?: KitComponent["variants"],
): Record<string, KitComponent> =>
	Object.fromEntries(
		sizes.map((size) => [
			`${prefix}-${size}`,
			{ texts: [text], ...(variants ? { variants } : {}) },
		]),
	);

/** The kit's icons, by KERN's icon name where the kit spells it differently. */
const ICON_NAMES: Readonly<Record<string, string>> = {
	check: "done",
	danger: "emergency_home",
	help: "question_mark",
	success: "check_circle",
};

/** KERN icon names the kit has, in the kit's spelling (underscores). */
export const KIT_ICONS = [
	"account_circle",
	"add",
	"arrow_back",
	"arrow_forward",
	"autorenew",
	"calendar_today",
	"check_circle",
	"chevron_left",
	"chevron_right",
	"close",
	"content_copy",
	"dehaze",
	"delete",
	"done",
	"download",
	"draft",
	"drive_folder_upload",
	"edit",
	"emergency_home",
	"expand_less",
	"expand_more",
	"home",
	"info",
	"keyboard_double_arrow_left",
	"keyboard_double_arrow_right",
	"language",
	"local_library",
	"mail",
	"more_vert",
	"open_in_new",
	"question_mark",
	"search",
	"sign_language",
	"visibility",
	"visibility_off",
	"warning",
] as const;

export const ICON_SIZES = ["small", "default", "large", "x-large"] as const;
export type IconSize = (typeof ICON_SIZES)[number];

/** The kit's icon component for a KERN icon name, or undefined if it has none. */
export function iconComponent(
	kernName: string,
	size: IconSize,
): string | undefined {
	const name = ICON_NAMES[kernName] ?? kernName.replaceAll("-", "_");
	return (KIT_ICONS as readonly string[]).includes(name)
		? `icon-${name}-${size}`
		: undefined;
}

const ICONS: Record<string, KitComponent> = Object.fromEntries(
	KIT_ICONS.flatMap((name) =>
		ICON_SIZES.map((size) => [`icon-${name}-${size}`, {}]),
	),
);

const BUTTONS: Record<string, KitComponent> = Object.fromEntries(
	BUTTON_VARIANTS.flatMap((variant) =>
		BUTTON_SIZES.map((size) => [buttonComponent(variant, size), BUTTON]),
	),
);

/**
 * Every kit component a plan can name, with the properties it may set. The
 * tests check each plan against this list, and the fake kit they run the
 * script against is built from it.
 */
export const KIT_COMPONENTS: Readonly<Record<string, KitComponent>> = {
	...BUTTONS,
	...ICONS,
	...textComponents("heading", HEADING_SIZES, "heading"),
	...textComponents("title", ["default", "large", "small"], "title"),
	...textComponents("label", ["default", "large", "small"], "label"),
	...textComponents("preline", ["default", "large", "small"], "preline"),
	...textComponents("subline", ["default", "large", "small"], "subline"),
	...textComponents("body", ["default", "large", "small"], "body", {
		weight: ["regular", "bold"],
	}),
	accordion: {
		variants: { expanded: BOOL, disabled: BOOL },
		texts: ["titel"],
		booleans: ["focus", "content-slot"],
		swaps: ["component"],
	},
	alert: {
		variants: { type: FEEDBACK },
		texts: ["title", "description"],
		booleans: ["description", "content-slot", "text"],
		swaps: ["component"],
	},
	badge: {
		variants: { type: FEEDBACK },
		texts: ["label"],
		booleans: ["icon"],
	},
	"base-checkbox": {
		variants: { state: CHECK_STATES, selected: BOOL, focus: BOOL },
		texts: ["label"],
	},
	"base-form": {
		texts: ["label", "hint", "error"],
		booleans: ["hint", "optional"],
	},
	"base-list-item": {
		variants: { state: BUTTON_STATES },
		texts: ["title"],
		booleans: ["focus", "number"],
		layers: [
			{ layer: "number", component: "number" },
			{ layer: "badge", component: "badge" },
		],
	},
	"base-radio": {
		variants: { state: CHECK_STATES, selected: BOOL, focus: BOOL },
		texts: ["label"],
	},
	"card-default": card("default"),
	"card-small": card("small"),
	"card-large": card("large"),
	"card-default-interactive": interactiveCard(["default", "hover", "active"]),
	"card-small-interactive": interactiveCard(["default", "hover", "active"]),
	"card-large-interactive": interactiveCard(["Default", "hover", "active"]),
	"card-actions": cardActions(""),
	"card-actions-small": cardActions("-small"),
	"card-actions-large": cardActions("-large"),
	"description-list": {
		variants: { column: BOOL },
		layers: [
			{
				layer: "description-list-item",
				component: "description-list-item",
				count: 10,
			},
		],
	},
	"description-list-item": {
		variants: { column: BOOL },
		texts: ["term", "definition"],
	},
	divider: { variants: { decorative: BOOL } },
	fieldset: {
		variants: { "fieldset error": BOOL, "legend-type": LEGEND_TYPES },
		texts: GROUP_TEXTS,
		booleans: GROUP_BOOLEANS,
		swaps: ["component"],
	},
	"input-checkboxes": {
		variants: { "fieldset error": BOOL, "legend-type": LEGEND_TYPES },
		texts: GROUP_TEXTS,
		booleans: GROUP_BOOLEANS,
		layers: [{ layer: "input", component: "base-checkbox", count: 7 }],
	},
	"input-radios": {
		variants: { "fieldset error": BOOL, "legend-type": LEGEND_TYPES },
		texts: GROUP_TEXTS,
		booleans: GROUP_BOOLEANS,
		layers: [{ layer: "input", component: "base-radio", count: 5 }],
	},
	"input-radios-horizontal": {
		variants: { "fieldset error": BOOL, "legend-type": LEGEND_TYPES },
		texts: GROUP_TEXTS,
		booleans: GROUP_BOOLEANS,
		layers: [{ layer: "input", component: "base-radio", count: 3 }],
	},
	"input-e-mail": FIELD,
	"input-file": FIELD,
	"input-number": FIELD,
	"input-password": FIELD,
	"input-select": FIELD,
	"input-tel": FIELD,
	"input-text": FIELD,
	"input-textarea": FIELD,
	"input-url": FIELD,
	search: FIELD,
	kopfzeile: { variants: { fluid: BOOL } },
	"link-default": LINK,
	"link-small": LINK,
	"link-large": LINK,
	"list-header": { texts: ["heading"] },
	loader: {},
	number: { texts: ["number"] },
	placeholder: {
		layers: [{ layer: "label-default", component: "label-default" }],
	},
	"placeholder-image": {},
	progress: {
		variants: { "label position": ["top", "bottom", "none"] },
		texts: ["label"],
		layers: [{ layer: "progressbar", component: "progressbar" }],
	},
	progressbar: { variants: { progress: PROGRESS_STEPS } },
	row: {
		variants: { layout: ROW_LAYOUTS, device: ["mobile", "desktop"] },
		swaps: ROW_SLOTS,
	},
	summary: {
		variants: { number: BOOL },
		texts: ["title"],
		layers: [
			{ layer: "number", component: "number" },
			{
				layer: "description-list-item",
				component: "description-list-item",
				count: 10,
			},
			{ layer: "link-default", component: "link-default" },
		],
	},
	...Object.fromEntries(
		Object.entries(TABLE_SIZES).map(([name, suffix]) => [name, table(suffix)]),
	),
	"table-head": {
		layers: [{ layer: "table-cell", component: "table-cell", count: 3 }],
	},
	"table-head-small": {
		layers: [
			{ layer: "table-cell-small", component: "table-cell-small", count: 3 },
		],
	},
	"table-row": tableRow(""),
	"table-row-small": tableRow("-small"),
	"table-cell": tableCell,
	"table-cell-small": tableCell,
	"task-list": {
		variants: { type: ["aufgabengruppe", "zusammenfassung"], number: BOOL },
		booleans: ["show info layer"],
		layers: [
			{ layer: "task-list-header", component: "list-header" },
			{ layer: "task-list-item", component: "task-list-item", count: 3 },
		],
	},
	"task-list-item": {
		variants: { type: Object.values(TASK_STATUS) },
		layers: [{ layer: "base-list-item", component: "base-list-item" }],
	},
};

/**
 * A property's name as plans spell it: without the kit's ID suffix and the
 * prefix before its first letter. "✏️ label#10307:96" is "label".
 */
export function propertyName(key: string): string {
	return key
		.replace(/#[^#]*$/, "")
		.replace(/^[^a-zA-Z]+/, "")
		.trim()
		.toLowerCase();
}

/**
 * A variant value as plans may spell it: letters and digits only, lower
 * case. "horizontal  →" matches "horizontal", "Default" matches "default".
 */
export function optionKey(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9äöüß%]/g, "");
}
