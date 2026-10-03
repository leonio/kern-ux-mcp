import manifest from "./registry.json" with { type: "json" };

/**
 * KERN's icon names, from the knowledge bundle (foundations/icons.json) by way
 * of registry.json. A JSON import, like the registry's, so the schemas can
 * check names when they're built.
 */
export const VALID_ICON_NAMES: readonly string[] = Object.freeze([
	...manifest.icons,
]);

/** Check if a string is a valid icon name */
export function isValidIconName(name: string): boolean {
	return VALID_ICON_NAMES.includes(name);
}

/** Names models reach for that KERN spells differently (Material Symbols, Font Awesome). */
const ICON_NAME_ALIASES: Readonly<Record<string, string>> = {
	"arrow-left": "arrow-back",
	"arrow-right": "arrow-forward",
	bin: "delete",
	calendar: "calendar-today",
	cancel: "close",
	copy: "content-copy",
	email: "mail",
	error: "danger",
	"external-link": "open-in-new",
	eye: "visibility",
	pencil: "edit",
	plus: "add",
	question: "question-mark",
	refresh: "autorenew",
	remove: "delete",
	trash: "delete",
	upload: "drive-folder-upload",
};

/**
 * Up to three valid icon names close to an unknown one: its hyphenated spelling
 * (arrow_forward → arrow-forward), a known alias (trash → delete), or the names
 * that share the most words with it.
 */
export function suggestIconNames(name: string): string[] {
	const spelled = name
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, "-");
	if (isValidIconName(spelled)) {
		return [spelled];
	}
	if (Object.hasOwn(ICON_NAME_ALIASES, spelled)) {
		return [ICON_NAME_ALIASES[spelled]];
	}
	const words = spelled.split("-").filter((word) => word.length > 2);
	const shared = (icon: string) =>
		icon.split("-").filter((part) => words.includes(part)).length;
	const best = Math.max(0, ...VALID_ICON_NAMES.map(shared));
	return best === 0
		? []
		: VALID_ICON_NAMES.filter((icon) => shared(icon) === best).slice(0, 3);
}

/** The validation message for an unknown icon name. */
export function iconNameHint(input: unknown): string {
	const suggestions = typeof input === "string" ? suggestIconNames(input) : [];
	const didYouMean =
		suggestions.length > 0 ? ` Did you mean ${suggestions.join(", ")}?` : "";
	return `Unknown icon name.${didYouMean} list_icons has every valid name.`;
}
