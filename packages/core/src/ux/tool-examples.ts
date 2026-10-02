/**
 * Known-good inputs per tool: the single source for the payloads in error hints
 * (and later descriptions, R6 cards and prompt examples). A golden test renders
 * every example with strict validation. This is the first piece of
 * defineTool()'s `examples` (roadmap, "The tool model").
 */
export type ToolExample = {
	/** What the example shows, when a tool has more than one. */
	title?: string;
	input: Readonly<Record<string, unknown>>;
};

export const TOOL_EXAMPLES: Readonly<Record<string, readonly ToolExample[]>> = {
	get_alert: [
		{
			input: {
				type: "danger",
				title: "Serverstörung",
				body: { text: "Unsere Server sind nicht erreichbar." },
			},
		},
	],
	get_badge: [{ input: { type: "success", text: "Online" } }],
	get_button: [{ input: { label: "More Info", variant: "primary" } }],
	get_card_group: [
		{
			input: {
				columns: 3,
				cards: [
					{
						header: { title: "Service A" },
						body: "Kurzbeschreibung",
						footer: { primaryLabel: "More Info" },
					},
				],
			},
		},
	],
	get_dialog: [
		{
			input: {
				title: "Bestätigen",
				body: "Möchten Sie fortfahren?",
				confirmLabel: "Ja",
				cancelLabel: "Nein",
				triggerLabel: "Dialog öffnen",
				triggerVariant: "primary",
			},
		},
	],
	get_disclosure: [
		{ input: { triggerLabel: "Details anzeigen", content: "Erklärungstext" } },
	],
	get_grid: [
		{
			input: {
				columns: 3,
				includeHeading: true,
				headingText: "Partner",
				headingLevel: 2,
			},
		},
	],
	get_heading: [{ input: { text: "Services", level: 2 } }],
	get_icon: [
		{
			input: { name: "download", decorative: false, ariaLabel: "Download PDF" },
		},
	],
	get_section: [
		{
			input: {
				headingText: "Überblick",
				headingLevel: 2,
				paragraphs: ["Erster Absatz", "Zweiter Absatz"],
				paragraphSize: "default",
				paragraphBold: false,
				divider: false,
			},
		},
	],
	get_select: [
		{
			input: {
				name: "lang",
				label: "Sprache",
				options: [
					{ value: "de", text: "Deutsch", selected: true },
					{ value: "en", text: "English" },
				],
			},
		},
	],
	get_tasklist: [
		{
			input: {
				heading: "Antragsschritte",
				numbered: true,
				items: [
					{
						title: "Persoenliche Daten",
						status: "In Bearbeitung",
						statusType: "info",
					},
				],
			},
		},
	],
};

/**
 * Renders an example input the way hints show it, as a JavaScript-style literal:
 * { label: 'More Info', items: ['a', 'b'] }.
 */
export function formatExampleInput(value: unknown): string {
	if (Array.isArray(value)) {
		return `[${value.map(formatExampleInput).join(", ")}]`;
	}
	if (value !== null && typeof value === "object") {
		const entries = Object.entries(value).map(
			([key, item]) =>
				`${/^[A-Za-z_$][\w$]*$/.test(key) ? key : formatExampleInput(key)}: ${formatExampleInput(item)}`,
		);
		return entries.length > 0 ? `{ ${entries.join(", ")} }` : "{}";
	}
	if (typeof value === "string") {
		return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
	}
	return String(value);
}

/** The hint line with a tool's first example: "Known-good payload: { … }." */
export function knownGoodPayload(toolName: string): string {
	const example = TOOL_EXAMPLES[toolName]?.[0];
	if (!example) {
		throw new Error(`No example for ${toolName} in TOOL_EXAMPLES.`);
	}
	return `Known-good payload: ${formatExampleInput(example.input)}.`;
}
