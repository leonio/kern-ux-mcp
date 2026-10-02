import type { z } from "zod";
import { debugLog } from "./logging.js";
import type { ToolDef } from "./ux/tool-builders/shared.js";
import { knownGoodPayload } from "./ux/tool-examples.js";
import {
	COMPOSITION_CHEAT_SHEET,
	COMPOSITION_VALID_KINDS,
} from "./ux/tools.js";

/**
 * The tools/call pipeline, independent of any MCP transport or SDK:
 * normalize → validate input → handler → validate output.
 */

type DisplayPathSegment = string | number;

type InvalidUnionLikeIssue = {
	code: "invalid_union";
	path: PropertyKey[];
	errors?: ReadonlyArray<ReadonlyArray<z.core.$ZodIssue>>;
	discriminator?: string;
	options?: readonly unknown[];
};

function toDisplayPath(path: ReadonlyArray<PropertyKey>): DisplayPathSegment[] {
	return path.filter(
		(segment): segment is DisplayPathSegment =>
			typeof segment === "string" || typeof segment === "number",
	);
}

function isInvalidUnionIssue(
	issue: z.core.$ZodIssue,
): issue is z.core.$ZodIssue & InvalidUnionLikeIssue {
	return issue.code === "invalid_union";
}

function formatIssuePath(path: ReadonlyArray<DisplayPathSegment>): string {
	if (path.length === 0) {
		return "$";
	}

	return path
		.map((segment, index) => {
			if (typeof segment === "number") {
				return `[${segment}]`;
			}

			return index === 0 ? segment : `.${segment}`;
		})
		.join("");
}

function formatZodIssues(error: z.ZodError): string {
	const MAX_ISSUES = 6;
	const lines = error.issues.slice(0, MAX_ISSUES).map((issue) => {
		const path = formatIssuePath(toDisplayPath(issue.path));
		return `- ${path}: ${issue.message}`;
	});

	const remaining = error.issues.length - MAX_ISSUES;
	if (remaining > 0) {
		lines.push(`- ...and ${remaining} more issue(s)`);
	}

	return lines.join("\n");
}

/** Tools that take a whole block tree, and get the cheat sheet on bad input. */
const COMPOSITION_TOOLS: ReadonlySet<string> = new Set([
	"render_composition",
	"render_page",
]);

/**
 * Specialized hint for render_composition and render_page.
 * Detects discriminated union failures (missing/invalid kind) and replaces
 * the "wall of noise" with a clean, pedagogical hint.
 */
function formatCompositionHint(error: z.ZodError): string {
	const kindsList = COMPOSITION_VALID_KINDS.join(", ");
	const hints: string[] = [];

	for (const issue of error.issues) {
		const path = formatIssuePath(toDisplayPath(issue.path));

		if (
			isInvalidUnionIssue(issue) &&
			issue.discriminator === "kind" &&
			Array.isArray(issue.options) &&
			issue.options.length > 0
		) {
			hints.push(
				`${path}: Invalid or missing 'kind'. Valid kinds are: ${kindsList}. ` +
					`Each block must be { kind: "<kind>", ... } — e.g. { kind: "card", card: { header: { title: "..." } } }.`,
			);
			continue;
		}

		// Invalid union: kind is correct but nested shape is wrong
		if (isInvalidUnionIssue(issue)) {
			const attemptedKind = findAttemptedKind(issue);
			if (attemptedKind) {
				hints.push(
					`${path} (kind: "${attemptedKind}"): Schema mismatch. ` +
						`Check the expected shape for '${attemptedKind}' in the cheat sheet below.`,
				);
			} else {
				hints.push(
					`${path}: Schema mismatch. ` +
						`Ensure each block has kind: "<kind>" and matches the expected shape.`,
				);
			}
			continue;
		}

		// Custom validation errors (depth limit, node count) — pass through
		if (issue.code === "custom") {
			hints.push(`${path}: ${issue.message}`);
			continue;
		}

		// Anything else: pass a simplified version through
		hints.push(`${path}: ${issue.message}`);
	}

	return [
		...hints.map((h) => `- ${h}`),
		"",
		"Cheat sheet for contentBlocks:",
		COMPOSITION_CHEAT_SHEET,
	].join("\n");
}

/**
 * Try to extract the 'kind' value the caller attempted to use
 * from a Zod invalid_union issue's nested unionErrors.
 */
function findAttemptedKind(issue: InvalidUnionLikeIssue): string | undefined {
	for (const unionErrors of issue.errors ?? []) {
		for (const innerIssue of unionErrors) {
			// If there's a "too_small" or "invalid_type" error that's NOT on the "kind" path,
			// the discriminator matched but a nested field failed.
			// Check if any error is on a kind-specific key (section, card, grid, etc.)
			const kindPath = innerIssue.path.find(
				(segment: PropertyKey) =>
					typeof segment === "string" &&
					(COMPOSITION_VALID_KINDS as readonly string[]).includes(segment),
			);
			if (typeof kindPath === "string") {
				return kindPath;
			}
		}
	}
	return undefined;
}

/**
 * The model-facing hint for invalid input: one "- path: message" line per issue,
 * plus a known-good payload or cheat sheet for tools that have one. It has no
 * header, because SDK v2 prefixes it with "Invalid arguments for tool <name>:".
 */
export function formatInputValidationHint(
	name: string,
	error: z.ZodError,
): string {
	const base = formatZodIssues(error);

	if (name === "get_dialog") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"Legacy payload with actions.confirm/cancel is also accepted and auto-mapped."
		);
	}

	if (name === "get_section") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"Compatibility aliases are accepted: heading (string/object), paragraphs as [{ text }], and paragraph as single string."
		);
	}

	if (name === "get_grid") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			'columns must be a divisor of 12: [1, 2, 3, 4, 6, 12]. For 5 or 7 equal columns, do not use get_grid; use CSS Grid utilities via get_utility_reference, e.g. class="kern-grid kern-grid-cols-5".'
		);
	}

	if (name === "get_button") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"Allowed variants: primary | secondary | tertiary. Allowed sizes: default | small. " +
			"Optional icon shape: { icon: { name: 'arrow-forward', position: 'right' } }."
		);
	}

	if (name === "get_icon") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"Use list_icons to discover valid icon names."
		);
	}

	if (name === "get_card_group") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"cards must be an array of 1-6 objects. Each card can include media, header, body/bodyIsHtml/contentBlocks, and footer."
		);
	}

	if (name === "get_heading") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"Allowed heading levels: 1 | 2 | 3 | 4 | 5 | 6."
		);
	}

	if (name === "get_tasklist") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"items accepts an array of objects with keys: title (required), href (optional), status (optional), statusType (info|success|warning|danger)."
		);
	}

	if (name === "get_alert") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"type: info (default) | success | warning | danger (highest severity — no separate 'high-contrast' variant exists). " +
			"body is optional with keys: text, links (array of {href, text}), listItems (array of strings), listStyle ('default'|'bullet')."
		);
	}

	if (name === "get_disclosure") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"Required: triggerLabel AND (contentBlocks OR content). " +
			"contentBlocks accepts recursive content blocks (text/html/button/card/grid). " +
			"content accepts a plain string (with contentIsHtml: true for raw HTML)."
		);
	}

	if (name === "get_badge") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"Required: type AND text. type: info | success | warning | danger. Optional: showIcon: true."
		);
	}

	if (name === "get_select") {
		return (
			`${base}\n${knownGoodPayload(name)}\n` +
			"Required: name, label, options (min 1). Each option: { value, text, selected?: bool, disabled?: bool }. " +
			"Optional: hint, error, disabled: true, optional: true."
		);
	}

	if (COMPOSITION_TOOLS.has(name)) {
		return formatCompositionHint(error);
	}

	return base;
}

/** The hint with its own header, for callers outside the MCP SDK (invokeTool). */
export function formatInputValidationError(
	name: string,
	error: z.ZodError,
): string {
	const count = error.issues.length;
	const header = COMPOSITION_TOOLS.has(name)
		? `Invalid arguments for ${name} (${count} issue${count !== 1 ? "s" : ""}):`
		: `Invalid arguments for ${name}:`;
	return `${header}\n${formatInputValidationHint(name, error)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeToolArgs(name: string, args: unknown): unknown {
	if (!isRecord(args)) {
		return args;
	}

	if (name === "get_inputtext") {
		const normalized = { ...args };
		if (typeof normalized.name !== "string" || normalized.name.trim() === "") {
			normalized.name = "text_input";
		}
		if (
			typeof normalized.label !== "string" ||
			normalized.label.trim() === ""
		) {
			normalized.label = "Textfeld";
		}
		return normalized;
	}

	if (name === "get_inputnumber") {
		const normalized = { ...args };
		if (typeof normalized.name !== "string" || normalized.name.trim() === "") {
			normalized.name = "number_input";
		}
		if (
			typeof normalized.label !== "string" ||
			normalized.label.trim() === ""
		) {
			normalized.label = "Zahl";
		}
		return normalized;
	}

	if (name === "get_inputfile") {
		const normalized = { ...args };
		if (typeof normalized.name !== "string" || normalized.name.trim() === "") {
			normalized.name = "upload";
		}
		if (
			typeof normalized.label !== "string" ||
			normalized.label.trim() === ""
		) {
			normalized.label = "Datei hochladen";
		}
		return normalized;
	}

	if (name === "get_tasklist") {
		const normalized = { ...args };

		if (
			typeof normalized.heading !== "string" &&
			typeof args.title === "string"
		) {
			normalized.heading = args.title;
		}

		if (Array.isArray(args.items)) {
			normalized.items = args.items
				.map((item: unknown) => {
					if (typeof item === "string") {
						return { title: item };
					}
					return item;
				})
				.filter((item: unknown) => isRecord(item));
		}

		if (!Array.isArray(normalized.items) || normalized.items.length === 0) {
			normalized.items = [
				{ title: "Schritt 1", status: "Offen", statusType: "info" },
			];
		}

		return normalized;
	}

	if (name === "get_dialog") {
		const normalized = { ...args };
		const actions = isRecord(args.actions) ? args.actions : undefined;
		const confirm =
			actions && isRecord(actions.confirm) ? actions.confirm : undefined;
		const cancel =
			actions && isRecord(actions.cancel) ? actions.cancel : undefined;
		const tertiary =
			actions && isRecord(actions.tertiary) ? actions.tertiary : undefined;
		const trigger = isRecord(args.trigger) ? args.trigger : undefined;

		if (
			typeof normalized.confirmLabel !== "string" &&
			typeof confirm?.label === "string"
		) {
			normalized.confirmLabel = confirm.label;
		}
		if (
			typeof normalized.cancelLabel !== "string" &&
			typeof cancel?.label === "string"
		) {
			normalized.cancelLabel = cancel.label;
		}
		if (
			typeof normalized.confirmId !== "string" &&
			typeof confirm?.id === "string"
		) {
			normalized.confirmId = confirm.id;
		}
		if (
			typeof normalized.tertiaryLabel !== "string" &&
			typeof tertiary?.label === "string"
		) {
			normalized.tertiaryLabel = tertiary.label;
		}
		if (
			typeof normalized.triggerLabel !== "string" &&
			typeof trigger?.label === "string"
		) {
			normalized.triggerLabel = trigger.label;
		}
		if (
			typeof normalized.triggerVariant !== "string" &&
			typeof trigger?.variant === "string"
		) {
			normalized.triggerVariant = trigger.variant;
		}

		return normalized;
	}

	if (name === "get_section") {
		const normalized = { ...args };
		const heading = args.heading;

		if (typeof normalized.headingText !== "string") {
			if (typeof heading === "string") {
				normalized.headingText = heading;
			} else if (isRecord(heading) && typeof heading.text === "string") {
				normalized.headingText = heading.text;
			}
		}

		if (typeof normalized.headingLevel !== "number") {
			if (isRecord(heading) && typeof heading.level === "number") {
				normalized.headingLevel = heading.level;
			}
		}

		const sourceParagraphs = args.paragraphs;
		if (Array.isArray(sourceParagraphs)) {
			const containsNonString = sourceParagraphs.some(
				(entry: unknown) => typeof entry !== "string",
			);
			if (!Array.isArray(normalized.paragraphs) || containsNonString) {
				normalized.paragraphs = sourceParagraphs
					.map((entry: unknown) => {
						if (typeof entry === "string") {
							return entry;
						}
						if (isRecord(entry) && typeof entry.text === "string") {
							return entry.text;
						}
						return undefined;
					})
					.filter((entry): entry is string => typeof entry === "string");
			}
		} else if (typeof args.paragraph === "string") {
			normalized.paragraphs = [args.paragraph];
		}

		return normalized;
	}

	return args;
}

/**
 * Normalizes raw arguments by tool name, then parses them with the tool's
 * input schema. Used by the SDK adapter (kernInputSchema) and by invokeTool.
 */
export function parseToolInput(
	tool: ToolDef,
	rawArgs: unknown,
): ReturnType<z.ZodType["safeParse"]> {
	const { name } = tool;
	debugLog(`call:start ${name}`, rawArgs ?? {});
	const normalizedArgs = normalizeToolArgs(name, rawArgs ?? {});
	debugLog(`call:normalized ${name}`, normalizedArgs);
	const parsed = tool.inputSchema.safeParse(normalizedArgs);
	if (!parsed.success) {
		debugLog(`call:input-invalid ${name}`, parsed.error.issues);
	}
	return parsed;
}

/**
 * Runs one tool call through the whole pipeline and returns the validated
 * output. Throws the headed hint when the input is invalid.
 */
export async function invokeTool(
	tool: ToolDef,
	rawArgs: unknown,
): Promise<unknown> {
	const parsed = parseToolInput(tool, rawArgs);
	if (!parsed.success) {
		throw new Error(formatInputValidationError(tool.name, parsed.error));
	}
	return runTool(tool, parsed.data);
}

/**
 * Runs the handler on already-parsed input and validates its output. Throws when
 * the handler throws (e.g. strict-mode failures) or its output breaks the schema.
 */
export async function runTool(
	tool: ToolDef,
	parsedArgs: unknown,
): Promise<unknown> {
	const { name } = tool;
	const result = await tool.handler(parsedArgs);
	const outputParsed = tool.outputSchema.safeParse(result);
	if (!outputParsed.success) {
		debugLog(`call:output-invalid ${name}`, outputParsed.error.issues);
		throw new Error(
			`Tool ${name} returned invalid output: ${outputParsed.error.toString()}`,
		);
	}

	debugLog(`call:success ${name}`, outputParsed.data);
	return outputParsed.data;
}
