import { describe, expect, it } from "vitest";

import {
	findVariant,
	getListedToolSchema,
	schemaVariants,
} from "../test-support/json-schema.js";
import { createRegistry } from "../test-support/tools.js";
import { createTools } from "./tools.js";

describe("tool input schemas", () => {
	it("input text family schemas document usage, hint, and password restrictions", () => {
		const registry = createRegistry([
			{
				id: "inputtext",
				title: "InputText",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "inputemail",
				title: "InputEmail",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "inputpassword",
				title: "InputPassword",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "textarea",
				title: "Textarea",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "select",
				title: "Select",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const inputTextSchema = getListedToolSchema(tools, "get_inputtext");
		const inputEmailSchema = getListedToolSchema(tools, "get_inputemail");
		const inputPasswordSchema = getListedToolSchema(tools, "get_inputpassword");
		const textareaSchema = getListedToolSchema(tools, "get_textarea");
		const selectSchema = getListedToolSchema(tools, "get_select");

		expect(inputTextSchema.description).toContain("einzeilige");
		expect(inputTextSchema.description).toContain("autocomplete-Tokens");
		expect(inputTextSchema.properties.placeholder.description).toContain(
			"Kein Ersatz",
		);
		expect(inputTextSchema.properties.autocomplete.description).toContain(
			"HTML-autocomplete-Token",
		);
		expect(inputTextSchema.properties.hint.description).toContain("ohne Links");
		expect(inputTextSchema.properties.disabled.description).toContain(
			"möglichst vermeiden",
		);

		expect(inputEmailSchema.description).toContain("E-Mail-Adressen");
		expect(inputEmailSchema.description).toContain("autocomplete=email");
		expect(inputEmailSchema.properties.type.description).toContain(
			"HTML-Typ email",
		);

		expect(inputPasswordSchema.description).toContain("Passwortfeld selbst");
		expect(inputPasswordSchema.properties.type.description).toContain(
			"HTML-Typ password",
		);
		expect(inputPasswordSchema.properties.disabled).toBeUndefined();
		expect(inputPasswordSchema.properties.readonly).toBeUndefined();

		expect(textareaSchema.description).toContain("mehrzeilige Eingaben");
		expect(textareaSchema.properties.rows.description).toContain(
			"Proportional",
		);

		expect(selectSchema.description).toContain(
			"nicht für Aktionen oder Navigation",
		);
		expect(selectSchema.properties.options.description).toContain("5 bis 15");
		expect(
			selectSchema.properties.options.items.properties.text.description,
		).toContain("kurz");
	});

	it("number, url, date, tel, and file schemas document source-specific usage guidance", () => {
		const registry = createRegistry([
			{
				id: "inputnumber",
				title: "InputNumber",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "inputurl",
				title: "InputUrl",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "inputdate",
				title: "InputDate",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "inputtel",
				title: "InputTel",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "inputfile",
				title: "InputFile",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const inputNumberSchema = getListedToolSchema(tools, "get_inputnumber");
		const inputUrlSchema = getListedToolSchema(tools, "get_inputurl");
		const inputDateSchema = getListedToolSchema(tools, "get_inputdate");
		const inputTelSchema = getListedToolSchema(tools, "get_inputtel");
		const inputFileSchema = getListedToolSchema(tools, "get_inputfile");

		expect(inputNumberSchema.description).toContain('inputmode="numeric"');
		expect(inputNumberSchema.description).toContain(
			'statt nativer type="number"',
		);
		expect(inputNumberSchema.properties.type).toBeUndefined();

		expect(inputUrlSchema.description).toContain(
			"vollstaendige Web- oder Service-Adressen",
		);
		expect(inputUrlSchema.properties.type.description).toContain(
			"inklusive https://",
		);

		expect(inputDateSchema.description).toContain("vereinfachte Annaeherung");
		expect(inputDateSchema.description).toContain("Tag, Monat und Jahr");
		expect(inputDateSchema.properties.type.description).toContain(
			"HTML-Typ date",
		);

		expect(inputTelSchema.description).toContain("Telefonnummern");
		expect(inputTelSchema.description).toContain('autocomplete="tel"');
		expect(inputTelSchema.properties.type.description).toContain(
			'autocomplete="tel"',
		);

		expect(inputFileSchema.description).toContain("erlaubte Formate");
		expect(inputFileSchema.description).toContain("genau eine Datei");
		expect(inputFileSchema.properties.accept.description).toContain(
			"serverseitige Validierung",
		);
		expect(inputFileSchema.properties.label.description).toContain(
			"nicht nur allgemein 'Upload'",
		);
	});

	it("checkbox and radio schemas document group semantics and list-specific guidance", () => {
		const registry = createRegistry([
			{
				id: "checkbox",
				title: "Checkbox",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "radio",
				title: "Radio",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const checkboxSchema = getListedToolSchema(tools, "get_checkbox");
		const radioSchema = getListedToolSchema(tools, "get_radio");

		const checkboxVariants = schemaVariants(checkboxSchema);
		const radioVariants = schemaVariants(radioSchema);

		expect(checkboxSchema.description).toContain("Einzel- oder Listen-Modus");
		expect(radioSchema.description).toContain("Einzel- oder Listen-Modus");

		const checkboxSingle = findVariant(
			checkboxVariants,
			(variant) => variant.properties?.mode?.default === "single",
		);
		const checkboxList = findVariant(
			checkboxVariants,
			(variant) => variant.properties?.mode?.const === "list",
		);
		const radioSingle = findVariant(
			radioVariants,
			(variant) => variant.properties?.mode?.const === "single",
		);
		const radioList = findVariant(
			radioVariants,
			(variant) => variant.properties?.mode?.const === "list",
		);

		expect(checkboxSingle.properties.label.description).toContain(
			"bestaetigbare Aussage",
		);
		expect(checkboxList.properties.groupName.description).toContain(
			"kein eigenes name-Attribut",
		);
		expect(checkboxList.properties.items.description).toContain(
			"mehrere Eintraege gleichzeitig",
		);
		expect(checkboxList.properties.items.items.properties.name).toBeUndefined();

		expect(radioSingle.description).toContain("einzelnen Radio-Button");
		expect(radioList.properties.legend.description).toContain(
			"gemeinsame Frage oder Entscheidung",
		);
		expect(radioList.properties.items.description).toContain(
			"genau eine Auswahl",
		);
		expect(radioList.properties.horizontal.description).toContain(
			"wenige kurze Optionen",
		);
		expect(
			radioList.properties.items.items.properties.checked.description,
		).toContain("hoechstens eine Option");
	});

	it("dialog and dropdown schemas document structural and experimental guidance", () => {
		const registry = createRegistry([
			{
				id: "dialog",
				title: "Dialog",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "dropdown",
				title: "Dropdown",
				status: "experimental",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const dialogSchema = getListedToolSchema(tools, "get_dialog");
		const dropdownSchema = getListedToolSchema(tools, "get_dropdown");

		expect(dialogSchema.description).toContain("<dialog>");
		expect(dialogSchema.description).toContain('formmethod="dialog"');
		expect(dialogSchema.properties.bodyIsHtml.description).toContain(
			"vertrauenswuerdiges HTML",
		);
		expect(dialogSchema.properties.triggerLabel.description).toContain(
			"data-dialog-target",
		);
		expect(dialogSchema.properties.confirmLabel.description).toContain(
			"'Loeschen'",
		);

		expect(dropdownSchema.description).toContain("experimentell");
		expect(dropdownSchema.description).toContain("<details>/<summary>");
		expect(dropdownSchema.properties.options.description).toContain(
			"Radio- oder mehrfache Checkbox-Auswahl",
		);
		expect(dropdownSchema.properties.inputType.description).toContain(
			"genau eine Auswahl",
		);
		expect(dropdownSchema.properties.open.description).toContain("<details>");
		expect(
			dropdownSchema.properties.options.items.properties.checked.description,
		).toContain("hoechstens eine Option");
	});

	it("alert, badge, and tasklist schemas document rendered status semantics", () => {
		const registry = createRegistry([
			{
				id: "alert",
				title: "Alert",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "badge",
				title: "Badge",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "tasklist",
				title: "Tasklist",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const alertSchema = getListedToolSchema(tools, "get_alert");
		const badgeSchema = getListedToolSchema(tools, "get_badge");
		const tasklistSchema = getListedToolSchema(tools, "get_tasklist");

		expect(alertSchema.description).toContain('role="alert"');
		expect(alertSchema.description).toContain('aria-hidden="true"');
		expect(alertSchema.properties.type.description).toContain("Status-Icon");
		expect(alertSchema.properties.body.description).toContain(
			"nur aus Header bestehen",
		);
		expect(alertSchema.properties.body.properties.links.description).toContain(
			"Arrow-Forward-Icon",
		);
		expect(
			alertSchema.properties.body.properties.listStyle.description,
		).toContain("kern-list");

		expect(badgeSchema.description).toContain("rein darstellend");
		expect(badgeSchema.properties.type.description).toContain(
			"optional das passende Status-Icon",
		);
		expect(badgeSchema.properties.text.description).toContain(
			"Status oder die Kategorie",
		);
		expect(badgeSchema.properties.showIcon.description).toContain(
			'aria-hidden="true"',
		);

		expect(tasklistSchema.description).toContain("Status-Badge");
		expect(tasklistSchema.properties.heading.description).toContain(
			"kern-heading-medium",
		);
		expect(tasklistSchema.properties.numbered.description).toContain(
			"kern-number",
		);
		expect(tasklistSchema.properties.items.description).toContain(
			"genau eine Tasklist",
		);
		expect(
			tasklistSchema.properties.items.items.properties.href.description,
		).toContain("nicht klickbarer Text");
		expect(
			tasklistSchema.properties.items.items.properties.statusType.description,
		).toContain("Badge-Variante");
	});

	it("progress and loader schemas document native element and accessibility semantics", () => {
		const registry = createRegistry([
			{
				id: "progress",
				title: "Progress",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "loader",
				title: "Loader",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const progressSchema = getListedToolSchema(tools, "get_progress");
		const loaderSchema = getListedToolSchema(tools, "get_loader");

		expect(progressSchema.description).toContain("HTML5-<progress>");
		expect(progressSchema.properties.value.description).toContain("<progress>");
		expect(progressSchema.properties.max.description).toContain("2 von 5");
		expect(progressSchema.properties.label.description).toContain("for/id");
		expect(progressSchema.properties.labelPosition.description).toContain(
			"oberhalb oder unterhalb",
		);

		expect(loaderSchema.description).toContain('role="status"');
		expect(loaderSchema.properties.visible.description).toContain(
			"kern-loader--visible",
		);
		expect(loaderSchema.properties.srText.description).toContain(
			"kern-sr-only",
		);
		expect(loaderSchema.properties.srText.description).toContain("Loading");
	});

	it("button and accordion schemas document x-small sizing and details semantics", () => {
		const registry = createRegistry([
			{
				id: "button",
				title: "Button",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "accordion",
				title: "Accordion",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const buttonSchema = getListedToolSchema(tools, "get_button");
		const accordionSchema = getListedToolSchema(tools, "get_accordion");
		const accordionVariants = schemaVariants(accordionSchema);

		expect(buttonSchema.description).toContain("Icon-only-Muster");
		expect(buttonSchema.properties.label.description).toContain("sr-only");
		expect(buttonSchema.properties.size.description).toContain("x-small");
		expect(buttonSchema.properties.size.description).toContain("Legacy-Alias");
		expect(buttonSchema.properties.icon.description).toContain(
			'aria-hidden="true"',
		);
		expect(buttonSchema.properties.labelVisibility.description).toContain(
			"sr-only-mobile",
		);

		expect(accordionSchema.description).toContain("single oder group");

		const accordionSingle = findVariant(
			accordionVariants,
			(variant) => variant.properties?.mode?.default === "single",
		);
		const accordionGroup = findVariant(
			accordionVariants,
			(variant) => variant.properties?.mode?.const === "group",
		);

		expect(accordionSingle.description).toContain("<details>/<summary>");
		expect(accordionSingle.properties.contentIsHtml.description).toContain(
			"vertrauenswuerdiges HTML",
		);
		expect(accordionGroup.description).toContain("kern-accordion-group");
		expect(accordionGroup.properties.items.description).toContain(
			"Flex- oder Grid-Einfluesse",
		);
		expect(
			accordionGroup.properties.items.items.properties.open.description,
		).toContain("open");
	});

	it("table schema documents caption labelling, numeric alignment, and current action-column limitation", () => {
		const registry = createRegistry([
			{
				id: "table",
				title: "Table",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const tableSchema = getListedToolSchema(tools, "get_table");

		expect(tableSchema.description).toContain("Daten-Tabellen");
		expect(tableSchema.description).toContain("Action-Column-Muster");
		expect(tableSchema.properties.caption.description).toContain(
			'<caption class="kern-title">',
		);
		expect(tableSchema.properties.headers.description).toContain('Scope="col"');
		expect(tableSchema.properties.rows.description).toContain('scope="row"');
		expect(tableSchema.properties.footer.description).toContain(
			"Action-Footer-Muster",
		);
		expect(tableSchema.properties.striped.description).toContain(
			"kern-table--striped",
		);
		expect(tableSchema.properties.responsive.description).toContain(
			'role="region"',
		);
		expect(tableSchema.properties.responsive.description).toContain(
			"aria-labelledby",
		);
	});

	it("icon and summary schemas document accessibility and description-list semantics", () => {
		const registry = createRegistry([
			{
				id: "icon",
				title: "Icon",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
			{
				id: "summary",
				title: "Summary",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const iconSchema = getListedToolSchema(tools, "get_icon");
		const summarySchema = getListedToolSchema(tools, "get_summary");
		const summaryVariants = schemaVariants(summarySchema);

		expect(iconSchema.description).toContain('aria-hidden="false"');
		expect(iconSchema.properties.name.description).toContain(
			"default-Modifier",
		);
		expect(iconSchema.properties.size.description).toContain("x-large");
		expect(iconSchema.properties.decorative.description).toContain(
			'aria-hidden="true"',
		);
		expect(iconSchema.properties.ariaLabel.description).toContain(
			"decorative=false",
		);

		expect(summarySchema.description).toContain("Bearbeitungslinks");
		expect(summarySchema.description).toContain("Tasklist");

		const summarySingle = findVariant(
			summaryVariants,
			(variant) => variant.properties?.mode?.const === "single",
		);
		const summaryGroup = findVariant(
			summaryVariants,
			(variant) => variant.properties?.mode?.const === "group",
		);

		expect(summarySingle.properties.items.description).toContain(
			"Description List",
		);
		expect(summarySingle.properties.action.description).toContain(
			"keinen Status",
		);
		expect(summarySingle.properties.headingLevel.description).toContain(
			"kern-title kern-title--small",
		);
		expect(summaryGroup.properties.groupHeadingLevel.description).toContain(
			"kern-heading-medium",
		);
		expect(summaryGroup.properties.summaries.description).toContain(
			"Summary-Aufgaben",
		);
	});

	it("inputgroup schema documents visual affixes and simplified contract", () => {
		const registry = createRegistry([
			{
				id: "inputgroup",
				title: "InputGroup",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const inputGroupSchema = getListedToolSchema(tools, "get_inputgroup");

		expect(inputGroupSchema.description).toContain(
			"einfache Textfeld-Variante",
		);
		expect(inputGroupSchema.description).toContain(
			"Button- oder Error-Kompositionen",
		);
		expect(inputGroupSchema.properties.prefix.description).toContain(
			"rein visuell",
		);
		expect(inputGroupSchema.properties.suffix.description).toContain(
			"Feldlabel",
		);
		expect(inputGroupSchema.properties.readonly.description).toContain(
			"schreibgeschützt",
		);
	});

	it("foundational typography schemas document current simplified renderer contracts", () => {
		const registry = createRegistry([
			{
				id: "heading",
				title: "Heading",
				status: "stable",
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
			{
				id: "body",
				title: "Body",
				status: "stable",
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
			{
				id: "label",
				title: "Label",
				status: "stable",
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
			{
				id: "lists",
				title: "Lists",
				status: "stable",
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
			{
				id: "title",
				title: "Title",
				status: "stable",
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const headingSchema = getListedToolSchema(tools, "get_heading");
		const bodySchema = getListedToolSchema(tools, "get_body");
		const labelSchema = getListedToolSchema(tools, "get_label");
		const listsSchema = getListedToolSchema(tools, "get_lists");
		const titleSchema = getListedToolSchema(tools, "get_title");

		expect(headingSchema.properties.level.description).toContain(
			"display bis small",
		);
		expect(headingSchema.properties.level.description).toContain(
			"kern-heading-medium",
		);

		expect(bodySchema.properties.size.description).toContain(
			"nicht jedoch muted",
		);
		expect(bodySchema.properties.bold.description).toContain("kern-body--bold");

		expect(labelSchema.properties.text.description).toContain("Label-Text");

		expect(listsSchema.properties.text.description).toContain(
			"Beispiel-Listeneintraege",
		);
		expect(listsSchema.properties.ordered.description).toContain(
			'<ol class="kern-list">',
		);
		expect(listsSchema.properties.ordered.description).toContain(
			"ungeordnete Liste",
		);

		expect(titleSchema.properties.size.description).toContain("KERN-Modifier");
		expect(titleSchema.properties.size.description).toContain("small");
	});

	it("foundational text and description schemas document simplified renderer contracts", () => {
		const registry = createRegistry([
			{
				id: "subline",
				title: "Subline",
				status: "stable",
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
			{
				id: "link",
				title: "Link",
				status: "stable",
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
			{
				id: "descriptionlist",
				title: "Description List",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
			{
				id: "preline",
				title: "Preline",
				status: "stable",
				category: "foundational",
				strategy: "typography",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const sublineSchema = getListedToolSchema(tools, "get_subline");
		const linkSchema = getListedToolSchema(tools, "get_link");
		const descriptionListSchema = getListedToolSchema(
			tools,
			"get_descriptionlist",
		);
		const prelineSchema = getListedToolSchema(tools, "get_preline");

		expect(sublineSchema.properties.text.description).toContain("Subline");
		expect(linkSchema.properties.href.description).toContain("href-Attribut");
		expect(linkSchema.properties.text.description).toContain("Link-Text");

		expect(descriptionListSchema.properties.items.description).toContain(
			"Begriff-Wert-Paar",
		);
		expect(descriptionListSchema.properties.stacked.description).toContain(
			"kern-description-list--col",
		);
		expect(
			descriptionListSchema.properties.items.items.properties.value.description,
		).toContain("kein verschachteltes HTML");

		expect(prelineSchema.properties.text.description).toContain("Preline");
	});

	it("fieldset, divider, and kopfzeile schemas document their current simplified contracts", () => {
		const registry = createRegistry([
			{
				id: "fieldset",
				title: "Fieldset",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
			{
				id: "divider",
				title: "Divider",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
			{
				id: "kopfzeile",
				title: "Kopfzeile",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const fieldsetSchema = getListedToolSchema(tools, "get_fieldset");
		const dividerSchema = getListedToolSchema(tools, "get_divider");
		const kopfzeileSchema = getListedToolSchema(tools, "get_kopfzeile");

		expect(fieldsetSchema.required).toEqual(["legend", "contentBlocks"]);
		expect(fieldsetSchema.properties.hint.description).toContain(
			"aria-describedby",
		);
		expect(fieldsetSchema.properties.horizontal.description).toContain(
			"side by side",
		);

		expect(dividerSchema.properties.decorative.description).toContain(
			'aria-hidden="true"',
		);

		expect(kopfzeileSchema.properties.title.description).toContain(
			"Offizielle Website",
		);
		expect(kopfzeileSchema.properties.includeNav.description).toContain(
			"Flagge",
		);
		expect(kopfzeileSchema.properties.includeNav.description).toContain(
			"Web-Component",
		);
	});

	it("get_grid schema documents containerFluid and row alignment guidance", () => {
		const registry = createRegistry([
			{
				id: "grid",
				title: "Grid",
				status: "stable",
				category: "foundational",
				strategy: "layout",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const schema = getListedToolSchema(tools, "get_grid");
		const listedTool = tools
			.listTools()
			.find((entry) => entry.name === "get_grid");

		expect(listedTool).toBeDefined();
		expect(listedTool?.description).toContain("responsive Breakpoints");
		expect(schema.properties.containerFluid.description).toContain(
			"kern-container-fluid",
		);
		expect(schema.properties.rowAlignment.description).toContain("kern-row");
		expect(schema.properties.columnsContent.description).toContain(
			"Side-by-Side-Layouts",
		);
	});

	it("get_card schema documents alt text, heading hierarchy, and interactive href", () => {
		const registry = createRegistry([
			{
				id: "card",
				title: "Card",
				status: "stable",
				category: "interactive",
				strategy: "interactive",
				guidance: { de: "", en: "" },
			},
		]);

		const tools = createTools(registry);
		const schema = getListedToolSchema(tools, "get_card");

		expect(schema.properties.media.properties.alt.description).toContain(
			"WCAG 1.1.1",
		);
		expect(
			schema.properties.header.properties.titleLevel.description,
		).toContain("WCAG 2.4.6");
		expect(schema.properties.header.properties.href.description).toContain(
			"interaktive Card",
		);
		expect(schema.properties.body.description).toContain("150 Zeichen");
		expect(
			schema.properties.footer.properties.secondaryLabel.description,
		).toContain("maximal zwei Aktionen");
	});

	it("get_section and get_disclosure schemas clarify composition-only guidance", () => {
		const tools = createTools(createRegistry([]));
		const sectionSchema = getListedToolSchema(tools, "get_section");
		const disclosureSchema = getListedToolSchema(tools, "get_disclosure");

		expect(sectionSchema.description).toContain(
			"repo-eigene Kompositionshilfe",
		);
		expect(sectionSchema.properties.contentBlocks.description).toContain(
			"empfohlen",
		);
		expect(sectionSchema.properties.paragraphs.description).toContain(
			"Für neue Aufrufe contentBlocks bevorzugen",
		);

		expect(disclosureSchema.description).toContain(
			"repo-eigene Kompositionshilfe",
		);
		expect(disclosureSchema.properties.triggerLabel.description).toContain(
			"<summary>",
		);
		expect(disclosureSchema.properties.content.description).toContain(
			"Für neue Aufrufe contentBlocks bevorzugen",
		);
	});

	it("listTools emits recursive $ref pointers for render_composition", () => {
		const tools = createTools(createRegistry([]));
		const schema = getListedToolSchema(tools, "render_composition");

		expect(schema.definitions).toBeUndefined();

		const recursiveNodes = schemaVariants(
			schema.properties.contentBlocks.items,
		);

		const sectionNode = recursiveNodes.find(
			(node) => node?.properties?.kind?.const === "section",
		);
		const gridNode = recursiveNodes.find(
			(node) => node?.properties?.kind?.const === "grid",
		);
		const cardNode = recursiveNodes.find(
			(node) => node?.properties?.kind?.const === "card",
		);
		const formFlowNode = recursiveNodes.find(
			(node) => node?.properties?.kind?.const === "formFlow",
		);

		expect(
			sectionNode?.properties?.section?.properties?.contentBlocks?.items?.$ref,
		).toBe("#/properties/contentBlocks/items");
		expect(
			gridNode?.properties?.grid?.properties?.columnsContent?.items?.items
				?.$ref,
		).toBe("#/properties/contentBlocks/items");
		expect(
			cardNode?.properties?.card?.properties?.contentBlocks?.items?.$ref,
		).toBe("#/properties/contentBlocks/items");
		expect(
			formFlowNode?.properties?.formFlow?.properties?.steps?.items?.properties
				?.contentBlocks?.items?.$ref,
		).toBe("#/properties/contentBlocks/items");
	});
});
