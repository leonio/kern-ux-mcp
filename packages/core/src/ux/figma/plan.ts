import { type HTMLElement, parse } from "node-html-parser";

import {
	BUTTON_SIZES,
	BUTTON_VARIANTS,
	type ButtonSize,
	buttonComponent,
	buttonIconSize,
	HEADING_SIZES,
	type IconSize,
	iconComponent,
	PROGRESS_STEPS,
	ROW_EQUAL_LAYOUTS,
	ROW_LAYOUTS,
	ROW_SLOTS,
	TASK_STATUS,
} from "./kit.js";

/**
 * A Figma plan: KERN HTML as kit instances and auto-layout frames, for the
 * script (script.ts) to build in Figma. Containers are frames, components are
 * instances of the kit's, and content inside a component goes into its slot,
 * the instance-swap property the kit gives it ("component", "placeholder-1").
 */

/** A KERN space token, metric/space/* in the kit's 02_Device collection. */
export type Space =
	| "none"
	| "2x-small"
	| "x-small"
	| "small"
	| "default"
	| "large"
	| "x-large";

export type InstanceProps = {
	/** Variant axis → value. For a nested instance, the script sets it as a property. */
	variants?: Record<string, string>;
	texts?: Record<string, string>;
	booleans?: Record<string, boolean>;
	/** Instance-swap property → the kit component to show, such as an icon. */
	swaps?: Record<string, string>;
	nested?: NestedInstance[];
};

/** An instance inside a placed one, found by its layer name. */
export type NestedInstance = InstanceProps & {
	/** The layer's name without its numbering: "➀ input" is "input". */
	layer: string;
	/** The kit component the layer is an instance of; the tests check props against it. */
	component: string;
	visible?: boolean;
	/** One entry per layer with that name, in order; the layers left over are hidden. */
	items?: InstanceProps[];
};

export type PlanInstance = InstanceProps & {
	type: "instance";
	component: string;
	/** Slot (instance-swap property) → its content, built as a component of its own. */
	slots?: Record<string, PlanNode[]>;
	/** Stretch to the parent's width. */
	fill?: boolean;
};

export type PlanFrame = {
	type: "frame";
	name: string;
	direction: "vertical" | "horizontal";
	gap: Space;
	padding?: { x?: Space | "page-margin"; y?: Space };
	wrap?: boolean;
	spaceBetween?: boolean;
	/** A KERN level: the frame takes 04_Level's mode and its contextual background. */
	level?: 1 | 2;
	children: PlanNode[];
};

export type PlanNode = PlanInstance | PlanFrame;

export type Device = "desktop" | "mobile";

export type FigmaPlan = {
	name: string;
	device: Device;
	/** The frame's width: 1440 on desktop, the kit's 360 on mobile. */
	width: number;
	/** A whole page (header, main, footer); a fragment gets the page margin. */
	page: boolean;
	children: PlanNode[];
	/** In a plan split over several scripts: which part this is (script.ts). */
	part?: { index: number; of: number; path: number[]; container: string };
};

export type FigmaPlanResult = {
	plan: FigmaPlan;
	/** Every kit component the script imports, to look up by name. */
	components: string[];
	/** Markup with no kit component, drawn as a labelled placeholder. */
	unmapped: string[];
	warnings: string[];
};

export const SCREEN_WIDTH: Readonly<Record<Device, number>> = {
	desktop: 1440,
	mobile: 360,
};

type Context = {
	device: Device;
	components: Set<string>;
	unmapped: string[];
	warnings: string[];
};

/** Builds the plan for KERN HTML: a page from render_page, or any fragment. */
export function planFigmaDesign(
	html: string,
	options: { name?: string; device?: Device } = {},
): FigmaPlanResult {
	const root = parse(html, {
		comment: false,
		lowerCaseTagName: false,
		blockTextElements: { script: true, style: true, pre: true },
	});
	const body = root.querySelector("body") ?? root;
	const device = options.device ?? "desktop";
	const ctx: Context = {
		device,
		components: new Set(),
		unmapped: [],
		warnings: [],
	};

	const children = planChildren(body, ctx);
	const heading = body.querySelector("h1");
	const name =
		options.name?.trim() || (heading && text(heading)) || "KERN screen";

	return {
		plan: {
			name,
			device,
			width: SCREEN_WIDTH[device],
			page: body.querySelector("main") !== null,
			children,
		},
		components: [...ctx.components].sort(),
		unmapped: ctx.unmapped,
		warnings: ctx.warnings,
	};
}

/* ------------------------------------------------------------------ */
/*  Markup helpers                                                     */
/* ------------------------------------------------------------------ */

const SKIPPED_TAGS = new Set([
	"script",
	"style",
	"template",
	"svg",
	"head",
	"meta",
	"link",
	"title",
	"noscript",
	"input",
	"select",
	"textarea",
	"option",
	"progress",
]);

const INLINE_TAGS = new Set([
	"a",
	"abbr",
	"b",
	"br",
	"code",
	"em",
	"i",
	"small",
	"span",
	"strong",
	"sub",
	"sup",
	"time",
]);

/** Tags that stay a frame even with one child. */
const FRAME_TAGS = new Set([
	"main",
	"header",
	"footer",
	"nav",
	"section",
	"form",
	"article",
	"aside",
]);

function tagOf(el: HTMLElement): string {
	return el.rawTagName?.toLowerCase() ?? "";
}

function classesOf(el: HTMLElement): Set<string> {
	return new Set((el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean));
}

function elements(el: HTMLElement): HTMLElement[] {
	return el.childNodes.filter(
		(node): node is HTMLElement => node.nodeType === 1,
	);
}

/** The element's text, whitespace collapsed. */
function text(el: HTMLElement | null | undefined): string {
	return (el?.text ?? "").replace(/\s+/g, " ").trim();
}

/** The element's text without the text of the descendants a selector matches. */
function textWithout(el: HTMLElement, selector: string): string {
	let result = el.text;
	for (const part of el.querySelectorAll(selector)) {
		result = result.replace(part.text, "");
	}
	return result.replace(/\s+/g, " ").trim();
}

/** A child element with a class, not a deeper one. */
function child(el: HTMLElement, className: string): HTMLElement | undefined {
	return elements(el).find((c) => classesOf(c).has(className));
}

/** The modifier of a block class: kern-btn--secondary → secondary. */
function modifier<T extends string>(
	classes: Set<string>,
	block: string,
	values: readonly T[],
): T | undefined {
	return values.find((value) => classes.has(`${block}--${value}`));
}

/**
 * No block-level or KERN-component children: the element reads as one text.
 * A link counts as text inside a paragraph, but as a component elsewhere.
 */
function isInline(el: HTMLElement, linksAreText = false): boolean {
	return elements(el).every(
		(c) =>
			INLINE_TAGS.has(tagOf(c)) &&
			![...classesOf(c)].some(
				(name) =>
					name.startsWith("kern-") &&
					!name.startsWith("kern-label") &&
					!(linksAreText && name === "kern-link"),
			),
	);
}

function use(ctx: Context, component: string): string {
	ctx.components.add(component);
	return component;
}

const GAPS: Readonly<Record<string, Space>> = {
	none: "none",
	xxs: "2x-small",
	xs: "x-small",
	sm: "small",
	md: "default",
	lg: "large",
	xl: "x-large",
};

/** The gap a kern-gap class sets along a direction, if any. */
function gapOf(
	classes: Set<string>,
	direction: "vertical" | "horizontal",
): Space | undefined {
	const axis = direction === "vertical" ? "y" : "x";
	for (const pattern of [
		new RegExp(`^kern-gap-${axis}-(\\w+)$`),
		/^kern-gap-(\w+)$/,
	]) {
		for (const name of classes) {
			const size = pattern.exec(name)?.[1];
			if (size && GAPS[size]) return GAPS[size];
		}
	}
	return undefined;
}

function directionOf(
	classes: Set<string>,
	device: Device,
): "vertical" | "horizontal" {
	if (
		device === "desktop" &&
		[...classes].some((name) => /^kern-flex-row-(md|lg|xl)$/.test(name))
	) {
		return "horizontal";
	}
	if (classes.has("kern-flex-col")) return "vertical";
	if (classes.has("kern-flex") || classes.has("kern-flex-row")) {
		return "horizontal";
	}
	return "vertical";
}

/* ------------------------------------------------------------------ */
/*  Walking the markup                                                 */
/* ------------------------------------------------------------------ */

function planChildren(el: HTMLElement, ctx: Context): PlanNode[] {
	return el.childNodes.flatMap((node): PlanNode[] => {
		if (node.nodeType === 1) return planElement(node as HTMLElement, ctx);
		const loose = node.text.replace(/\s+/g, " ").trim();
		return node.nodeType === 3 && loose
			? [textInstance("body-default", "body", loose, ctx)]
			: [];
	});
}

type Rule = {
	matches(el: HTMLElement, classes: Set<string>, tag: string): boolean;
	plan(el: HTMLElement, ctx: Context, classes: Set<string>): PlanNode[];
};

function planElement(el: HTMLElement, ctx: Context): PlanNode[] {
	const tag = tagOf(el);
	const classes = classesOf(el);
	if (
		SKIPPED_TAGS.has(tag) ||
		el.hasAttribute("hidden") ||
		el.getAttribute("aria-hidden") === "true" ||
		classes.has("kern-sr-only")
	) {
		return [];
	}
	for (const rule of RULES) {
		if (rule.matches(el, classes, tag)) return rule.plan(el, ctx, classes);
	}
	return container(el, ctx, classes, tag);
}

function container(
	el: HTMLElement,
	ctx: Context,
	classes: Set<string>,
	tag: string,
): PlanNode[] {
	if (isInline(el)) {
		const content = text(el);
		return content ? [textInstance("body-default", "body", content, ctx)] : [];
	}
	const children = planChildren(el, ctx);
	if (children.length === 0) return [];

	const level = classes.has("kern-layer")
		? classes.has("kern-level-2")
			? 2
			: classes.has("kern-level-1")
				? 1
				: undefined
		: undefined;
	const framed =
		FRAME_TAGS.has(tag) ||
		level !== undefined ||
		[...classes].some(
			(name) =>
				name === "kern-flex" ||
				name.startsWith("kern-container") ||
				name.startsWith("kern-gap") ||
				name === "kern-stack",
		);
	if (!framed && children.length === 1) return children;

	const direction = directionOf(classes, ctx.device);
	const padding: NonNullable<PlanFrame["padding"]> = {};
	if (classes.has("kern-container") || classes.has("kern-container-fluid")) {
		padding.x = "page-margin";
	}
	const paddingY = [...classes]
		.map((name) => /^kern-py-(\w+)$/.exec(name)?.[1])
		.find((size) => size && GAPS[size]);
	if (paddingY) padding.y = GAPS[paddingY];

	return [
		{
			type: "frame",
			name: frameName(el, tag),
			direction,
			gap:
				gapOf(classes, direction) ??
				(tag === "header" ? "none" : tag === "footer" ? "large" : "default"),
			...(Object.keys(padding).length > 0 ? { padding } : {}),
			...(classes.has("kern-flex-wrap") ? { wrap: true } : {}),
			...(classes.has("kern-justify-content-between")
				? { spaceBetween: true }
				: {}),
			...(level ? { level } : {}),
			children,
		},
	];
}

function frameName(el: HTMLElement, tag: string): string {
	if (tag === "section") {
		const heading = el.querySelector("h1, h2, h3, h4, h5, h6");
		return heading ? `section: ${text(heading)}` : "section";
	}
	return FRAME_TAGS.has(tag) ? tag : "group";
}

/* ------------------------------------------------------------------ */
/*  Text                                                               */
/* ------------------------------------------------------------------ */

function textInstance(
	component: string,
	property: string,
	value: string,
	ctx: Context,
	variants?: Record<string, string>,
): PlanInstance {
	return {
		type: "instance",
		component: use(ctx, component),
		...(variants ? { variants } : {}),
		texts: { [property]: value },
		fill: true,
	};
}

const HEADING_BY_LEVEL: Readonly<Record<string, string>> = {
	h1: "x-large",
	h2: "large",
	h3: "medium",
	h4: "small",
	h5: "small",
	h6: "small",
};

function heading(
	el: HTMLElement,
	ctx: Context,
	classes: Set<string>,
): PlanNode[] {
	const size =
		HEADING_SIZES.find((name) => classes.has(`kern-heading-${name}`)) ??
		HEADING_BY_LEVEL[tagOf(el)] ??
		"medium";
	return [textInstance(`heading-${size}`, "heading", text(el), ctx)];
}

const TEXT_SIZES = ["small", "large"] as const;

function sizedText(block: string, property: string) {
	return (el: HTMLElement, ctx: Context, classes: Set<string>) => {
		const size = modifier(classes, `kern-${block}`, TEXT_SIZES) ?? "default";
		return [textInstance(`${block}-${size}`, property, text(el), ctx)];
	};
}

function body(el: HTMLElement, ctx: Context, classes: Set<string>): PlanNode[] {
	const size = modifier(classes, "kern-body", TEXT_SIZES) ?? "default";
	const content = text(el);
	if (!content) return [];
	return [
		textInstance(`body-${size}`, "body", content, ctx, {
			weight: classes.has("kern-body--bold") ? "bold" : "regular",
		}),
	];
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function note(label: string, ctx: Context): PlanInstance {
	ctx.unmapped.push(label);
	return {
		type: "instance",
		component: use(ctx, "placeholder"),
		fill: true,
		nested: [
			{ layer: "label-default", component: "label-default", texts: { label } },
		],
	};
}

const ICON_SIZE_MODIFIERS = new Set(["small", "medium", "large", "x-large"]);

/** The icon among an element's children: its KERN name, and whether it comes first. */
function iconIn(el: HTMLElement): { name: string; first: boolean } | undefined {
	const icon = elements(el).find((c) => classesOf(c).has("kern-icon"));
	if (!icon) return undefined;
	const name = [...classesOf(icon)]
		.map((c) => /^kern-icon--([a-z-]+)$/.exec(c)?.[1])
		.find((value) => value && !ICON_SIZE_MODIFIERS.has(value));
	if (!name) return undefined;
	const content = el.childNodes.filter(
		(node) => node.nodeType === 1 || node.text.trim() !== "",
	);
	return { name, first: content[0] === icon };
}

function iconSwap(
	name: string,
	size: IconSize,
	ctx: Context,
): Record<string, string> {
	const component = iconComponent(name, size);
	if (!component) {
		ctx.warnings.push(
			`The kit has no icon ${name}: the component's own icon stays.`,
		);
		return {};
	}
	return { "icon-type": use(ctx, component) };
}

function button(
	el: HTMLElement,
	ctx: Context,
	classes: Set<string>,
): PlanNode[] {
	const variant = modifier(classes, "kern-btn", BUTTON_VARIANTS) ?? "primary";
	const size: ButtonSize =
		modifier(
			classes,
			"kern-btn",
			BUTTON_SIZES.filter((s) => s !== "default"),
		) ?? "default";
	const labelEl = el.querySelector(".kern-label") ?? el;
	const label = text(labelEl);
	const icon = iconIn(el);
	const iconOnly = icon !== undefined && classesOf(labelEl).has("kern-sr-only");
	const iconPosition = icon
		? iconOnly
			? "only"
			: icon.first
				? "left"
				: "right"
		: "none";
	return [
		{
			type: "instance" as const,
			component: use(ctx, buttonComponent(variant, size)),
			variants: {
				state: el.hasAttribute("disabled") ? "disabled" : "default",
				icon: iconPosition,
			},
			texts: { label },
			...(icon
				? { swaps: iconSwap(icon.name, buttonIconSize(size), ctx) }
				: {}),
		},
	];
}

function link(el: HTMLElement, ctx: Context, classes: Set<string>): PlanNode[] {
	if (el.getAttribute("href") === "#main") return []; // the skip link
	const size = modifier(classes, "kern-link", TEXT_SIZES) ?? "default";
	const icon = iconIn(el);
	return [
		{
			type: "instance" as const,
			component: use(ctx, `link-${size}`),
			variants: {
				alignment: "horizontal",
				state: "default",
				icon: icon ? (icon.first ? "left" : "right") : "none",
			},
			texts: { label: textWithout(el, ".kern-sr-only") },
			...(icon ? { swaps: iconSwap(icon.name, size, ctx) } : {}),
		},
	];
}

const FEEDBACK = ["info", "success", "warning", "danger"] as const;

function badge(
	el: HTMLElement,
	ctx: Context,
	classes: Set<string>,
): PlanNode[] {
	return [
		{
			type: "instance" as const,
			component: use(ctx, "badge"),
			variants: { type: modifier(classes, "kern-badge", FEEDBACK) ?? "info" },
			texts: { label: text(el) },
			booleans: { icon: el.querySelector(".kern-icon") !== null },
		},
	];
}

function alert(
	el: HTMLElement,
	ctx: Context,
	classes: Set<string>,
): PlanNode[] {
	const title = text(el.querySelector(".kern-alert__header .kern-title"));
	const bodyEl = el.querySelector(".kern-alert__body");
	const bodyChildren = bodyEl ? elements(bodyEl) : [];
	const plainText =
		bodyEl !== null &&
		bodyChildren.every((c) => tagOf(c) === "p" || INLINE_TAGS.has(tagOf(c)));
	const slot = bodyEl && !plainText ? planChildren(bodyEl, ctx) : [];
	return [
		{
			type: "instance" as const,
			component: use(ctx, "alert"),
			variants: { type: modifier(classes, "kern-alert", FEEDBACK) ?? "info" },
			texts: {
				title,
				...(plainText && bodyEl ? { description: text(bodyEl) } : {}),
			},
			booleans: {
				description: plainText && text(bodyEl) !== "",
				"content-slot": slot.length > 0,
			},
			...(slot.length > 0 ? { slots: { component: slot } } : {}),
			fill: true,
		},
	];
}

const FIELD_COMPONENTS: Readonly<Record<string, string>> = {
	email: "input-e-mail",
	file: "input-file",
	number: "input-number",
	password: "input-password",
	select: "input-select",
	tel: "input-tel",
	textarea: "input-textarea",
	url: "input-url",
	search: "search",
};

/** Label text without its "Optional" marker, and whether it has one. */
function labelOf(el: HTMLElement | undefined | null) {
	return {
		label: el ? textWithout(el, ".kern-label__optional") : "",
		optional: el?.querySelector(".kern-label__optional") != null,
	};
}

function field(
	el: HTMLElement,
	ctx: Context,
	classes: Set<string>,
): PlanNode[] {
	const control = el.querySelector("input, select, textarea");
	const tag = control ? tagOf(control) : "input";
	// KERN renders a number as text with a numeric keyboard.
	const type =
		tag !== "input"
			? tag
			: control?.getAttribute("inputmode") === "numeric"
				? "number"
				: (control?.getAttribute("type") ?? "text").toLowerCase();
	const component = FIELD_COMPONENTS[type] ?? "input-text";
	const { label, optional } = labelOf(el.querySelector(".kern-label"));
	const hint = text(el.querySelector(".kern-hint"));
	const error = text(el.querySelector(".kern-error"));
	const hasError = classes.has("kern-form-input--error") || error !== "";
	return [
		{
			type: "instance" as const,
			component: use(ctx, component),
			variants: { error: String(hasError), "fieldset error": "false" },
			nested: [
				{
					layer: "form",
					component: "base-form",
					texts: {
						label,
						...(hint ? { hint } : {}),
						...(error ? { error } : {}),
					},
					booleans: { hint: hint !== "", optional },
				},
			],
			fill: true,
		},
	];
}

/** A group's legend, hint and error, the texts and booleans the kit's groups share. */
function groupProps(el: HTMLElement, legendEl: HTMLElement | undefined) {
	const { label: legend, optional } = labelOf(legendEl);
	const hint = text(child(el, "kern-hint"));
	const error = text(child(el, "kern-error"));
	return {
		variants: {
			"fieldset error": String(
				classesOf(el).has("kern-fieldset--error") || error !== "",
			),
			"legend-type":
				legendEl && classesOf(legendEl).has("kern-label--large")
					? "large"
					: "default",
		},
		texts: {
			legend,
			...(hint ? { hint } : {}),
			...(error ? { error } : {}),
		},
		booleans: { hint: hint !== "", optional },
	};
}

function fieldset(el: HTMLElement, ctx: Context): PlanNode[] {
	const legendEl = elements(el).find((c) => tagOf(c) === "legend");
	const bodyEl = child(el, "kern-fieldset__body") ?? el;
	const props = groupProps(el, legendEl);
	const checks = elements(bodyEl).filter((c) =>
		classesOf(c).has("kern-form-check"),
	);
	const onlyChecks =
		checks.length > 0 && checks.length === elements(bodyEl).length;

	if (onlyChecks) {
		const radios = checks.every(
			(c) => c.querySelector("input")?.getAttribute("type") === "radio",
		);
		const horizontal = classesOf(bodyEl).has("kern-fieldset__body--horizontal");
		const component = radios
			? horizontal
				? "input-radios-horizontal"
				: "input-radios"
			: "input-checkboxes";
		const max = radios ? (horizontal ? 3 : 5) : 7;
		if (checks.length > max) {
			ctx.warnings.push(
				`${component} "${props.texts.legend}" has ${checks.length} options; the kit shows ${max}.`,
			);
		}
		return [
			{
				type: "instance" as const,
				component: use(ctx, component),
				...props,
				nested: [
					{
						layer: "input",
						component: radios ? "base-radio" : "base-checkbox",
						items: checks.map((check) => ({
							variants: {
								selected: String(
									check.querySelector("input")?.hasAttribute("checked") ??
										false,
								),
							},
							texts: { label: text(check.querySelector("label")) },
						})),
					},
				],
				fill: true,
			},
		];
	}

	const content = planChildren(bodyEl, ctx);
	return [
		{
			type: "instance" as const,
			component: use(ctx, "fieldset"),
			...props,
			...(content.length > 0 ? { slots: { component: content } } : {}),
			fill: true,
		},
	];
}

function check(el: HTMLElement, ctx: Context): PlanNode[] {
	const input = el.querySelector("input");
	const radio = input?.getAttribute("type") === "radio";
	return [
		{
			type: "instance" as const,
			component: use(ctx, radio ? "base-radio" : "base-checkbox"),
			variants: { selected: String(input?.hasAttribute("checked") ?? false) },
			texts: { label: text(el.querySelector("label")) },
		},
	];
}

const CARD_SIZES = ["small", "large"] as const;

function card(el: HTMLElement, ctx: Context, classes: Set<string>): PlanNode[] {
	const size = modifier(classes, "kern-card", CARD_SIZES) ?? "default";
	const interactive =
		classes.has("kern-card--interactive") ||
		el.querySelector(".kern-link--stretched") !== null;
	const preline = text(el.querySelector(".kern-card__header .kern-preline"));
	const title = text(el.querySelector(".kern-card__header .kern-title"));
	const subline = text(el.querySelector(".kern-card__header .kern-subline"));
	const bodyEl = el.querySelector(".kern-card__body");
	const buttons = el.querySelectorAll(".kern-card__footer .kern-btn");

	const slot = bodyEl ? planChildren(bodyEl, ctx) : [];
	if (interactive && buttons.length > 0) {
		// The kit's interactive cards have no action bar: the buttons go in the slot.
		for (const b of buttons) slot.push(...button(b, ctx, classesOf(b)));
	}

	const actions =
		!interactive && buttons.length > 0
			? cardActions(buttons, size === "default" ? "" : `-${size}`)
			: undefined;

	return [
		{
			type: "instance" as const,
			component: use(ctx, `card-${size}${interactive ? "-interactive" : ""}`),
			variants: interactive
				? { surface: "false", state: "default" }
				: {
						surface: "false",
						stretch: String(!classes.has("kern-card--hug")),
					},
			texts: {
				title,
				...(preline ? { preline } : {}),
				...(subline ? { subline } : {}),
			},
			booleans: {
				preline: preline !== "",
				subline: subline !== "",
				media: el.querySelector(".kern-card__media") !== null,
				"content-slot": slot.length > 0,
				...(interactive ? {} : { "action bar": actions !== undefined }),
			},
			...(actions ? { nested: [actions] } : {}),
			...(slot.length > 0 ? { slots: { component: slot } } : {}),
			fill: true,
		},
	];
}

function cardActions(
	buttons: HTMLElement[],
	suffix: "" | "-small" | "-large",
): NestedInstance {
	const label = (variant: string) =>
		text(
			buttons
				.find((b) => classesOf(b).has(`kern-btn--${variant}`))
				?.querySelector(".kern-label"),
		);
	const primary = label("primary") || text(buttons[0]);
	const secondary = label("secondary");
	return {
		layer: "card-actions",
		component: `card-actions${suffix}`,
		variants: { "number of buttons": secondary ? "2" : "1" },
		nested: [
			{
				layer: "button-primary",
				component: `button-primary${suffix}`,
				texts: { label: primary },
			},
			...(secondary
				? [
						{
							layer: "button-secondary",
							component: `button-secondary${suffix}`,
							texts: { label: secondary },
						},
					]
				: []),
		],
	};
}

/** Columns from md up: kern-grid-cols-3-md is 3. */
function gridColumns(classes: Set<string>): number {
	let columns = 1;
	for (const name of classes) {
		const match = /^kern-grid-cols-(\d+)(?:-(?:sm|md|lg|xl))?$/.exec(name);
		if (match) columns = Math.max(columns, Number(match[1]));
	}
	return columns;
}

function grid(el: HTMLElement, ctx: Context, classes: Set<string>): PlanNode[] {
	const items = elements(el);
	const columns = gridColumns(classes);
	const content = items.map((item) => planChildren(item, ctx));

	if (columns === 1) {
		return [
			{
				type: "frame" as const,
				name: "grid",
				direction: "vertical" as const,
				gap: gapOf(classes, "vertical") ?? "large",
				children: content.flat(),
			},
		];
	}

	// Columns of different widths: kern-col-8-md and kern-col-4-md make 8-4.
	const spans = items.map(
		(item) =>
			[...classesOf(item)]
				.map((name) => /^kern-col-(\d+)-(?:md|lg)$/.exec(name)?.[1])
				.find(Boolean) ?? "",
	);
	const spanLayout = spans.join("-");
	const uneven =
		items.length <= 2 &&
		spans.every(Boolean) &&
		(ROW_LAYOUTS as readonly string[]).includes(spanLayout)
			? spanLayout
			: undefined;

	if (!uneven && columns > 4) {
		ctx.warnings.push(
			`A grid of ${columns} columns: the kit's row has up to 4, so it's drawn as frames.`,
		);
		return [
			{
				type: "frame" as const,
				name: `grid ${columns} columns`,
				direction: "horizontal" as const,
				gap: gapOf(classes, "horizontal") ?? "large",
				wrap: true,
				children: content.map((blocks, index) => ({
					type: "frame" as const,
					name: `column ${index + 1}`,
					direction: "vertical" as const,
					gap: "default" as const,
					children: blocks,
				})),
			},
		];
	}

	const perRow = uneven ? items.length : columns;
	const layout = uneven ?? ROW_EQUAL_LAYOUTS[perRow] ?? "12";
	const rows: PlanInstance[] = [];
	for (let start = 0; start < content.length; start += perRow) {
		const slice = content.slice(start, start + perRow);
		rows.push({
			type: "instance",
			component: use(ctx, "row"),
			variants: { layout, device: ctx.device },
			slots: Object.fromEntries(
				ROW_SLOTS.slice(0, perRow).map((slot, index) => [
					slot,
					slice[index] ?? [],
				]),
			),
			fill: true,
		});
	}
	if (rows.length === 1) return rows;
	return [
		{
			type: "frame" as const,
			name: "grid",
			direction: "vertical" as const,
			gap: gapOf(classes, "vertical") ?? "large",
			children: rows,
		},
	];
}

function accordion(el: HTMLElement, ctx: Context): PlanNode[] {
	const summary = elements(el).find((c) => tagOf(c) === "summary");
	const bodyEl = el.querySelector(".kern-accordion__body");
	const content = bodyEl ? planChildren(bodyEl, ctx) : [];
	return [
		{
			type: "instance" as const,
			component: use(ctx, "accordion"),
			variants: {
				expanded: String(el.hasAttribute("open")),
				disabled: "false",
			},
			texts: { titel: text(summary) },
			booleans: { "content-slot": content.length > 0 },
			...(content.length > 0 ? { slots: { component: content } } : {}),
			fill: true,
		},
	];
}

function taskList(el: HTMLElement, ctx: Context): PlanNode[] {
	const listHeading = text(el.querySelector(".kern-task-list__header"));
	const items = el.querySelectorAll(".kern-task-list__item");
	const numbered = el.querySelector(".kern-number") !== null;
	if (items.length > 3) {
		ctx.warnings.push(
			`A task list of ${items.length} items: the kit's task list shows 3.`,
		);
	}
	return [
		{
			type: "instance" as const,
			component: use(ctx, "task-list"),
			variants: { type: "aufgabengruppe", number: String(numbered) },
			nested: [
				listHeading
					? {
							layer: "task-list-header",
							component: "list-header",
							texts: { heading: listHeading },
						}
					: {
							layer: "task-list-header",
							component: "list-header",
							visible: false,
						},
				{
					layer: "task-list-item",
					component: "task-list-item",
					items: items.map((item): InstanceProps => {
						const badgeEl = item.querySelector(".kern-badge");
						const status = badgeEl
							? (modifier(classesOf(badgeEl), "kern-badge", FEEDBACK) ?? "info")
							: "info";
						const titleEl = item.querySelector(".kern-task-list__title");
						const title = titleEl
							? textWithout(titleEl, ".kern-task-list__status")
							: text(item);
						return {
							variants: { type: TASK_STATUS[status] },
							nested: [
								{
									layer: "base-list-item",
									component: "base-list-item",
									texts: { title },
									booleans: { number: numbered },
									nested: [
										{
											layer: "number",
											component: "number",
											texts: {
												number: text(item.querySelector(".kern-number")),
											},
										},
										...(badgeEl
											? [
													{
														layer: "badge",
														component: "badge",
														variants: { type: status },
														texts: { label: text(badgeEl) },
													},
												]
											: []),
									],
								},
							],
						};
					}),
				},
			],
			fill: true,
		},
	];
}

function progress(el: HTMLElement, ctx: Context): PlanNode[] {
	const bar = el.querySelector("progress");
	const value = Number(bar?.getAttribute("value") ?? 0);
	const max = Number(bar?.getAttribute("max") ?? 100) || 100;
	const percent = (value / max) * 100;
	const step = PROGRESS_STEPS.reduce((best, candidate) =>
		Math.abs(Number.parseInt(candidate, 10) - percent) <
		Math.abs(Number.parseInt(best, 10) - percent)
			? candidate
			: best,
	);
	return [
		{
			type: "instance" as const,
			component: use(ctx, "progress"),
			variants: { "label position": "top" },
			texts: { label: text(el.querySelector(".kern-label")) },
			nested: [
				{
					layer: "progressbar",
					component: "progressbar",
					variants: { progress: step },
				},
			],
			fill: true,
		},
	];
}

/** Description list items as the kit's description-list-item texts. */
function descriptionItems(
	el: HTMLElement,
	ctx: Context,
	owner: string,
): InstanceProps[] {
	const items = el.querySelectorAll(".kern-description-list-item");
	if (items.length > 10) {
		ctx.warnings.push(
			`${owner} has ${items.length} items: the kit's description list shows 10.`,
		);
	}
	return items.map((item) => ({
		texts: {
			term: text(item.querySelector(".kern-description-list-item__key")),
			definition: text(
				item.querySelector(".kern-description-list-item__value"),
			),
		},
	}));
}

function summary(el: HTMLElement, ctx: Context): PlanNode[] {
	const numberEl = el.querySelector(".kern-summary__header .kern-number");
	const title = text(el.querySelector(".kern-summary__header .kern-title"));
	const action = el.querySelector(".kern-summary__actions a");
	return [
		{
			type: "instance" as const,
			component: use(ctx, "summary"),
			variants: { number: String(numberEl !== null) },
			texts: { title },
			nested: [
				...(numberEl
					? [
							{
								layer: "number",
								component: "number",
								texts: { number: text(numberEl) },
							},
						]
					: []),
				{
					layer: "description-list-item",
					component: "description-list-item",
					items: descriptionItems(el, ctx, `The summary "${title}"`),
				},
				action
					? {
							layer: "link-default",
							component: "link-default",
							texts: { label: textWithout(action, ".kern-sr-only") },
						}
					: {
							layer: "link-default",
							component: "link-default",
							visible: false,
						},
			],
			fill: true,
		},
	];
}

function summaryGroup(el: HTMLElement, ctx: Context): PlanNode[] {
	const header = el.querySelector(".kern-summary-group__header");
	const headingEl = header?.querySelector("h1, h2, h3, h4, h5, h6");
	return [
		{
			type: "frame" as const,
			name: "summary-group",
			direction: "vertical" as const,
			gap: "large" as const,
			children: [
				...(headingEl ? heading(headingEl, ctx, classesOf(headingEl)) : []),
				...el
					.querySelectorAll(".kern-summary")
					.flatMap((item) => summary(item, ctx)),
			],
		},
	];
}

function descriptionList(
	el: HTMLElement,
	ctx: Context,
	classes: Set<string>,
): PlanNode[] {
	return [
		{
			type: "instance" as const,
			component: use(ctx, "description-list"),
			variants: { column: String(classes.has("kern-description-list--col")) },
			nested: [
				{
					layer: "description-list-item",
					component: "description-list-item",
					items: descriptionItems(el, ctx, "A description list"),
				},
			],
			fill: true,
		},
	];
}

function table(el: HTMLElement, ctx: Context): PlanNode[] {
	const tableEl = tagOf(el) === "table" ? el : el.querySelector("table");
	if (!tableEl) return container(el, ctx, classesOf(el), tagOf(el));
	const classes = classesOf(tableEl);
	const suffix = classes.has("kern-table--small") ? "-small" : "";
	const striped = String(classes.has("kern-table--striped"));
	const caption = text(tableEl.querySelector("caption"));
	const cells = (row: HTMLElement) =>
		elements(row)
			.filter((cell) => ["th", "td"].includes(tagOf(cell)))
			.map((cell) => ({
				texts: { text: text(cell) },
				variants: {
					"text-align": [...classesOf(cell)].some((name) =>
						name.endsWith("--numeric"),
					)
						? "right"
						: "default",
				},
			}));
	const head = tableEl.querySelector("thead tr");
	const rows = tableEl
		.querySelectorAll("tr")
		.filter((row) => row !== head && row.closest("tfoot") === null);
	const columns = Math.max(
		head ? cells(head).length : 0,
		...rows.map((row) => cells(row).length),
	);
	if (columns > 3 || rows.length > 3) {
		ctx.warnings.push(
			`A table of ${columns} columns and ${rows.length} rows: the kit's table shows 3 by 3.`,
		);
	}
	const title = suffix ? "title-small" : "title-default";
	return [
		{
			type: "instance" as const,
			component: use(ctx, `table-${suffix ? "small" : "default"}`),
			variants: { striped },
			booleans: { caption: caption !== "", footer: false },
			nested: [
				...(caption
					? [{ layer: title, component: title, texts: { title: caption } }]
					: []),
				...(head
					? [
							{
								layer: `table-head${suffix}`,
								component: `table-head${suffix}`,
								nested: [
									{
										layer: `table-cell${suffix}`,
										component: `table-cell${suffix}`,
										items: cells(head),
									},
								],
							},
						]
					: []),
				{
					layer: `table-row${suffix}`,
					component: `table-row${suffix}`,
					items: rows.map((row) => ({
						variants: { striped },
						nested: [
							{
								layer: `table-cell${suffix}`,
								component: `table-cell${suffix}`,
								items: cells(row),
							},
						],
					})),
				},
			],
			fill: true,
		},
	];
}

function list(el: HTMLElement, ctx: Context, classes: Set<string>): PlanNode[] {
	const ordered = tagOf(el) === "ol";
	const bullet = classes.has("kern-list--bullet") || ordered;
	const items = elements(el).filter((c) => tagOf(c) === "li");
	if (!bullet) return container(el, ctx, classes, tagOf(el));
	return [
		{
			type: "frame" as const,
			name: ordered ? "ordered list" : "list",
			direction: "vertical" as const,
			gap: gapOf(classes, "vertical") ?? "small",
			children: items.map((item, index) =>
				textInstance(
					"body-default",
					"body",
					`${ordered ? `${index + 1}.` : "•"} ${text(item)}`,
					ctx,
				),
			),
		},
	];
}

/** KERN components the kit has no Figma counterpart for, by class. */
const UNMAPPED: ReadonlyArray<[string, string]> = [
	["kern-dialog", "dialog"],
	["kern-dropdown", "dropdown"],
	["kern-tabs", "tabs"],
];

const RULES: readonly Rule[] = [
	{
		matches: (_, c) => c.has("kern-kopfzeile"),
		plan: (el, ctx) => [
			{
				type: "instance",
				component: use(ctx, "kopfzeile"),
				variants: {
					fluid: String(el.querySelector(".kern-container-fluid") !== null),
				},
				fill: true,
			},
		],
	},
	{
		matches: (_, c, tag) =>
			/^h[1-6]$/.test(tag) || [...c].some((n) => n.startsWith("kern-heading-")),
		plan: heading,
	},
	{
		matches: (_, c) => c.has("kern-brand"),
		plan: (el, ctx) => [textInstance("title-default", "title", text(el), ctx)],
	},
	{ matches: (_, c) => c.has("kern-title"), plan: sizedText("title", "title") },
	{
		matches: (_, c) => c.has("kern-preline"),
		plan: sizedText("preline", "preline"),
	},
	{
		matches: (_, c) => c.has("kern-subline"),
		plan: sizedText("subline", "subline"),
	},
	{ matches: (el, c) => c.has("kern-body") && isInline(el, true), plan: body },
	{ matches: (_, c) => c.has("kern-badge"), plan: badge },
	{ matches: (_, c) => c.has("kern-btn"), plan: button },
	{
		matches: (_, c, tag) =>
			tag === "a" && c.has("kern-link") && !c.has("kern-link--stretched"),
		plan: link,
	},
	{ matches: (_, c) => c.has("kern-alert"), plan: alert },
	{ matches: (_, c) => c.has("kern-form-input"), plan: field },
	{
		matches: (_, c, tag) => tag === "fieldset" || c.has("kern-fieldset"),
		plan: fieldset,
	},
	{ matches: (_, c) => c.has("kern-form-check"), plan: check },
	{ matches: (_, c) => c.has("kern-card"), plan: card },
	{ matches: (_, c) => c.has("kern-grid"), plan: grid },
	{
		matches: (_, c, tag) => tag === "details" || c.has("kern-accordion"),
		plan: accordion,
	},
	{ matches: (_, c) => c.has("kern-task-list"), plan: taskList },
	{ matches: (_, c) => c.has("kern-progress"), plan: progress },
	{ matches: (_, c) => c.has("kern-summary-group"), plan: summaryGroup },
	{ matches: (_, c) => c.has("kern-summary"), plan: summary },
	{
		matches: (_, c, tag) => tag === "hr" || c.has("kern-divider"),
		plan: (el, ctx) => [
			{
				type: "instance",
				component: use(ctx, "divider"),
				variants: {
					decorative: String(el.getAttribute("role") === "presentation"),
				},
				fill: true,
			},
		],
	},
	{
		matches: (_, c) => c.has("kern-description-list"),
		plan: descriptionList,
	},
	{
		matches: (_, c, tag) =>
			tag === "table" || c.has("kern-table-responsive") || c.has("kern-table"),
		plan: table,
	},
	{
		matches: (_, c) => c.has("kern-loader"),
		plan: (_, ctx) => [{ type: "instance", component: use(ctx, "loader") }],
	},
	{
		matches: (_, __, tag) => tag === "img",
		plan: (_, ctx) => [
			{
				type: "instance",
				component: use(ctx, "placeholder-image"),
				fill: true,
			},
		],
	},
	{
		matches: (_, c, tag) =>
			tag === "dialog" || UNMAPPED.some(([name]) => c.has(name)),
		plan: (_, ctx, c) => [
			note(UNMAPPED.find(([name]) => c.has(name))?.[1] ?? "dialog", ctx),
		],
	},
	{
		matches: (_, c, tag) =>
			(tag === "ul" || tag === "ol") &&
			(c.has("kern-list--bullet") || tag === "ol"),
		plan: list,
	},
	{
		matches: (el, c) => c.has("kern-label") && isInline(el),
		plan: sizedText("label", "label"),
	},
	{
		matches: (el, c) =>
			(c.has("kern-hint") || c.has("kern-error")) && isInline(el),
		plan: (el, ctx) => [textInstance("body-small", "body", text(el), ctx)],
	},
];
