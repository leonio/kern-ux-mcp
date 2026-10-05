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
	/**
	 * CSS selectors the delivered HTML must match at least `min` or at most `max`
	 * times: the final answer's HTML, or every tool's HTML if the answer has none.
	 */
	expectStructure?: StructureCheck[];
};

export type StructureCheck = {
	selector: string;
	min?: number;
	max?: number;
	/** What the check means, for the report; the selector when omitted. */
	label?: string;
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
		expectHtml: ["Unsere Leistungen", "kern-card", "kern-grid"],
	},
];

/** A page to repair: a skipped heading level, an image without alt, unlabelled fields, a card in a card, a class KERN doesn't have, a table without headers. */
const BROKEN_PAGE = `<main>
<h1>Bürgerbüro Musterstadt</h1>
<section>
<h3>Öffnungszeiten</h3>
<p class="kern-body">Montag bis Freitag, 8 bis 16 Uhr</p>
<img src="buergerbuero.jpg">
</section>
<div class="kern-card"><div class="kern-card"><h2>Termin buchen</h2><p>Buchen Sie Ihren Termin online.</p><a class="kern-button" href="/termin">Termin buchen</a></div></div>
<form>
<input type="text" id="name" placeholder="Name">
<input type="email" id="mail" placeholder="E-Mail">
<select id="anliegen"><option>Personalausweis</option><option>Meldebescheinigung</option></select>
<button class="kern-button">Senden</button>
</form>
<table><tr><td>Leistung</td><td>Gebühr</td></tr><tr><td>Personalausweis</td><td>37,00 €</td></tr><tr><td>Reisepass</td><td>70,00 €</td></tr></table>
<details><summary>Was muss ich mitbringen?</summary>Ihren alten Ausweis und ein biometrisches Passfoto.</details>
</main>`;

/**
 * Layouts that need the recursive block union: several levels of containers,
 * the form rules, a whole page, and a repair loop on large input
 * (docs/plan-v2/post-alpha-work.md, section 4). Run with `--suite nested`.
 */
export const NESTED_SCENARIOS: readonly Scenario[] = [
	{
		id: "dashboard",
		prompt:
			'Create the section "Meine Anträge" for the start page of a citizen portal: a three-column grid of cards, one each for Wohngeld, Elterngeld and Kindergeld, each card with a status badge (Eingereicht, In Bearbeitung, Bewilligt) and a button "Details ansehen". Below the grid, in the same section, a table of the last four payments with the columns Datum, Leistung and Betrag.',
		expectHtml: ["Meine Anträge", "Elterngeld"],
		expectStructure: [
			{
				selector: ".kern-grid .kern-card",
				min: 3,
				label: "three cards in a grid",
			},
			{
				selector: ".kern-card .kern-badge",
				min: 3,
				label: "a badge in each card",
			},
			{
				selector: ".kern-card .kern-btn",
				min: 3,
				label: "a button in each card",
			},
			{ selector: ".kern-card .kern-card", max: 0, label: "no card in a card" },
			{ selector: "table th", min: 3, label: "a table with three columns" },
		],
	},
	{
		id: "application-flow",
		prompt:
			"Build the online application for a residents' parking permit (Bewohnerparkausweis) as one multi-step form with three steps: 1 Persönliche Daten (first name, last name, date of birth), 2 Fahrzeug (licence plate, and a vehicle type select with PKW, Motorrad and Wohnmobil), 3 Prüfen und Absenden (a checkbox to confirm the details are correct). Group each step's fields in a fieldset. Render all three steps in the page so a script can switch between them, with step 2 active, as it looks after a submit without a licence plate: that field shows an error and the form shows an error summary.",
		expectHtml: ["Fahrzeug", "Wohnmobil"],
		expectStructure: [
			{ selector: "form fieldset", min: 2, label: "fieldsets in the form" },
			{ selector: "[hidden]", min: 2, label: "the inactive steps, hidden" },
			{ selector: 'input[type="date"]', min: 1, label: "a date field" },
			{ selector: "select option", min: 3, label: "the vehicle type select" },
			{ selector: ".kern-error", min: 1, label: "the field error" },
			{
				selector: '.kern-alert--danger a[href^="#"]',
				min: 1,
				label: "an error summary linking to the field",
			},
			{ selector: "form form", max: 0, label: "no form in a form" },
		],
	},
	{
		id: "service-page",
		prompt:
			'Create the complete HTML page "Sperrmüll anmelden" for the city of Musterstadt: a header with the site name and navigation (Start, Abfall, Kontakt); a main heading and a short intro; a form to book a bulky-waste pickup (name, street and house number, postcode, preferred date, a select of item types, and a submit button); a table of the fees for three item types with a price column; an FAQ with three questions that expand when clicked; and a footer with two columns of links.',
		expectHtml: ["Sperrmüll anmelden"],
		expectStructure: [
			{ selector: "header nav a", min: 3, label: "the header navigation" },
			{ selector: "main h1", min: 1, label: "the main heading" },
			{ selector: "main form input", min: 4, label: "the form fields" },
			{ selector: "main form select", min: 1, label: "the item type select" },
			{ selector: "main table", min: 1, label: "the fee table" },
			{ selector: "main details", min: 3, label: "three FAQ entries" },
			{ selector: "footer a", min: 4, label: "two columns of footer links" },
		],
	},
	{
		id: "fix-page",
		prompt: `Check this page against the KERN accessibility rules and return a corrected version of the whole page, built with KERN components and keeping all of its content:\n\n${BROKEN_PAGE}`,
		expectTools: [["validate_html"]],
		expectHtml: ["Öffnungszeiten", "Meldebescheinigung", "37,00", "Passfoto"],
		expectStructure: [
			{ selector: "img[alt]", min: 1, label: "the image has alt text" },
			{ selector: "label", min: 3, label: "labels for the three fields" },
			{ selector: "th", min: 2, label: "table headers" },
			{ selector: ".kern-btn", min: 2, label: "KERN buttons" },
			{ selector: ".kern-button", max: 0, label: "no kern-button class" },
			{ selector: ".kern-card .kern-card", max: 0, label: "no card in a card" },
		],
	},
];

/**
 * Tasks where a resource should help (roadmap R6, D16): run with and without
 * --resources on the same commit. KERN asks for aria-required on required
 * fields; the field tools set it since be08fa7 (`required: true`), before which
 * no run did. KERN documents a notification banner but doesn't implement it;
 * since d70ae86 the docs tool and the card name get_alert instead
 * (r6-fix-res-off: one run in three still invents the banner's classes).
 */
export const RESOURCE_SCENARIOS: readonly Scenario[] = [
	{
		id: "form-required",
		prompt:
			"Build the contact form of a city office (name, e-mail, message) as it looks after a failed submit: the e-mail address is missing, and an error summary at the top links to the field. Name and e-mail are required, the message is optional. Mark the required and optional fields the way KERN asks for.",
		expectStructure: [
			{
				selector: '.kern-alert--danger a[href^="#"]',
				min: 1,
				label: "an error summary linking to the field",
			},
			{ selector: ".kern-error", min: 1, label: "the field error" },
			{
				selector: '[aria-required="true"]',
				min: 2,
				label: "required fields with aria-required",
			},
			{ selector: "[required]", max: 0, label: "no native required" },
			{
				selector: ".kern-label__optional",
				min: 1,
				label: "the optional marker",
			},
		],
	},
	{
		id: "notice-banner",
		prompt:
			"Our citizen portal needs a site-wide notice at the very top of every page: planned maintenance on Saturday from 8 to 12, so online services are unavailable then. Use the KERN component meant for this and give me its markup.",
		expectStructure: [
			{ selector: ".kern-alert", min: 1, label: "an alert" },
			{
				selector: '[class*="kern-notification"]',
				max: 0,
				label: "no invented notification classes",
			},
		],
	},
];

/** The scenario sets `npm run eval -- --suite <name>` can run. */
export const SUITES: Readonly<Record<string, readonly Scenario[]>> = {
	base: SCENARIOS,
	nested: NESTED_SCENARIOS,
	resources: RESOURCE_SCENARIOS,
};
