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
	get_accordion: [
		{
			input: {
				mode: "group",
				items: [
					{
						title: "Welche Unterlagen brauche ich?",
						content: "Personalausweis und Mietvertrag.",
					},
					{ title: "Wie lange dauert es?", content: "Etwa vier Wochen." },
				],
			},
		},
	],
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
	get_body: [{ input: { text: "Bitte füllen Sie alle Pflichtfelder aus." } }],
	get_button: [{ input: { label: "More Info", variant: "primary" } }],
	get_card: [
		{
			input: {
				header: { title: "Wohngeld", subline: "Zuschuss zur Miete" },
				body: "Prüfen Sie, ob Ihnen Wohngeld zusteht.",
				footer: { primaryLabel: "Antrag stellen" },
			},
		},
	],
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
	get_checkbox: [
		{
			input: {
				mode: "list",
				legend: "Benachrichtigungen",
				groupName: "kanal",
				items: [
					{ value: "email", label: "Per E-Mail", checked: true },
					{ value: "post", label: "Per Post" },
				],
			},
		},
	],
	get_descriptionlist: [
		{
			input: {
				items: [
					{ key: "Aktenzeichen", value: "WG-2026-0412" },
					{ key: "Eingang", value: "5. Oktober 2026" },
				],
			},
		},
	],
	get_details: [{ input: {} }],
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
	get_divider: [{ input: {} }],
	get_dropdown: [
		{
			input: {
				triggerLabel: "Sortieren",
				name: "sortierung",
				options: [
					{ value: "datum", label: "Nach Datum", checked: true },
					{ value: "name", label: "Nach Name" },
				],
			},
		},
	],
	get_fieldset: [
		{
			input: {
				legend: "Ihre Anschrift",
				contentBlocks: [
					{
						kind: "field",
						field: {
							type: "text",
							name: "strasse",
							label: "Straße und Hausnummer",
						},
					},
					{
						kind: "field",
						field: { type: "text", name: "plz", label: "Postleitzahl" },
					},
				],
			},
		},
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
	get_inputdate: [
		{
			input: {
				name: "geburtsdatum",
				label: "Geburtsdatum",
				autocomplete: "bday",
			},
		},
	],
	get_inputemail: [
		{
			input: {
				name: "email",
				label: "E-Mail-Adresse",
				autocomplete: "email",
				error: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
			},
		},
	],
	get_inputfile: [
		{
			input: {
				name: "nachweis",
				label: "Einkommensnachweis",
				accept: ".pdf",
				hint: "Eine PDF-Datei",
			},
		},
	],
	get_inputgroup: [{ input: { name: "miete", suffix: "€" } }],
	get_inputnumber: [
		{ input: { name: "personen", label: "Personen im Haushalt" } },
	],
	get_inputpassword: [
		{
			input: {
				name: "passwort",
				label: "Passwort",
				autocomplete: "current-password",
			},
		},
	],
	get_inputtel: [
		{
			input: {
				name: "telefon",
				label: "Telefonnummer",
				autocomplete: "tel",
				optional: true,
			},
		},
	],
	get_inputtext: [
		{
			input: {
				name: "nachname",
				label: "Nachname",
				autocomplete: "family-name",
				hint: "Wie im Personalausweis",
			},
		},
	],
	get_inputurl: [
		{ input: { name: "webseite", label: "Webseite", optional: true } },
	],
	get_kopfzeile: [{ input: {} }],
	get_label: [{ input: { text: "Pflichtangabe" } }],
	get_layers: [{ input: {} }],
	get_link: [
		{
			input: {
				text: "Zur Barrierefreiheitserklärung",
				href: "/barrierefreiheit",
			},
		},
	],
	get_lists: [{ input: { text: "Personalausweis", ordered: false } }],
	get_loader: [{ input: { visible: true, srText: "Daten werden geladen" } }],
	get_preline: [{ input: { text: "Bürgerservice" } }],
	get_progress: [{ input: { value: 2, max: 4, label: "Schritt 2 von 4" } }],
	get_radio: [
		{
			input: {
				mode: "list",
				name: "zustellung",
				legend: "Wie möchten Sie den Bescheid erhalten?",
				items: [
					{ value: "post", label: "Per Post", checked: true },
					{ value: "online", label: "Im Online-Postfach" },
				],
			},
		},
	],
	get_search: [{ input: {} }],
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
	get_subline: [{ input: { text: "Stand: Oktober 2026" } }],
	get_summary: [
		{
			input: {
				mode: "single",
				title: "Persönliche Daten",
				items: [
					{ key: "Name", value: "Erika Mustermann" },
					{ key: "Geburtsdatum", value: "12.08.1964" },
				],
				action: { href: "#persoenliche-daten", label: "Ändern" },
			},
		},
	],
	get_table: [
		{
			input: {
				caption: "Gebühren",
				headers: [{ text: "Leistung" }, { text: "Gebühr", numeric: true }],
				rows: [
					{
						cells: [
							{ content: "Personalausweis" },
							{ content: "37,00 €", numeric: true },
						],
					},
					{
						cells: [
							{ content: "Reisepass" },
							{ content: "70,00 €", numeric: true },
						],
					},
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
	get_textarea: [
		{
			input: {
				name: "anliegen",
				label: "Ihr Anliegen",
				rows: 4,
				optional: true,
			},
		},
	],
	get_title: [{ input: { text: "Antrag eingereicht", size: "default" } }],
	render_page: [
		{
			input: {
				heading: "Wohngeld beantragen",
				header: {
					title: "Stadt Musterstadt",
					navigation: [{ label: "Start", href: "/" }],
				},
				contentBlocks: [
					{
						kind: "section",
						section: {
							headingText: "Voraussetzungen",
							paragraphs: ["Sie wohnen zur Miete."],
						},
					},
				],
				footer: {
					columns: [
						{
							heading: "Service",
							links: [{ label: "Kontakt", href: "/kontakt" }],
						},
					],
				},
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
