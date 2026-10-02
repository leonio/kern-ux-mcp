/**
 * The R5 baseline scenarios: tasks a model solves with the kern tools only. Each
 * says what the final answer should contain, as a rough completion check; the
 * main measurements are tool calls, errors, retries and tokens (transcript.ts).
 */
export type Scenario = {
	id: string;
	prompt: string;
	/** Tool groups that must each be called at least once (any tool in a group counts). */
	expectTools?: string[][];
	/** Strings the final answer must contain. */
	expectHtml?: string[];
};

export const SCENARIOS: readonly Scenario[] = [
	{
		id: "contact-form",
		prompt:
			'Build a contact form for a city office: full name, email address, a message over several lines, a required checkbox to accept the privacy policy, and a submit button labelled "Absenden". Show the state after someone submitted it without an email address: the email field shows an error and the form shows an error summary.',
		expectHtml: ["<form", 'type="email"', "kern-error", "<textarea"],
	},
	{
		id: "wohngeld-wizard",
		prompt:
			"Create the first step of a three-step online application for housing benefit (Wohngeld): 1 Persönliche Daten, 2 Haushalt, 3 Prüfen und Absenden. Show the list of steps with the progress, and the form for step 1 (first name, last name, date of birth) with navigation to go back and forward.",
		expectHtml: ["<form", "Haushalt", 'type="date"'],
	},
	{
		id: "landing-page",
		prompt:
			'Create a complete HTML page for the municipal service portal "Bürgerservice Musterstadt": a header with the site name and navigation (Start, Leistungen, Kontakt), a main heading, a short intro paragraph, three service cards in a row (Personalausweis beantragen, Wohnsitz anmelden, Hund anmelden), each with a button, and a footer with two columns of links.',
		expectHtml: ["<main", "kern-card", "<footer", "Hund anmelden"],
	},
	{
		id: "outage-status",
		prompt:
			"Create a service status section: a danger alert saying that online payment is currently unavailable, followed by a table of four services whose status is shown as badges (Online, Gestört, Wartung).",
		expectHtml: ["kern-alert--danger", "<table", "kern-badge"],
	},
	{
		id: "faq",
		prompt:
			'Create an FAQ section with the heading "Häufige Fragen" and four questions whose answers expand when clicked.',
		expectHtml: ["Häufige Fragen", "<details"],
	},
	{
		id: "delete-dialog",
		prompt:
			'Create a confirmation dialog for deleting an uploaded document, with the buttons "Abbrechen" and "Löschen", plus the button that opens the dialog.',
		expectHtml: ["<dialog", "Abbrechen", "Löschen"],
	},
	{
		id: "address-fieldset",
		prompt:
			'Create an address group for a form, under the legend "Ihre Anschrift": street and house number, postcode, city, and a country select with Deutschland, Österreich and Schweiz.',
		expectHtml: ["<fieldset", "Ihre Anschrift", "<select", "Österreich"],
	},
	{
		id: "icon-toolbar",
		prompt:
			"Create three icon-only buttons for a row in a document list: edit, delete and download. Screen reader users must know what each one does.",
		expectHtml: ["kern-icon", "kern-sr-only"],
	},
	{
		id: "fix-markup",
		prompt:
			'Check this markup against the KERN accessibility rules and give me a corrected version: <img src="wappen.png"><input type="text" id="plz"><button class="kern-button">Weiter</button>',
		expectTools: [["validate_html"]],
		expectHtml: ["alt=", "<label", "kern-btn"],
	},
	{
		id: "service-cards",
		prompt:
			'Create a section "Unsere Leistungen" with the services in a two-column grid of cards, each card with a title, a short text and a link-style button.',
		expectHtml: ["Unsere Leistungen", "kern-card", "kern-col"],
	},
];
